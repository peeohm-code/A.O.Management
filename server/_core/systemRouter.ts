import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./trpc";
import { storagePut } from "../storage";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  submitErrorFeedback: protectedProcedure
    .input(
      z.object({
        description: z.string().min(1, "description is required"),
        stepsToReproduce: z.string().optional(),
        expectedBehavior: z.string().optional(),
        errorMessage: z.string().optional(),
        errorStack: z.string().optional(),
        pageName: z.string().optional(),
        screenshotDataUrl: z.string().optional(),
        url: z.string(),
        userAgent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      let screenshotUrl: string | undefined;

      // Upload screenshot to S3 if provided
      if (input.screenshotDataUrl) {
        try {
          // Convert data URL to buffer
          const base64Data = input.screenshotDataUrl.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const timestamp = Date.now();
          const fileKey = `error-screenshots/${user.id}-${timestamp}.png`;
          
          const { url } = await storagePut(fileKey, buffer, "image/png");
          screenshotUrl = url;
        } catch (error) {
          console.error("Failed to upload screenshot:", error);
          // Continue without screenshot if upload fails
        }
      }

      // Send notification to owner
      const title = `🐛 Bug Report: ${input.pageName || "Unknown Page"}`;
      const content = `
**Reported by:** ${user.name} (${user.email})
**Page:** ${input.pageName || "Unknown"}
**URL:** ${input.url}

**Description:**
${input.description}

${input.stepsToReproduce ? `**Steps to Reproduce:**\n${input.stepsToReproduce}\n\n` : ""}
${input.expectedBehavior ? `**Expected Behavior:**\n${input.expectedBehavior}\n\n` : ""}
${input.errorMessage ? `**Error Message:**\n${input.errorMessage}\n\n` : ""}
${screenshotUrl ? `**Screenshot:** ${screenshotUrl}\n\n` : ""}
**User Agent:** ${input.userAgent}
      `.trim();

      const delivered = await notifyOwner({ title, content });

      return {
        success: delivered,
        screenshotUrl,
      } as const;
    }),
});
