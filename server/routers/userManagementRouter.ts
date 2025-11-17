import { z } from "zod";
import { router, protectedProcedure, roleBasedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { parseCSV, generateSampleCSV } from "../csvParser";
import { storagePut } from "../storage";

/**
 * User Management Enhancement Router
 * Handles bulk import, permissions management, and activity logs
 */
export const userManagementRouter = router({
  // ============================================
  // Bulk User Import
  // ============================================
  
  /**
   * Parse and validate CSV file for bulk user import
   */
  parseImportFile: roleBasedProcedure("users", "create")
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = parseCSV(input.csvContent);
      return result;
    }),

  /**
   * Execute bulk user import
   */
  bulkImportUsers: roleBasedProcedure("users", "create")
    .input(
      z.object({
        csvContent: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Parse CSV
      const parseResult = parseCSV(input.csvContent);
      
      if (!parseResult.success || parseResult.data.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ไฟล์ CSV มีข้อผิดพลาด",
        });
      }

      // Create import log
      const importLogId = await db.createBulkImportLog({
        importedBy: ctx.user!.id,
        fileName: input.fileName,
        totalRows: parseResult.data.length,
      });

      // Update status to processing
      await db.updateBulkImportLog(importLogId, { status: "processing" });

      try {
        // Bulk create users
        const importResult = await db.bulkCreateUsers(parseResult.data);

        // Update import log
        await db.updateBulkImportLog(importLogId, {
          status: "completed",
          successCount: importResult.success.length,
          failureCount: importResult.failed.length,
          errorDetails: importResult.failed,
        });

        // Log activity
        await db.logUserActivity({
          userId: ctx.user!.id,
          action: "bulk_import_users",
          module: "users",
          details: {
            fileName: input.fileName,
            totalRows: parseResult.data.length,
            successCount: importResult.success.length,
            failureCount: importResult.failed.length,
          },
        });

        return {
          success: true,
          importLogId,
          successCount: importResult.success.length,
          failureCount: importResult.failed.length,
          errors: importResult.failed,
        };
      } catch (error: any) {
        // Update import log as failed
        await db.updateBulkImportLog(importLogId, {
          status: "failed",
          errorDetails: [{ error: error.message }],
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการนำเข้าผู้ใช้",
        });
      }
    }),

  /**
   * Get import history
   */
  getImportHistory: roleBasedProcedure("users", "view")
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      return await db.getBulkImportLogs(input.limit);
    }),

  /**
   * Download sample CSV template
   */
  getSampleCSV: roleBasedProcedure("users", "view").query(() => {
    return {
      content: generateSampleCSV(),
      filename: "bulk_import_template.csv",
    };
  }),

  // ============================================
  // Permissions Management
  // ============================================

  /**
   * Get all available permissions
   */
  getAllPermissions: roleBasedProcedure("users", "view").query(async () => {
    return await db.getAllPermissions();
  }),

  /**
   * Get permissions for a specific user
   */
  getUserPermissions: roleBasedProcedure("users", "view")
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await db.getUserPermissions(input.userId);
    }),

  /**
   * Set a single permission for a user
   */
  setUserPermission: roleBasedProcedure("users", "edit")
    .input(
      z.object({
        userId: z.number(),
        permissionId: z.number(),
        granted: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.setUserPermission({
        userId: input.userId,
        permissionId: input.permissionId,
        granted: input.granted,
        grantedBy: ctx.user!.id,
      });

      // Log activity
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: "update_user_permission",
        module: "users",
        entityType: "user",
        entityId: input.userId,
        details: {
          permissionId: input.permissionId,
          granted: input.granted,
        },
      });

      return { success: true };
    }),

  /**
   * Bulk set permissions for a user
   */
  bulkSetUserPermissions: roleBasedProcedure("users", "edit")
    .input(
      z.object({
        userId: z.number(),
        permissions: z.array(
          z.object({
            permissionId: z.number(),
            granted: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.bulkSetUserPermissions({
        userId: input.userId,
        permissions: input.permissions,
        grantedBy: ctx.user!.id,
      });

      // Log activity
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: "bulk_update_user_permissions",
        module: "users",
        entityType: "user",
        entityId: input.userId,
        details: {
          permissionsCount: input.permissions.length,
        },
      });

      return { success: true };
    }),

  // ============================================
  // User Activity Logs
  // ============================================

  /**
   * Get activity logs for a specific user
   */
  getUserActivityLogs: roleBasedProcedure("users", "view")
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ input }) => {
      return await db.getUserActivityLogs(input.userId, input.limit);
    }),

  /**
   * Get all activity logs with filters
   */
  getAllActivityLogs: roleBasedProcedure("users", "view")
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        module: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ input }) => {
      return await db.getAllActivityLogs(input);
    }),

  /**
   * Log a custom activity (for manual logging)
   */
  logActivity: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        module: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        details: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.logUserActivity({
        userId: ctx.user!.id,
        action: input.action,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details,
      });

      return { success: true };
    }),
});
