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
import { tasks, defects, users } from "../../drizzle/schema";
import { createNotification } from "../notificationService";
import { and, lte, gte, eq, isNull, or, sql } from "drizzle-orm";

/**
 * Check for tasks approaching deadline (configurable days before)
 */
async function checkTasksApproachingDeadline(daysAdvance: number = 3) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DeadlineReminders] Database not available");
      return;
    }

    // Check if tables exist before querying
    try {
      await db.execute(sql.raw(`SELECT 1 FROM tasks LIMIT 1`));
    } catch (tableError: any) {
      if (tableError.message?.includes("doesn't exist")) {
        console.warn("[DeadlineReminders] Tasks table doesn't exist yet, skipping check");
        return;
      }
      throw tableError;
    }

    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysAdvance);
    
    const nextDate = new Date();
    nextDate.setDate(now.getDate() + daysAdvance + 1);

    // Find tasks with endDate between target date and next date, not completed
    const approachingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.endDate, targetDate.toISOString().split('T')[0]),
          lte(tasks.endDate, nextDate.toISOString().split('T')[0]),
          or(
            eq(tasks.progress, 0),
            lte(tasks.progress, 99)
          )
        )
      );


    // Send notifications
    for (const task of approachingTasks) {
      if (task.assigneeId) {
        const daysText = daysAdvance === 1 ? "พรุ่งนี้" : `อีก ${daysAdvance} วัน`;
        await createNotification({
          userId: task.assigneeId,
          type: "task_deadline_approaching",
          title: "งานใกล้ครบกำหนด",
          content: `งาน "${task.name}" จะครบกำหนด${daysText} (${task.endDate})`,
          priority: daysAdvance === 1 ? "urgent" : "high",
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

    // Check if tables exist before querying
    try {
      await db.execute(sql.raw(`SELECT 1 FROM tasks LIMIT 1`));
    } catch (tableError: any) {
      if (tableError.message?.includes("doesn't exist")) {
        console.warn("[DeadlineReminders] Tasks table doesn't exist yet, skipping check");
        return;
      }
      throw tableError;
    }

    const today = new Date();

    // Find tasks that are past endDate and not completed
    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          lte(tasks.endDate, today.toISOString().split('T')[0]),
          or(
            eq(tasks.progress, 0),
            lte(tasks.progress, 99)
          )
        )
      );


    // Send notifications (only once per day to avoid spam)
    for (const task of overdueTasks) {
      if (task.assigneeId) {
        await createNotification({
          userId: task.assigneeId,
          type: "task_overdue",
          title: "งานเกินกำหนด",
          content: `งาน "${task.name}" เลยกำหนดแล้ว (ครบกำหนด: ${task.endDate})`,
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
 * Check for defects approaching deadline (configurable days before)
 */
async function checkDefectsApproachingDeadline(daysAdvance: number = 3) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DeadlineReminders] Database not available");
      return;
    }

    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysAdvance);
    
    const nextDate = new Date();
    nextDate.setDate(now.getDate() + daysAdvance + 1);

    // Find defects with dueDate between target date and next date, not closed
    const approachingDefects = await db
      .select()
      .from(defects)
      .where(
        and(
          gte(defects.dueDate, targetDate),
          lte(defects.dueDate, nextDate),
          or(
            eq(defects.status, "reported"),
            eq(defects.status, "analysis"),
            eq(defects.status, "in_progress"),
            eq(defects.status, "resolved")
          )
        )
      );


    // Send notifications
    for (const defect of approachingDefects) {
      if (defect.assignedTo) {
        const daysText = daysAdvance === 1 ? "พรุ่งนี้" : `อีก ${daysAdvance} วัน`;
        await createNotification({
          userId: defect.assignedTo,
          type: "defect_deadline_approaching",
          title: `${defect.type} ใกล้ครบกำหนด`,
          content: `${defect.type} "${defect.title}" จะครบกำหนด${daysText} (${defect.dueDate?.toLocaleDateString('th-TH')})`,
          priority: daysAdvance === 1 ? "urgent" : "high",
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
 * Checks for 3 days, 1 day advance, and overdue items
 */
export async function runDeadlineReminders() {
  
  const startTime = Date.now();
  
  // Check multiple time windows: 3 days, 1 day, and overdue
  const [
    approachingTasks3Days,
    approachingTasks1Day,
    overdueTasks,
    approachingDefects3Days,
    approachingDefects1Day,
  ] = await Promise.all([
    checkTasksApproachingDeadline(3),
    checkTasksApproachingDeadline(1),
    checkOverdueTasks(),
    checkDefectsApproachingDeadline(3),
    checkDefectsApproachingDeadline(1),
  ]);
  
  const duration = Date.now() - startTime;
  
  
  return {
    approachingTasks3Days,
    approachingTasks1Day,
    overdueTasks,
    approachingDefects3Days,
    approachingDefects1Day,
    duration,
  };
}

// If run directly (for testing)
// Note: Use `tsx server/cron/deadlineReminders.ts` to test manually
