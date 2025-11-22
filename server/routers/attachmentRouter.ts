import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";

/**
 * Attachment Router
 * Auto-generated from server/routers.ts
 */
export const attachmentRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskAttachments(input.taskId);
    }),

  upload: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `task-${input.taskId}/${timestamp}-${randomSuffix}-${input.fileName}`;

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(input.fileContent, "base64");
      const fileSize = fileBuffer.length;

      // Upload to S3
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Save to database
      const result = await db.addTaskAttachment({
        taskId: input.taskId,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        fileSize,
        mimeType: input.mimeType,
        uploadedBy: ctx.user!.id,
      });

      // Log activity
      const task = await db.getTaskById(input.taskId);
      if (task) {
        await db.logActivity({
          userId: ctx.user!.id,
          projectId: task.projectId,
          taskId: input.taskId,
          action: "attachment_added",
          details: JSON.stringify({ fileName: input.fileName }),
        });
      }

      return { success: true, id: (result as any).insertId, url };
    }),

  add: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.addTaskAttachment({
        ...input,
        uploadedBy: ctx.user!.id,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Get attachment info
      const attachment = await db.getAttachmentById(input.id);
      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Check permission: only uploader, admin, or PM can delete
      const canDelete =
        attachment.uploadedBy === ctx.user!.id ||
        ctx.user!.role === "admin" ||
        ctx.user!.role === "project_manager";

      if (!canDelete) {
        throw new Error("Permission denied");
      }

      // Delete from database
      await db.deleteTaskAttachment(input.id);

      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        taskId: attachment.taskId,
        action: "attachment_deleted",
        details: JSON.stringify({ fileName: attachment.fileName }),
      });

      return { success: true };
    }),
});
