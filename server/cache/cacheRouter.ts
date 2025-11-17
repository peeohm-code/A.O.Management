import { protectedProcedure, router } from "../_core/trpc";
import { cache, invalidateCache } from "./cacheService";
import { z } from "zod";

/**
 * Cache management router
 */
export const cacheRouter = router({
  /**
   * Get cache statistics
   */
  getStats: protectedProcedure.query(() => {
    return cache.getStats();
  }),

  /**
   * Get all cache keys
   */
  getKeys: protectedProcedure.query(() => {
    const keys = cache.keys();
    return {
      keys,
      count: keys.length,
    };
  }),

  /**
   * Get cache entry info
   */
  getEntryInfo: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(({ input }) => {
      return cache.getEntryInfo(input.key);
    }),

  /**
   * Clear specific cache key
   */
  clearKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(({ input }) => {
      const deleted = cache.delete(input.key);
      return { success: deleted };
    }),

  /**
   * Clear all cache
   */
  clearAll: protectedProcedure.mutation(() => {
    cache.clear();
    return { success: true };
  }),

  /**
   * Reset cache statistics
   */
  resetStats: protectedProcedure.mutation(() => {
    cache.resetStats();
    return { success: true };
  }),

  /**
   * Trigger manual cleanup
   */
  cleanup: protectedProcedure.mutation(() => {
    const removed = cache.cleanup();
    return { removed };
  }),

  /**
   * Invalidate cache by pattern
   */
  invalidate: protectedProcedure
    .input(
      z.object({
        pattern: z.enum(["project", "task", "checklist", "user", "dashboard", "all"]),
        id: z.number().optional(),
        projectId: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      switch (input.pattern) {
        case "project":
          if (input.id) invalidateCache.project(input.id);
          break;
        case "task":
          if (input.id) invalidateCache.task(input.id, input.projectId);
          break;
        case "checklist":
          if (input.id) invalidateCache.checklist(input.id);
          break;
        case "user":
          if (input.id) invalidateCache.user(input.id);
          break;
        case "dashboard":
          invalidateCache.dashboard();
          break;
        case "all":
          invalidateCache.all();
          break;
      }
      return { success: true };
    }),
});
