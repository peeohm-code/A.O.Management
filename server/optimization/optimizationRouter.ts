import { protectedProcedure, router } from "../_core/trpc";
import {
  applyRecommendedIndexes,
  analyzeTableSizes,
  getSlowQueries,
  RECOMMENDED_INDEXES,
} from "./queryOptimizer";
import { z } from "zod";

/**
 * Optimization router for database and query optimization
 */
export const optimizationRouter = router({
  /**
   * Get list of recommended indexes
   */
  getRecommendedIndexes: protectedProcedure.query(() => {
    return {
      indexes: RECOMMENDED_INDEXES,
      count: RECOMMENDED_INDEXES.length,
    };
  }),

  /**
   * Apply recommended indexes to the database
   */
  applyIndexes: protectedProcedure.mutation(async () => {
    const result = await applyRecommendedIndexes();
    return result;
  }),

  /**
   * Analyze table sizes and row counts
   */
  analyzeTableSizes: protectedProcedure.query(async () => {
    const tables = await analyzeTableSizes();
    return { tables };
  }),

  /**
   * Get slow queries from logs
   */
  getSlowQueries: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const queries = await getSlowQueries(input?.limit || 20);
      return { queries };
    }),

  /**
   * Get optimization recommendations
   */
  getRecommendations: protectedProcedure.query(async () => {
    const tables = await analyzeTableSizes();
    const slowQueries = await getSlowQueries(10);

    const recommendations: Array<{
      type: "info" | "warning" | "critical";
      category: string;
      message: string;
      action?: string;
    }> = [];

    // Check for large tables without indexes
    const largeTables = tables.filter((t) => t.rows > 10000);
    if (largeTables.length > 0) {
      recommendations.push({
        type: "warning",
        category: "Database Size",
        message: `Found ${largeTables.length} tables with > 10,000 rows. Ensure proper indexes are in place.`,
        action: "Run 'Apply Indexes' to optimize query performance.",
      });
    }

    // Check for slow queries
    if (slowQueries.length > 0) {
      const avgTime = slowQueries.reduce((sum, q) => sum + q.executionTime, 0) / slowQueries.length;
      recommendations.push({
        type: avgTime > 5000 ? "critical" : "warning",
        category: "Query Performance",
        message: `Found ${slowQueries.length} slow queries (avg: ${avgTime.toFixed(0)}ms). Consider optimization.`,
        action: "Review slow queries and add appropriate indexes or optimize query logic.",
      });
    }

    // Check total database size
    const totalSize = tables.reduce((sum, t) => {
      const size = parseFloat(t.totalSize.replace(" MB", ""));
      return sum + size;
    }, 0);

    if (totalSize > 1000) {
      recommendations.push({
        type: "warning",
        category: "Database Size",
        message: `Total database size: ${totalSize.toFixed(2)} MB. Consider archiving old data.`,
        action: "Implement data archiving strategy for completed projects.",
      });
    }

    // General recommendations
    recommendations.push({
      type: "info",
      category: "Best Practices",
      message: "Enable query caching to reduce database load.",
      action: "Implement Redis or in-memory caching for frequently accessed data.",
    });

    recommendations.push({
      type: "info",
      category: "Best Practices",
      message: "Use pagination for large result sets to reduce memory usage.",
      action: "Ensure all list endpoints use proper pagination.",
    });

    return { recommendations };
  }),
});
