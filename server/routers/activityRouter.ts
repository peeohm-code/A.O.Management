import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Activity Router
 * Auto-generated from server/routers.ts
 */
export const activityRouter = router({
  taskActivity: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskActivityLog(input.taskId);
    }),
  getByTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskActivityLog(input.taskId);
    }),
  // Note: activityLog doesn't have defectId column
  // getByDefect: protectedProcedure
  //   .input(z.object({ defectId: z.number() }))
  //   .query(async ({ input }) => {
  //     return await db.getDefectActivityLog(input.defectId);
  //   }),
});
