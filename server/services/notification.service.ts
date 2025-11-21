import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  notifications,
  type Notification,
  type InsertNotification,
} from "../../drizzle/schema";

/**
 * Notification Service
 * Handles all notification-related operations
 */

// ============================================================================
// Notification CRUD Operations
// ============================================================================

export async function createNotification(
  data: InsertNotification
): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  const [created] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, insertId));

  if (!created) throw new Error("Failed to create notification");
  return created;
}

export async function getNotificationById(
  notificationId: number
): Promise<Notification | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [notification] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));

  return notification;
}

export async function getNotificationsByUser(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.id, notificationId));

  const [updated] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));

  if (!updated) throw new Error("Notification not found after update");
  return updated;
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
}

export async function deleteNotification(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(notifications).where(eq(notifications.id, notificationId));
}

export async function deleteAllNotifications(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(notifications).where(eq(notifications.userId, userId));
}

// ============================================================================
// Notification Statistics
// ============================================================================

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const unread = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));;

  return unread.length;
}

// ============================================================================
// Bulk Notification Creation
// ============================================================================

export async function createBulkNotifications(
  userIds: number[],
  data: Omit<InsertNotification, "userId">
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const notificationsData = userIds.map((userId) => ({
    ...data,
    userId,
  }));

  await db.insert(notifications).values(notificationsData);
}

// ============================================================================
// Notification Templates
// ============================================================================

export async function notifyTaskAssignment(
  userId: number,
  taskId: number,
  taskTitle: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: "task_assigned",
    title: "งานใหม่ถูกมอบหมาย",
    content: `คุณได้รับมอบหมายงาน: ${taskTitle}`,
    relatedTaskId: taskId,
  });
}

export async function notifyDefectAssignment(
  userId: number,
  defectId: number,
  defectTitle: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: "defect_assigned",
    title: "ข้อบกพร่องใหม่ถูกมอบหมาย",
    content: `คุณได้รับมอบหมายข้อบกพร่อง: ${defectTitle}`,
    relatedDefectId: defectId,
  });
}

export async function notifyTaskDueSoon(
  userId: number,
  taskId: number,
  taskTitle: string,
  dueDate: Date
): Promise<Notification> {
  return createNotification({
    userId,
    type: "task_deadline_approaching",
    title: "งานใกล้ครบกำหนด",
    content: `งาน "${taskTitle}" จะครบกำหนดในวันที่ ${dueDate.toLocaleDateString("th-TH")}`,
    relatedTaskId: taskId,
  });
}

export async function notifyQCInspectionScheduled(
  userId: number,
  inspectionId: number,
  inspectionTitle: string,
  scheduledDate: Date
): Promise<Notification> {
  return createNotification({
    userId,
    type: "inspection_requested",
    title: "การตรวจสอบ QC ถูกกำหนดเวลา",
    content: `การตรวจสอบ "${inspectionTitle}" กำหนดไว้ในวันที่ ${scheduledDate.toLocaleDateString("th-TH")}`,
    relatedTaskId: inspectionId,
  });
}

export async function notifyProjectUpdate(
  userIds: number[],
  projectId: number,
  updateMessage: string
): Promise<void> {
  await createBulkNotifications(userIds, {
    type: "project_status_changed",
    title: "อัปเดตโครงการ",
    content: updateMessage,
    relatedProjectId: projectId,
  });
}
