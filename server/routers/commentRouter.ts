import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { createNotification } from "../notificationService";

/**
 * Comment Router
 * Auto-generated from server/routers.ts
 */
export const commentRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskComments(input.taskId);
    }),

  add: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        content: z.string().min(1),
        mentions: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.addTaskComment({
        taskId: input.taskId,
        userId: ctx.user!.id,
        content: input.content,
        mentions: input.mentions ? JSON.stringify(input.mentions) : undefined,
      });

      // Notify mentioned users using notification service
      if (input.mentions && input.mentions.length > 0) {
        const task = await db.getTaskById(input.taskId);
        const commenter = ctx.user!;

        for (const userId of input.mentions) {
          // Don't notify the commenter themselves
          if (userId === ctx.user!.id) continue;

          await createNotification({
            userId,
            type: "comment_mention",
            title: "มีคน mention คุณใน comment",
            content: `${commenter.name || "ผู้ใช้"} ได้ mention คุณใน comment${task ? ` ของงาน "${task.name}"` : ""}`,
            priority: "normal",
            relatedTaskId: input.taskId,
            relatedProjectId: task?.projectId,
            sendEmail: false, // Don't send email for mentions (low priority)
          });
        }
      }

      return result;
    }),
});
