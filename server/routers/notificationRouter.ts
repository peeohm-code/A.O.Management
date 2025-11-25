import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { emitNotification } from "../_core/socket";
import { createNotification } from "../notificationService";
import { logger } from "../logger";

/**
 * Notification Router
 * Auto-generated from server/routers.ts
 */
export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const notifications = await db.getUserNotifications(ctx.user!.id);
      // Ensure we always return an array
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      logger.error("[notificationRouter.list] Error", undefined, error);
      // Return empty array instead of throwing to prevent frontend crashes
      return [];
    }
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await db.markNotificationAsRead(input.id);
      } catch (error) {
        logger.error("[notificationRouter.markAsRead] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification as read",
        });
      }
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await db.markAllNotificationsAsRead(ctx.user!.id);
    } catch (error) {
      logger.error("[notificationRouter.markAllAsRead] Error", undefined, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark all notifications as read",
      });
    }
  }),

  /**
   * Create System Alert Notification
   * ใช้สำหรับส่ง notification จาก health check หรือ system monitoring
   */
  createSystemAlert: protectedProcedure
    .input(
      z.object({
        severity: z.enum(["info", "warning", "critical"]),
        title: z.string(),
        content: z.string(),
        targetUserId: z.number().optional(), // ถ้าไม่ระบุจะส่งให้ owner/admin
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Map severity to notification type and priority
        const typeMap = {
          info: "system_health_info" as const,
          warning: "system_health_warning" as const,
          critical: "system_health_critical" as const,
        };

        const priorityMap = {
          info: "normal" as const,
          warning: "high" as const,
          critical: "urgent" as const,
        };

        // ถ้าไม่ระบุ targetUserId ให้ส่งให้ owner (user ID 1)
        const targetUserId = input.targetUserId || 1;

        // Create notification
        const notification = await db.createNotification({
          userId: targetUserId,
          type: typeMap[input.severity],
          priority: priorityMap[input.severity],
          title: input.title,
          content: input.content,
        });

        // Emit real-time notification via socket.io
        if (notification?.id) {
          emitNotification(targetUserId, {
            id: String(notification.id),
            type: "task_status",
            title: notification.title,
            message: notification.content || "",
            timestamp: notification.createdAt,
            read: notification.isRead === 1,
          });
        }

        return { success: true, notificationId: notification?.id };
      } catch (error) {
        logger.error("[notificationRouter.createSystemAlert] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create system alert",
        });
      }
    }),
});
