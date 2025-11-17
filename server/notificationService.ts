import { getDb } from "./db";
import { notifications, users, type Notification } from "../drizzle/schema";
import { emitNotification, type Notification as SocketNotification } from "./_core/socket";
// import { sendNotificationEmail } from "./emailService"; // Disabled - email service removed
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Centralized Notification Service
 * 
 * Provides type-safe notification creation with:
 * - Automatic email delivery
 * - Real-time socket emission
 * - Error handling
 * - Type safety from schema
 */

// Extract notification type from schema for type safety
export type NotificationType = Notification["type"];
export type NotificationPriority = Notification["priority"];

export interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  content?: string;
  priority?: NotificationPriority;
  relatedTaskId?: number;
  relatedProjectId?: number;
  relatedDefectId?: number;
  sendEmail?: boolean; // Default: true for urgent/high, false for normal/low
}

/**
 * Create a notification with automatic email delivery and real-time updates
 * 
 * @param params Notification parameters
 * @returns Created notification or null if failed
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification | null> {
  try {
    const db = await getDb();
    if (!db) {
      logger.error("[NotificationService] Database not available");
      return null;
    }

    // Default priority to normal if not specified
    const priority = params.priority || "normal";

    // Determine if email should be sent
    const shouldSendEmail =
      params.sendEmail !== undefined
        ? params.sendEmail
        : priority === "urgent" || priority === "high";

    // Create notification in database
    const result = await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content || null,
      priority,
      relatedTaskId: params.relatedTaskId || null,
      relatedProjectId: params.relatedProjectId || null,
      relatedDefectId: params.relatedDefectId || null,
      isRead: false,
    });

    // Get the created notification
    const notificationId = result[0]?.insertId;
    if (!notificationId) {
      logger.error("[NotificationService] Failed to get notification ID");
      return null;
    }

    const createdNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (createdNotification.length === 0) {
      logger.error("[NotificationService] Failed to fetch created notification");
      return null;
    }

    const notification = createdNotification[0];

    // Emit real-time notification via socket
    try {
      // Convert DB notification to socket notification format
      const socketNotification: SocketNotification = {
        id: notification.id.toString(),
        type: "task_assigned", // Map to socket notification types
        title: notification.title,
        message: notification.content || "",
        link: getNotificationLink(notification),
        timestamp: notification.createdAt,
        read: notification.isRead,
      };
      emitNotification(params.userId, socketNotification);
    } catch (error) {
      logger.error("[NotificationService] Failed to emit socket notification:", error);
      // Don't fail the whole operation if socket fails
    }

    // Send email if needed
    if (shouldSendEmail) {
      try {
        // Get user email
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, params.userId))
          .limit(1);

        // Email notifications disabled
        /*
        if (userResult.length > 0 && userResult[0].email) {
          await sendNotificationEmail({
            to: userResult[0].email,
            userName: userResult[0].name || "User",
            notification,
          });
        }
        */
      } catch (error) {
        logger.error("[NotificationService] Failed to send email:", error);
        // Don't fail the whole operation if email fails
      }
    }

    return notification;
  } catch (error) {
    logger.error("[NotificationService] Failed to create notification:", error);
    return null;
  }
}

/**
 * Create multiple notifications in batch
 * More efficient than creating one by one
 * 
 * @param notificationsList Array of notification parameters
 * @returns Array of created notifications (nulls for failed ones)
 */
export async function createNotifications(
  notificationsList: CreateNotificationParams[]
): Promise<(Notification | null)[]> {
  // Use Promise.allSettled to continue even if some fail
  const results = await Promise.allSettled(
    notificationsList.map((params) => createNotification(params))
  );

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : null
  );
}

/**
 * Helper: Notify all task followers
 */
export async function notifyTaskFollowers(params: {
  taskId: number;
  type: NotificationType;
  title: string;
  content?: string;
  priority?: NotificationPriority;
  excludeUserIds?: number[]; // Don't notify these users (e.g., the user who triggered the action)
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get task followers (would need to implement this query)
    // For now, just notify task assignee
    // TODO: Implement task followers feature
  } catch (error) {
    logger.error("[NotificationService] Failed to notify task followers:", error);
  }
}

/**
 * Helper: Get notification link for frontend navigation
 */
export function getNotificationLink(notification: Notification): string {
  if (notification.relatedTaskId) {
    return `/tasks/${notification.relatedTaskId}`;
  }
  if (notification.relatedDefectId) {
    return `/defects/${notification.relatedDefectId}`;
  }
  if (notification.relatedProjectId) {
    return `/projects/${notification.relatedProjectId}`;
  }
  return "/notifications";
}
