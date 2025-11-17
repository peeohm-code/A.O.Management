import {
  createScheduledNotification,
  getPendingScheduledNotifications,
  updateScheduledNotificationStatus,
  getNotificationSettings,
  getUpcomingDeadlineTasks,
  getOverdueDefects,
  getDb,
} from "./db";
import { createNotification } from "./notificationService";
import { users, scheduledNotifications } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Notification Scheduler Service
 * 
 * ระบบแจ้งเตือนอัตโนมัติที่ทำงานตามเวลาที่กำหนด
 * - แจ้งเตือนก่อนถึง deadline ของงาน
 * - แจ้งเตือน defect ที่ค้างนาน
 * - ส่งสรุปรายวัน
 */

/**
 * ประมวลผลและส่ง scheduled notifications ที่ถึงเวลาแล้ว
 */
export async function processScheduledNotifications() {
  try {
    const pendingNotifications = await getPendingScheduledNotifications();
    
    if (pendingNotifications.length === 0) {
      return;
    }


    for (const notification of pendingNotifications) {
      try {
        // ตรวจสอบการตั้งค่าของ user
        const settings = await getNotificationSettings(notification.userId);
        
        if (!settings || !settings.enableInAppNotifications) {
          // User ปิดการแจ้งเตือน - ยกเลิก
          await updateScheduledNotificationStatus(notification.id, "cancelled");
          continue;
        }

        // ส่งการแจ้งเตือนจริง
        await createNotification({
          userId: notification.userId,
          type: notification.type as any,
          title: notification.title,
          content: notification.content || undefined,
          priority: notification.priority as any,
          relatedTaskId: notification.relatedTaskId || undefined,
          relatedDefectId: notification.relatedDefectId || undefined,
          relatedProjectId: notification.relatedProjectId || undefined,
        });

        // อัปเดตสถานะเป็น sent
        await updateScheduledNotificationStatus(notification.id, "sent");
      } catch (error) {
        console.error(`[NotificationScheduler] Failed to send notification #${notification.id}:`, error);
        await updateScheduledNotificationStatus(
          notification.id,
          "failed",
          (error as Error).message
        );
      }
    }
  } catch (error) {
    console.error("[NotificationScheduler] Error processing scheduled notifications:", error);
  }
}

/**
 * สร้าง scheduled notifications สำหรับ tasks ที่ใกล้ครบกำหนด
 */
export async function scheduleTaskDeadlineReminders() {
  try {
    const db = await getDb();
    if (!db) return;

    // ดึง users ทั้งหมดที่เปิดการแจ้งเตือน
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const settings = await getNotificationSettings(user.id);
      
      if (!settings || !settings.enableTaskDeadlineReminders) {
        continue;
      }

      const daysAdvance = settings.taskDeadlineDaysAdvance || 3;
      const upcomingTasks = await getUpcomingDeadlineTasks(daysAdvance);

      // กรอง tasks ที่ user เป็น assignee
      const userTasks = upcomingTasks.filter(task => task.assigneeId === user.id);

      for (const task of userTasks) {
        // คำนวณเวลาที่จะส่งการแจ้งเตือน (เช้าวันที่ deadline - daysAdvance)
        const taskEndDate = new Date(task.endDate!);
        const notificationDate = new Date(taskEndDate);
        notificationDate.setDate(notificationDate.getDate() - daysAdvance);
        notificationDate.setHours(8, 0, 0, 0); // ส่งเวลา 8:00 น.

        // ตรวจสอบว่ายังไม่เคยสร้าง notification นี้
        const existingResult = await db
          .select()
          .from(scheduledNotifications)
          .where(
            and(
              eq(scheduledNotifications.userId, user.id),
              eq(scheduledNotifications.relatedTaskId, task.id),
              eq(scheduledNotifications.type, "task_deadline_reminder"),
              eq(scheduledNotifications.scheduledFor, notificationDate)
            )
          )
          .limit(1);
        const existing = existingResult.length > 0 ? existingResult[0] : null;

        if (!existing) {
          await createScheduledNotification({
            type: "task_deadline_reminder",
            userId: user.id,
            relatedTaskId: task.id,
            relatedProjectId: task.projectId,
            scheduledFor: notificationDate,
            title: `งาน "${task.name}" ใกล้ครบกำหนด`,
            content: `งานนี้จะครบกำหนดในอีก ${daysAdvance} วัน (${task.endDate})`,
            priority: "high",
          });
        }
      }
    }
  } catch (error) {
    console.error("[NotificationScheduler] Error scheduling task deadline reminders:", error);
  }
}

