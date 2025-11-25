import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Errortracking Router
 * Auto-generated from server/routers.ts
 */
export const errorTrackingRouter = router({
  logError: publicProcedure
    .input(
      z.object({
        errorMessage: z.string(),
        stackTrace: z.string().optional(),
        errorCode: z.string().optional(),
        severity: z.enum(["critical", "error", "warning", "info"]).optional(),
        category: z
          .enum(["frontend", "backend", "database", "external_api", "auth", "file_upload", "other"])
          .optional(),
        url: z.string().optional(),
        method: z.string().optional(),
        userAgent: z.string().optional(),
        sessionId: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const errorId = await db.logError({
        errorMessage: input.errorMessage,
        stackTrace: input.stackTrace,
        errorCode: input.errorCode,
        severity: input.severity || 'error',
        category: input.category || 'other',
        url: input.url,
        method: input.method,
        userAgent: input.userAgent,
        sessionId: input.sessionId,
        userId: ctx.user?.id,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      });
      return { errorId };
    }),

  getErrorLogs: roleBasedProcedure("system", "view")
    .input(
      z.object({
        severity: z.enum(["critical", "error", "warning", "info"]).optional(),
        category: z
          .enum(["frontend", "backend", "database", "external_api", "auth", "file_upload", "other"])
          .optional(),
        status: z.enum(["new", "investigating", "resolved", "ignored"]).optional(),
        userId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await db.getErrorLogs(input);
    }),

  getErrorStatistics: roleBasedProcedure("system", "view")
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getErrorStatistics(input);
    }),

  updateErrorStatus: roleBasedProcedure("system", "edit")
    .input(
      z.object({
        errorId: z.number(),
        status: z.enum(["new", "investigating", "resolved", "ignored"]),
        resolutionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');
      await db.updateErrorStatus({
        errorId: input.errorId,
        status: input.status,
        resolutionNotes: input.resolutionNotes,
        resolvedBy: ctx.user.id,
      });
      return { success: true };
    }),
});
