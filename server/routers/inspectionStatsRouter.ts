import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Inspectionstats Router
 * Auto-generated from server/routers.ts
 */
export const inspectionStatsRouter = router({
  getPassFailRate: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getInspectionPassFailRate(input);
    }),

  getDefectTrends: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        groupBy: z.enum(["day", "week", "month"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getDefectTrends(input);
    }),

  getInspectorPerformance: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getInspectorPerformance(input);
    }),

  getChecklistItemStats: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        templateId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getChecklistItemStatistics(input);
    }),

  getProjectQualityScore: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getProjectQualityScore(input.projectId);
    }),
});
