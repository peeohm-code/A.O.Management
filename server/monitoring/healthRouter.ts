import { publicProcedure, router } from "../_core/trpc";
import { checkMemoryAndAlert, formatBytes, getMemoryStats } from "./memoryMonitor";
import { z } from "zod";
import os from "os";

/**
 * Health check router for system monitoring
 */
export const healthRouter = router({
  /**
   * Get current memory statistics
   */
  getMemoryStats: publicProcedure.query(async () => {
    const stats = getMemoryStats();
    return {
      ...stats,
      formatted: {
        totalMemory: formatBytes(stats.totalMemory),
        freeMemory: formatBytes(stats.freeMemory),
        usedMemory: formatBytes(stats.usedMemory),
        usedPercentage: `${stats.usedPercentage.toFixed(1)}%`,
        swapTotal: formatBytes(stats.swapTotal),
        swapFree: formatBytes(stats.swapFree),
        swapUsed: formatBytes(stats.swapUsed),
        swapPercentage: `${stats.swapPercentage.toFixed(1)}%`,
      },
    };
  }),

  /**
   * Check memory and trigger alerts if needed
   */
  checkMemory: publicProcedure
    .input(
      z
        .object({
          warning: z.number().min(0).max(100).optional(),
          critical: z.number().min(0).max(100).optional(),
          swapWarning: z.number().min(0).max(100).optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const thresholds = input ? {
        warning: input.warning ?? 70,
        critical: input.critical ?? 85,
        swapWarning: input.swapWarning ?? 50,
      } : undefined;
      const result = await checkMemoryAndAlert(thresholds);
      return {
        ...result,
        formatted: {
          totalMemory: formatBytes(result.stats.totalMemory),
          freeMemory: formatBytes(result.stats.freeMemory),
          usedMemory: formatBytes(result.stats.usedMemory),
          usedPercentage: `${result.stats.usedPercentage.toFixed(1)}%`,
          swapTotal: formatBytes(result.stats.swapTotal),
          swapFree: formatBytes(result.stats.swapFree),
          swapUsed: formatBytes(result.stats.swapUsed),
          swapPercentage: `${result.stats.swapPercentage.toFixed(1)}%`,
        },
      };
    }),

  /**
   * Get system information
   */
  getSystemInfo: publicProcedure.query(() => {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || "Unknown",
      loadAverage: {
        "1min": loadAvg[0].toFixed(2),
        "5min": loadAvg[1].toFixed(2),
        "15min": loadAvg[2].toFixed(2),
      },
      nodeVersion: process.version,
      processUptime: process.uptime(),
    };
  }),

  /**
   * Get comprehensive health status
   */
  getHealthStatus: publicProcedure.query(async () => {
    const memoryStats = getMemoryStats();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Determine overall health status
    let status: "healthy" | "warning" | "critical" = "healthy";
    const issues: string[] = [];

    if (memoryStats.usedPercentage >= 85) {
      status = "critical";
      issues.push(`Critical memory usage: ${memoryStats.usedPercentage.toFixed(1)}%`);
    } else if (memoryStats.usedPercentage >= 70) {
      status = "warning";
      issues.push(`High memory usage: ${memoryStats.usedPercentage.toFixed(1)}%`);
    }

    if (memoryStats.swapTotal > 0 && memoryStats.swapPercentage >= 50) {
      if (status !== "critical") status = "warning";
      issues.push(`High swap usage: ${memoryStats.swapPercentage.toFixed(1)}%`);
    }

    // Check CPU load (warning if 1-min load > CPU count)
    if (loadAvg[0] > cpus.length) {
      if (status !== "critical") status = "warning";
      issues.push(`High CPU load: ${loadAvg[0].toFixed(2)} (${cpus.length} cores)`);
    }

    return {
      status,
      issues,
      timestamp: new Date(),
      memory: {
        usedPercentage: memoryStats.usedPercentage.toFixed(1),
        used: formatBytes(memoryStats.usedMemory),
        total: formatBytes(memoryStats.totalMemory),
        free: formatBytes(memoryStats.freeMemory),
      },
      swap: {
        usedPercentage: memoryStats.swapPercentage.toFixed(1),
        used: formatBytes(memoryStats.swapUsed),
        total: formatBytes(memoryStats.swapTotal),
      },
      cpu: {
        count: cpus.length,
        loadAverage: loadAvg.map((l) => l.toFixed(2)),
      },
      uptime: {
        system: Math.floor(os.uptime()),
        process: Math.floor(process.uptime()),
      },
    };
  }),
});
