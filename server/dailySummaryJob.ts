import { getDb } from "./db";
import { users, projects, tasks, taskChecklists, defects, activityLog } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { generateDailySummaryEmail } from "./emailTemplates";
import { notifyOwner } from "./_core/notification";

/**
 * Daily Summary Job - ส่งอีเมลสรุปรายวันให้ผู้ใช้ที่เปิดใช้งาน
 * เรียกใช้ทุกวันตามเวลาที่ผู้ใช้ตั้งค่าไว้
 */
export async function sendDailySummaryEmails() {
  const db = await getDb();
  if (!db) {
    console.error("[Daily Summary] Database not available");
    return;
  }

  try {
    // ดึงรายชื่อผู้ใช้ที่เปิดใช้งาน Daily Summary Email
    const usersWithDailySummary = await db
      .select()
      .from(users)
      .where(eq(users.enableDailySummaryEmail, true));

    console.log(`[Daily Summary] Found ${usersWithDailySummary.length} users with daily summary enabled`);

    for (const user of usersWithDailySummary) {
      try {
        await sendDailySummaryToUser(user.id, user.name || "ผู้ใช้", user.email || "");
      } catch (error) {
        console.error(`[Daily Summary] Error sending to user ${user.id}:`, error);
      }
    }

    console.log("[Daily Summary] Job completed");
  } catch (error) {
    console.error("[Daily Summary] Job failed:", error);
  }
}

/**
 * ส่งอีเมลสรุปรายวันให้ผู้ใช้คนหนึ่ง
 */
async function sendDailySummaryToUser(userId: number, userName: string, userEmail: string) {
  const db = await getDb();
  if (!db) return;

  // วันที่วันนี้
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // 1. ดึงข้อมูลโครงการที่ผู้ใช้เกี่ยวข้อง
  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects);

  const projectsData = await Promise.all(
    userProjects.map(async (project) => {
      // นับงานที่ล่าช้า (endDate < today และ progress < 100)
      const tasksOverdueResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, project.id),
            sql`${tasks.endDate} < ${todayStr}`,
            sql`${tasks.progress} < 100`
          )
        );
      const tasksOverdue = Number(tasksOverdueResult[0]?.count || 0);

      // นับงานที่เสร็จสิ้นวันนี้
      const tasksCompletedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, project.id),
            eq(tasks.status, "completed"),
            sql`DATE(${tasks.updatedAt}) = ${todayStr}`
          )
        );
      const tasksCompleted = Number(tasksCompletedResult[0]?.count || 0);

      // นับ checklist ที่รอการตรวจสอบ
      const checklistsPendingResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(taskChecklists)
        .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
        .where(
          and(
            eq(tasks.projectId, project.id),
            eq(taskChecklists.status, "pending_inspection")
          )
        );
      const checklistsPending = Number(checklistsPendingResult[0]?.count || 0);

      // นับข้อบกพร่องที่ยังไม่แก้ไข
      const defectsOpenResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(defects)
        .innerJoin(tasks, eq(defects.taskId, tasks.id))
        .where(
          and(
            eq(tasks.projectId, project.id),
            sql`${defects.status} IN ('open', 'in_progress')`
          )
        );
      const defectsOpen = Number(defectsOpenResult[0]?.count || 0);

      return {
        id: project.id,
        name: project.name,
        tasksOverdue,
        tasksCompleted,
        checklistsPending,
        defectsOpen,
      };
    })
  );

  // 2. ดึงงานที่ใกล้ครบกำหนด (7 วันข้างหน้า)
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const upcomingTasks = await db
    .select({
      taskName: tasks.name,
      projectName: projects.name,
      dueDate: tasks.endDate,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        sql`${tasks.endDate} >= ${todayStr}`,
        sql`${tasks.endDate} <= ${sevenDaysLater}`,
        sql`${tasks.progress} < 100`
      )
    )
    .orderBy(tasks.endDate)
    .limit(10);

  const upcomingDeadlines = upcomingTasks.map((task) => {
    const dueDate = new Date(task.dueDate || todayStr);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      taskName: task.taskName,
      projectName: task.projectName,
      dueDate: task.dueDate || "",
      daysRemaining,
    };
  });

  // 3. ดึงกิจกรรมล่าสุด (24 ชั่วโมงที่ผ่านมา)
  const recentActivitiesRaw = await db
    .select({
      action: activityLog.action,
      details: activityLog.details,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.userId, userId),
        sql`${activityLog.createdAt} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      )
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(10);

  const recentActivities = recentActivitiesRaw.map((activity) => ({
    action: translateAction(activity.action),
    details: activity.details || "",
    time: formatTime(activity.createdAt),
  }));

  // 4. สร้างอีเมล HTML
  const emailHtml = generateDailySummaryEmail({
    userName,
    date: formatDateThai(today),
    projects: projectsData,
    upcomingDeadlines,
    recentActivities,
  });

  // 5. ส่งอีเมล (ใช้ notifyOwner เป็นตัวอย่าง - ในการใช้งานจริงควรใช้ email service)
  // TODO: Replace with actual email service
  console.log(`[Daily Summary] Email generated for ${userName} (${userEmail})`);
  console.log(`[Daily Summary] Projects: ${projectsData.length}, Deadlines: ${upcomingDeadlines.length}, Activities: ${recentActivities.length}`);

  // ส่งการแจ้งเตือนให้ owner ว่ามีการส่งอีเมลสรุปรายวัน
  await notifyOwner({
    title: `Daily Summary sent to ${userName}`,
    content: `Email summary generated with ${projectsData.length} projects, ${upcomingDeadlines.length} upcoming deadlines, and ${recentActivities.length} recent activities.`,
  });
}

/**
 * Helper functions
 */
function translateAction(action: string): string {
  const translations: Record<string, string> = {
    project_created: "สร้างโครงการ",
    project_updated: "อัพเดทโครงการ",
    task_created: "สร้างงาน",
    task_updated: "อัพเดทงาน",
    task_status_changed: "เปลี่ยนสถานะงาน",
    task_progress_updated: "อัพเดทความคืบหน้า",
    inspection_completed: "ตรวจสอบเสร็จสิ้น",
    defect_created: "สร้างข้อบกพร่อง",
    defect_updated: "อัพเดทข้อบกพร่อง",
    comment_added: "เพิ่มความคิดเห็น",
    file_uploaded: "อัพโหลดไฟล์",
  };
  return translations[action] || action;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours < 1) {
    return `${minutes} นาทีที่แล้ว`;
  } else if (hours < 24) {
    return `${hours} ชั่วโมงที่แล้ว`;
  } else {
    return new Date(date).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function formatDateThai(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
