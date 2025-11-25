import { z } from "zod";
import { router } from "../_core/trpc";
import { requireAdminMiddleware } from "../middleware/permissionMiddleware";
import { protectedProcedure } from "../_core/trpc";
import {
  getQueryStats,
  getSlowQueriesByPattern,
  getPerformanceReport,
  clearQueryMetrics,
} from "../monitoring/queryPerformance";

/**
 * Performance Monitoring Router
 * 
 * Admin-only endpoints สำหรับติดตาม query performance
 */
export const performanceRouter = router({
  /**
   * Get query statistics summary
   */
  getQueryStats: protectedProcedure
    .use(requireAdminMiddleware)
    .query(async () => {
      return getQueryStats();
    }),

  /**
   * Get slow queries grouped by pattern
   */
  getSlowQueriesByPattern: protectedProcedure
    .use(requireAdminMiddleware)
    .query(async () => {
      return getSlowQueriesByPattern();
    }),

  /**
   * Get full performance report with recommendations
   */
  getPerformanceReport: protectedProcedure
    .use(requireAdminMiddleware)
    .query(async () => {
      return getPerformanceReport();
    }),

  /**
   * Clear query metrics (reset statistics)
   */
  clearQueryMetrics: protectedProcedure
    .use(requireAdminMiddleware)
    .mutation(async () => {
      clearQueryMetrics();
      return { success: true, message: "Query metrics cleared" };
    }),
});
