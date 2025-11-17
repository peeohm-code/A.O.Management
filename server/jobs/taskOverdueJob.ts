import { getDb } from "../db";
import { tasks, users, projects, notifications } from "../../drizzle/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { createNotification } from "../db";

/**
 * ตรวจสอบ Task ที่ล่าช้าและส่งการแจ้งเตือน
 * เงื่อนไข:
 * - Task ที่เลยวันสิ้นสุดแล้ว (endDate < today)
 * - Task ที่ยังไม่เสร็จสมบูรณ์ (progress < 100)
 * - ส่งการแจ้งเตือนไปยังผู้รับผิดชอบและ PM
 */
export async function checkOverdueTasks() {
  const db = await getDb();
  if (!db) {
    console.error("[Task Overdue] Database not available");
    return { success: false, message: "Database not available" };
  }

  // Check if tables exist before querying
  try {
    await db.execute(sql.raw(`SELECT 1 FROM tasks LIMIT 1`));
  } catch (tableError: any) {
    if (tableError.message?.includes("doesn't exist")) {
      console.warn("[Task Overdue] Tasks table doesn't exist yet, skipping check");
      return { success: true, message: "Tables not ready yet" };
    }
    throw tableError;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // ดึง Task ที่ล่าช้า
    const overdueTasks = await db
      .select({
        taskId: tasks.id,
        taskName: tasks.name,
        taskEndDate: tasks.endDate,
        taskProgress: tasks.progress,
        assigneeId: tasks.assigneeId,
        assigneeName: users.name,
        assigneeEmail: users.email,
        projectId: tasks.projectId,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          // Task ที่เลยกำหนดแล้ว
          sql`${tasks.endDate} IS NOT NULL AND ${tasks.endDate} < ${today}`,
          // Task ที่ยังไม่เสร็จ
          sql`${tasks.progress} < 100`
        )
      );


    let notificationsSent = 0;

    for (const task of overdueTasks) {
      // คำนวณจำนวนวันที่เกินกำหนด
      const daysOverdue = task.taskEndDate
        ? Math.ceil((new Date().getTime() - new Date(task.taskEndDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // เช็คว่าเคยส่ง notification สำหรับ task นี้ในวันนี้แล้วหรือยัง
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.relatedTaskId, task.taskId),
            eq(notifications.type, "task_overdue"),
            sql`${notifications.createdAt} >= ${todayStart.toISOString()}`
          )
        )
        .limit(1);

      // ถ้าเคยส่งไปแล้ววันนี้ ข้ามไป
      if (existingNotification.length > 0) {
        continue;
      }

      // ส่งการแจ้งเตือนไปยังผู้รับผิดชอบ (ถ้ามี)
      if (task.assigneeId) {
        await createNotification({
          userId: task.assigneeId,
          type: "task_overdue",
          title: `แจ้งเตือน: งานล่าช้า`,
          content: `งาน "${task.taskName}" ในโครงการ "${task.projectName}" เกินกำหนดแล้ว ${daysOverdue} วัน (ความคืบหน้า: ${task.taskProgress}%)`,
          relatedTaskId: task.taskId,
          relatedProjectId: task.projectId,
          priority: daysOverdue > 7 ? "urgent" : "high",
        });

        notificationsSent++;
      }

      // ส่งการแจ้งเตือนไปยัง PM ของโครงการ
      if (task.projectId) {
        // ดึงรายชื่อ PM ของโครงการ
        const projectManagers = await db
          .select({
            userId: users.id,
          })
          .from(users)
          .where(
            sql`${users.role} IN ('admin', 'project_manager')`
          );

        for (const pm of projectManagers) {
          // ไม่ส่งซ้ำถ้าเป็นคนเดียวกับผู้รับผิดชอบ
          if (pm.userId === task.assigneeId) continue;

          await createNotification({
            userId: pm.userId,
            type: "task_overdue",
            title: `แจ้งเตือน PM: งานล่าช้า`,
            content: `งาน "${task.taskName}" ในโครงการ "${task.projectName}" เกินกำหนดแล้ว ${daysOverdue} วัน (ผู้รับผิดชอบ: ${task.assigneeName || "ไม่ระบุ"}, ความคืบหน้า: ${task.taskProgress}%)`,
            relatedTaskId: task.taskId,
            relatedProjectId: task.projectId,
            priority: daysOverdue > 7 ? "urgent" : "high",
          });

          notificationsSent++;
        }
      }
    }

    return {
      success: true,
      message: `Sent ${notificationsSent} overdue task notifications`,
      count: notificationsSent,
      tasksChecked: overdueTasks.length,
    };
  } catch (error) {
    console.error("[Task Overdue] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
