/**
 * Deadline Reminders Cron Job
 * 
 * Runs daily to check for:
 * - Tasks approaching deadline (3 days before)
 * - Tasks overdue
 * - Defects approaching deadline (3 days before)
 * 
 * Sends notifications via notification service
 */

import { getDb } from "../db";
import { tasks, defects } from "../../drizzle/schema";
import { createNotification } from "../notificationService";
import { and, lte, gte, eq, isNull, or } from "drizzle-orm";

/**
 * Check for tasks approaching deadline (3 days before)
 */
async function checkTasksApproachingDeadline() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DeadlineReminders] Database not available");
      return;
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(now.getDate() + 4);

    // Find tasks with endDate between 3-4 days from now and not completed
    const approachingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.endDate, threeDaysFromNow),
          lte(tasks.endDate, fourDaysFromNow),
          or(
            eq(tasks.progress, 0),
            lte(tasks.progress, 99)
          )
        )
      );

    console.log(`[DeadlineReminders] Found ${approachingTasks.length} tasks approaching deadline`);

    // Send notifications
    for (const task of approachingTasks) {
      if (task.assigneeId) {
        await createNotification({
          userId: task.assigneeId,
          type: "task_deadline_approaching",
          title: "งานใกล้ครบกำหนด",
          content: `งาน "${task.name}" จะครบกำหนดในอีก 3 วัน (${task.endDate?.toLocaleDateString('th-TH')})`,
          priority: "high",
          relatedTaskId: task.id,
          relatedProjectId: task.projectId,
          sendEmail: true,
        });
      }
    }

    return approachingTasks.length;
  } catch (error) {
    console.error("[DeadlineReminders] Error checking approaching tasks:", error);
    return 0;
  }
}

/**
 * Check for overdue tasks
 */
async function checkOverdueTasks() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DeadlineReminders] Database not available");
      return;
    }

    const now = new Date();

    // Find tasks with endDate in the past and not completed
    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          lte(tasks.endDate, now),
          or(
            eq(tasks.progress, 0),
            lte(tasks.progress, 99)
          )
        )
      );

    console.log(`[DeadlineReminders] Found ${overdueTasks.length} overdue tasks`);

    // Send notifications (only once per day to avoid spam)
    for (const task of overdueTasks) {
      if (task.assigneeId) {
        await createNotification({
          userId: task.assigneeId,
          type: "task_overdue",
          title: "งานเกินกำหนด",
          content: `งาน "${task.name}" เกินกำหนดแล้ว (กำหนดเสร็จ: ${task.endDate?.toLocaleDateString('th-TH')})`,
          priority: "urgent",
          relatedTaskId: task.id,
          relatedProjectId: task.projectId,
          sendEmail: true,
        });
      }
    }

    return overdueTasks.length;
  } catch (error) {
    console.error("[DeadlineReminders] Error checking overdue tasks:", error);
    return 0;
  }
}

/**
 * Check for defects approaching deadline (3 days before)
 */
async function checkDefectsApproachingDeadline() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DeadlineReminders] Database not available");
      return;
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(now.getDate() + 4);

    // Find defects with dueDate between 3-4 days from now and not closed
    const approachingDefects = await db
      .select()
      .from(defects)
      .where(
        and(
          gte(defects.dueDate, threeDaysFromNow),
          lte(defects.dueDate, fourDaysFromNow),
          or(
            eq(defects.status, "reported"),
            eq(defects.status, "analysis"),
            eq(defects.status, "in_progress"),
            eq(defects.status, "resolved")
          )
        )
      );

    console.log(`[DeadlineReminders] Found ${approachingDefects.length} defects approaching deadline`);

    // Send notifications
    for (const defect of approachingDefects) {
      if (defect.assignedTo) {
        await createNotification({
          userId: defect.assignedTo,
          type: "defect_deadline_approaching",
          title: `${defect.type} ใกล้ครบกำหนด`,
          content: `${defect.type} "${defect.title}" จะครบกำหนดในอีก 3 วัน (${defect.dueDate?.toLocaleDateString('th-TH')})`,
          priority: "high",
          relatedDefectId: defect.id,
          relatedTaskId: defect.taskId,
          sendEmail: true,
        });
      }
    }

    return approachingDefects.length;
  } catch (error) {
    console.error("[DeadlineReminders] Error checking approaching defects:", error);
    return 0;
  }
}

/**
 * Main function to run all deadline checks
 */
export async function runDeadlineReminders() {
  console.log("[DeadlineReminders] Starting deadline reminder checks...");
  
  const startTime = Date.now();
  
  const [approachingTasks, overdueTasks, approachingDefects] = await Promise.all([
    checkTasksApproachingDeadline(),
    checkOverdueTasks(),
    checkDefectsApproachingDeadline(),
  ]);
  
  const duration = Date.now() - startTime;
  
  console.log(`[DeadlineReminders] Completed in ${duration}ms`);
  console.log(`[DeadlineReminders] Summary:`);
  console.log(`  - Tasks approaching deadline: ${approachingTasks}`);
  console.log(`  - Overdue tasks: ${overdueTasks}`);
  console.log(`  - Defects approaching deadline: ${approachingDefects}`);
  
  return {
    approachingTasks,
    overdueTasks,
    approachingDefects,
    duration,
  };
}

// If run directly (for testing)
// Note: Use `tsx server/cron/deadlineReminders.ts` to test manually