/**
 * สร้าง scheduled notifications สำหรับ defects ที่ค้างนาน
 */
export async function scheduleDefectOverdueReminders() {
  try {
    const db = await getDb();
    if (!db) return;

    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const settings = await getNotificationSettings(user.id);
      
      if (!settings || !settings.enableDefectOverdueReminders) {
        continue;
      }

      const daysThreshold = settings.defectOverdueDaysThreshold || 7;
      const overdueDefects = await getOverdueDefects(daysThreshold);

      // กรอง defects ที่ user เกี่ยวข้อง (assignedTo หรือ reportedBy)
      const userDefects = overdueDefects.filter(
        defect => defect.assignedTo === user.id || defect.reportedBy === user.id
      );

      for (const defect of userDefects) {
        // สร้าง notification ทันที (ไม่ต้อง schedule)
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(defect.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // ตรวจสอบว่ายังไม่เคยสร้าง notification นี้ในวันนี้
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingResult = await db
          .select()
          .from(scheduledNotifications)
          .where(
            and(
              eq(scheduledNotifications.userId, user.id),
              eq(scheduledNotifications.relatedDefectId, defect.id),
              eq(scheduledNotifications.type, "defect_overdue_reminder")
            )
          )
          .limit(1);
        const existing = existingResult.length > 0 ? existingResult[0] : null;

        if (!existing) {
          await createScheduledNotification({
            type: "defect_overdue_reminder",
            userId: user.id,
            relatedDefectId: defect.id,
            relatedTaskId: defect.taskId,
            scheduledFor: new Date(), // ส่งทันที
            title: `Defect "${defect.title}" ค้างนาน ${daysSinceCreated} วัน`,
            content: `Defect นี้ยังไม่ได้รับการแก้ไข กรุณาดำเนินการโดยเร็ว`,
            priority: daysSinceCreated > 14 ? "urgent" : "high",
          });
        }
      }
    }
  } catch (error) {
    console.error("[NotificationScheduler] Error scheduling defect overdue reminders:", error);
  }
}

// Store interval references for cleanup
let notificationIntervals: NodeJS.Timeout[] = [];

/**
 * เริ่มต้น scheduler (เรียกใช้ทุก 5 นาที)
 */
export function startNotificationScheduler() {
  // Clear existing intervals to prevent duplicates
  stopNotificationScheduler();

  // ประมวลผล scheduled notifications ทุก 5 นาที
  const interval1 = setInterval(async () => {
    await processScheduledNotifications();
  }, 5 * 60 * 1000); // 5 minutes
  notificationIntervals.push(interval1);

  // สร้าง task deadline reminders ทุก 1 ชั่วโมง
  const interval2 = setInterval(async () => {
    await scheduleTaskDeadlineReminders();
  }, 60 * 60 * 1000); // 1 hour
  notificationIntervals.push(interval2);

  // สร้าง defect overdue reminders ทุก 6 ชั่วโมง
  const interval3 = setInterval(async () => {
    await scheduleDefectOverdueReminders();
  }, 6 * 60 * 60 * 1000); // 6 hours
  notificationIntervals.push(interval3);

  // รันครั้งแรกทันที
  processScheduledNotifications();
  scheduleTaskDeadlineReminders();
  scheduleDefectOverdueReminders();
}

/**
 * Stop notification scheduler and clean up intervals
 */
export function stopNotificationScheduler() {
  notificationIntervals.forEach(interval => clearInterval(interval));
  notificationIntervals = [];

}
