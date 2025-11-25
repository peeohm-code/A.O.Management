import { getDb } from "../db";
import { taskChecklists, tasks, users, checklistTemplates } from "../../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { createNotification } from "../db";

/**
 * ตรวจสอบ Checklist ที่ใกล้ครบกำหนดและส่งการแจ้งเตือน
 * เงื่อนไข:
 * - Checklist ที่มีสถานะ pending_inspection หรือ not_started
 * - Task ที่ยังไม่เสร็จสมบูรณ์ (progress < 100)
 * - Task ที่ใกล้ถึงวันสิ้นสุด (เหลือ 3 วันหรือน้อยกว่า)
 */
export async function checkChecklistReminders() {
  const db = await getDb();
  if (!db) {
    console.error("[Checklist Reminder] Database not available");
    return { success: false, message: "Database not available" };
  }

  // Check if tables exist before querying
  try {
    await db.execute(sql.raw(`SELECT 1 FROM taskChecklists LIMIT 1`));
  } catch (tableError: any) {
    if (tableError.message?.includes("doesn't exist")) {
      console.warn("[Checklist Reminder] TaskChecklists table doesn't exist yet, skipping check");
      return { success: true, message: "Tables not ready yet" };
    }
    throw tableError;
  }

  try {
    // คำนวณวันที่ 3 วันข้างหน้า
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    // ดึง Checklist ที่ต้องแจ้งเตือน
    const checklistsToRemind = await db
      .select({
        checklistId: taskChecklists.id,
        checklistStatus: taskChecklists.status,
        taskId: tasks.id,
        taskName: tasks.name,
        taskEndDate: tasks.endDate,
        taskProgress: tasks.progress,
        assigneeId: tasks.assigneeId,
        assigneeName: users.name,
        assigneeEmail: users.email,
        projectId: tasks.projectId,
        templateName: checklistTemplates.name,
      })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
      .where(
        and(
          // Checklist ที่ยังไม่ได้ตรวจสอบ
          sql`${taskChecklists.status} IN ('pending_inspection', 'not_started')`,
          // Task ที่ยังไม่เสร็จ
          sql`${tasks.progress} < 100`,
          // Task ที่ใกล้ครบกำหนด (เหลือ 3 วันหรือน้อยกว่า)
          sql`${tasks.endDate} IS NOT NULL AND ${tasks.endDate} <= ${threeDaysStr}`
        )
      );


    let notificationsSent = 0;

    for (const checklist of checklistsToRemind) {
      if (!checklist.assigneeId) {
        continue;
      }

      // คำนวณจำนวนวันที่เหลือ
      const daysRemaining = checklist.taskEndDate
        ? Math.ceil((new Date(checklist.taskEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const isOverdue = daysRemaining < 0;
      const urgencyText = isOverdue
        ? `เกินกำหนดแล้ว ${Math.abs(daysRemaining)} วัน`
        : `เหลือเวลาอีก ${daysRemaining} วัน`;

      // สร้างการแจ้งเตือน
      await createNotification({
        userId: checklist.assigneeId,
        type: "checklist_reminder",
        title: `แจ้งเตือน: Checklist ใกล้ครบกำหนด`,
        content: `งาน "${checklist.taskName}" มี Checklist "${checklist.templateName}" ที่ยังไม่ได้ตรวจสอบ (${urgencyText})`,
        relatedTaskId: checklist.taskId,
        relatedProjectId: checklist.projectId,
        priority: isOverdue ? "urgent" : "high",
      });

      notificationsSent++;
    }

    return {
      success: true,
      message: `Sent ${notificationsSent} checklist reminders`,
      count: notificationsSent,
    };
  } catch (error) {
    console.error("[Checklist Reminder] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
