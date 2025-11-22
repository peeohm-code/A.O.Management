import { eq, desc } from "drizzle-orm";
import {
  notifications,
  pushSubscriptions,
  scheduledNotifications,
  notificationSettings,
  InsertPushSubscription,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";
import { boolToInt } from "../utils/typeHelpers";

/**
 * Notification Repository
 * 
 * Handles all notification-related database operations including:
 * - In-app notifications
 * - Push subscriptions
 * - Scheduled notifications
 * - Notification settings
 */
export class NotificationRepository extends BaseRepository {
  /**
   * Create notification
   */
  async createNotification(data: {
    userId: number;
    type: "task_assigned" | "task_status_changed" | "task_deadline_approaching" | "task_overdue" | "task_progress_updated" | "task_comment_mention" | "inspection_requested" | "inspection_completed" | "inspection_passed" | "inspection_failed" | "checklist_assigned" | "checklist_reminder" | "reinspection_required" | "defect_assigned" | "defect_created" | "defect_status_changed" | "defect_resolved" | "defect_reinspected" | "defect_deadline_approaching" | "project_member_added" | "project_milestone_reached" | "project_status_changed" | "file_uploaded" | "comment_added" | "dependency_blocked" | "comment_mention" | "task_updated" | "deadline_reminder" | "system_health_warning" | "system_health_critical" | "system_health_info";
    title: string;
    content?: string;
    priority?: "urgent" | "high" | "normal" | "low";
    relatedTaskId?: number;
    relatedProjectId?: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const result = await this.db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      priority: data.priority || 'normal',
      relatedTaskId: data.relatedTaskId,
      relatedProjectId: data.relatedProjectId,
      isRead: 0,
    });

    // Return the created notification with ID
    const insertId = (result as any).insertId;
    if (insertId) {
      const created = await this.db.select().from(notifications).where(eq(notifications.id, Number(insertId))).limit(1);
      return created[0];
    }
    
    return null;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: number, limit = 50) {
    if (!this.db) return [];

    try {
      const result = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
      
      return Array.isArray(result) ? result : [];
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    try {
      const result = await this.db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
      return result;
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    try {
      const result = await this.db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId));
      return result;
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error updating notifications:', error);
      throw error;
    }
  }

  /**
   * Create push subscription
   */
  async createPushSubscription(subscription: InsertPushSubscription) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    try {
      // Check if subscription already exists for this user and endpoint
      const existing = await this.db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .limit(1);

      if (existing.length > 0) {
        // Update existing subscription
        await this.db
          .update(pushSubscriptions)
          .set({
            userId: subscription.userId,
            p256Dh: subscription.p256Dh,
            auth: subscription.auth,
            lastUsedAt: new Date(),
          })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
        
        return { insertId: existing[0].id };
      } else {
        // Create new subscription
        const result = await this.db.insert(pushSubscriptions).values(subscription);
        return { insertId: (result as any).insertId };
      }
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error creating push subscription:', error);
      throw error;
    }
  }

  /**
   * Get push subscriptions by user ID
   */
  async getPushSubscriptionsByUserId(userId: number) {
    if (!this.db) return [];

    try {
      return await this.db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error fetching push subscriptions:', error);
      return [];
    }
  }

  /**
   * Delete push subscription by ID
   */
  async deletePushSubscription(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    try {
      return await this.db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.id, id));
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error deleting push subscription:', error);
      throw error;
    }
  }

  /**
   * Delete push subscription by endpoint
   */
  async deletePushSubscriptionByEndpoint(endpoint: string) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    try {
      return await this.db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));
    } catch (error: unknown) {
      console.error('[NotificationRepository] Error deleting push subscription:', error);
      throw error;
    }
  }

  /**
   * Create scheduled notification
   */
  async createScheduledNotification(data: {
    userId: number;
    type: string;
    title: string;
    content?: string;
    scheduledFor: Date;
    relatedTaskId?: number;
    relatedProjectId?: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const result = await this.db.insert(scheduledNotifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      scheduledFor: data.scheduledFor,
      relatedTaskId: data.relatedTaskId,
      relatedProjectId: data.relatedProjectId,
      status: 'pending',
    });

    return { insertId: (result as any).insertId };
  }

  /**
   * Get pending scheduled notifications
   */
  async getPendingScheduledNotifications() {
    if (!this.db) return [];

    const now = new Date();
    
    return await this.db
      .select()
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.status, 'pending'))
      .orderBy(scheduledNotifications.scheduledFor);
  }

  /**
   * Update scheduled notification status
   */
  async updateScheduledNotificationStatus(
    id: number,
    status: 'pending' | 'sent' | 'failed',
    sentAt?: Date,
    error?: string
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: any = { status };
    if (sentAt) updateData.sentAt = sentAt;
    if (error) updateData.error = error;

    return await this.db
      .update(scheduledNotifications)
      .set(updateData)
      .where(eq(scheduledNotifications.id, id));
  }

  /**
   * Get notification settings for a user
   */
  async getNotificationSettings(userId: number) {
    if (!this.db) return null;

    const result = await this.db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Upsert notification settings
   */
  async upsertNotificationSettings(data: {
    userId: number;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    taskAssigned?: boolean;
    taskDueSoon?: boolean;
    defectCreated?: boolean;
    inspectionRequired?: boolean;
    projectUpdates?: boolean;
    systemAlerts?: boolean;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const values: any = {
      userId: data.userId,
    };

    const updateSet: any = {};

    // Convert boolean to int (0/1) for MySQL
    if (data.emailNotifications !== undefined) {
      values.emailNotifications = boolToInt(data.emailNotifications);
      updateSet.emailNotifications = boolToInt(data.emailNotifications);
    }
    if (data.pushNotifications !== undefined) {
      values.pushNotifications = boolToInt(data.pushNotifications);
      updateSet.pushNotifications = boolToInt(data.pushNotifications);
    }
    if (data.taskAssigned !== undefined) {
      values.taskAssigned = boolToInt(data.taskAssigned);
      updateSet.taskAssigned = boolToInt(data.taskAssigned);
    }
    if (data.taskDueSoon !== undefined) {
      values.taskDueSoon = boolToInt(data.taskDueSoon);
      updateSet.taskDueSoon = boolToInt(data.taskDueSoon);
    }
    if (data.defectCreated !== undefined) {
      values.defectCreated = boolToInt(data.defectCreated);
      updateSet.defectCreated = boolToInt(data.defectCreated);
    }
    if (data.inspectionRequired !== undefined) {
      values.inspectionRequired = boolToInt(data.inspectionRequired);
      updateSet.inspectionRequired = boolToInt(data.inspectionRequired);
    }
    if (data.projectUpdates !== undefined) {
      values.projectUpdates = boolToInt(data.projectUpdates);
      updateSet.projectUpdates = boolToInt(data.projectUpdates);
    }
    if (data.systemAlerts !== undefined) {
      values.systemAlerts = boolToInt(data.systemAlerts);
      updateSet.systemAlerts = boolToInt(data.systemAlerts);
    }

    await this.db
      .insert(notificationSettings)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });

    return { success: true };
  }
}
