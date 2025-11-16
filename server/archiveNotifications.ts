import { getDb } from "./db";
import { and, isNotNull, sql } from "drizzle-orm";
import { projects } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

/**
 * Check for archived projects that are approaching 5 years
 * and send notifications to owner
 */
export async function checkArchiveWarnings() {
  const db = await getDb();
  if (!db) {
    console.warn("[ArchiveNotifications] Database not available");
    return { checked: 0, notified: 0 };
  }

  try {
    // Find projects archived for more than 4.5 years (notify 6 months before 5 year mark)
    const fourPointFiveYearsAgo = new Date();
    fourPointFiveYearsAgo.setFullYear(fourPointFiveYearsAgo.getFullYear() - 4);
    fourPointFiveYearsAgo.setMonth(fourPointFiveYearsAgo.getMonth() - 6);

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    // Get projects that are archived and approaching 5 years
    const archivedProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          isNotNull(projects.archivedAt),
          sql`${projects.archivedAt} <= ${fourPointFiveYearsAgo}`,
          sql`${projects.archivedAt} > ${fiveYearsAgo}`
        )
      );


    let notifiedCount = 0;

    for (const project of archivedProjects) {
      const archivedDate = new Date(project.archivedAt!);
      const now = new Date();
      const yearsArchived = (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      const daysUntilDeletion = Math.ceil((5 - yearsArchived) * 365);

      // Send notification to owner
      const notified = await notifyOwner({
        title: `⚠️ โครงการใกล้ถึงกำหนดลบ: ${project.name}`,
        content: `โครงการ "${project.name}" (${project.code || project.id}) ถูก archive มาแล้ว ${yearsArchived.toFixed(1)} ปี\n\nเหลือเวลาอีก ${daysUntilDeletion} วัน ก่อนที่จะสามารถลบได้\n\nกรุณาดาวน์โหลดข้อมูลสำรองก่อนลบโครงการ`,
      });

      if (notified) {
        notifiedCount++;
      }
    }

    // Also check for projects that are already past 5 years
    const projectsReadyToDelete = await db
      .select()
      .from(projects)
      .where(
        and(
          isNotNull(projects.archivedAt),
          sql`${projects.archivedAt} <= ${fiveYearsAgo}`
        )
      );

    if (projectsReadyToDelete.length > 0) {
      
      const projectList = projectsReadyToDelete
        .map((p: any) => `- ${p.name} (${p.code || p.id})`)
        .join('\n');

      await notifyOwner({
        title: `🗑️ มีโครงการพร้อมลบ (${projectsReadyToDelete.length} โครงการ)`,
        content: `โครงการเหล่านี้ถูก archive มากกว่า 5 ปีแล้ว และสามารถลบได้:\n\n${projectList}\n\nกรุณาตรวจสอบและดาวน์โหลดข้อมูลก่อนลบ`,
      });
      
      notifiedCount++;
    }

    return {
      checked: archivedProjects.length + projectsReadyToDelete.length,
      notified: notifiedCount,
    };
  } catch (error) {
    console.error("[ArchiveNotifications] Error checking archive warnings:", error);
    return { checked: 0, notified: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get archive warning status for a specific project
 */
export function getArchiveWarningStatus(archivedAt: Date | null): {
  yearsArchived: number;
  daysUntilDeletion: number;
  canDelete: boolean;
  warningLevel: "none" | "info" | "warning" | "danger";
} {
  if (!archivedAt) {
    return {
      yearsArchived: 0,
      daysUntilDeletion: 0,
      canDelete: false,
      warningLevel: "none",
    };
  }

  const now = new Date();
  const archivedDate = new Date(archivedAt);
  const yearsArchived = (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const daysUntilDeletion = Math.ceil((5 - yearsArchived) * 365);
  const canDelete = yearsArchived >= 5;

  let warningLevel: "none" | "info" | "warning" | "danger" = "none";
  if (canDelete) {
    warningLevel = "danger";
  } else if (yearsArchived >= 4.5) {
    warningLevel = "warning";
  } else if (yearsArchived >= 4) {
    warningLevel = "info";
  }

  return {
    yearsArchived,
    daysUntilDeletion,
    canDelete,
    warningLevel,
  };
}
