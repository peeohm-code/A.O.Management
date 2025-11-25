import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Categorycolor Router
 * Auto-generated from server/routers.ts
 */
export const categoryColorRouter = router({
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getCategoryColorsByProject(input.projectId);
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum([
          "preparation",
          "structure",
          "architecture",
          "mep",
          "other",
        ]),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.updateCategoryColor(
        input.projectId,
        input.category,
        input.color
      );

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "category_color_updated",
        details: JSON.stringify({
          category: input.category,
          color: input.color,
        }),
      });

      return { success: true };
    }),
});
