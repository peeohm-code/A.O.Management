import { z } from "zod";
import { protectedProcedure, router, roleBasedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import * as os from "os";

// In-memory storage for query performance tracking
interface QueryLog {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

const queryLogs: QueryLog[] = [];
const MAX_QUERY_LOGS = 1000; // Keep last 1000 queries
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Log a query execution
 */
export function logQuery(query: string, duration: number, success: boolean, error?: string) {
  queryLogs.push({
    query,
    duration,
    timestamp: new Date(),
    success,
    error,
  });

  // Keep only last MAX_QUERY_LOGS entries
  if (queryLogs.length > MAX_QUERY_LOGS) {
    queryLogs.shift();
  }
}

/**
 * Performance Router - System Performance Monitoring
 */
export const performanceRouter: any = router({
  /**
   * Get current system metrics (CPU, Memory)
   */
  getSystemMetrics: roleBasedProcedure('system', 'view').query(async () => {
    try {
      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      // CPU metrics
      const cpus = os.cpus();
      const cpuCount = cpus.length;
      
      // Calculate average CPU usage
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpuCount;
      const total = totalTick / cpuCount;
      const cpuUsagePercent = 100 - ~~(100 * idle / total);

      // System uptime
      const uptime = os.uptime();

      // Load average (Unix-like systems only)
      const loadAverage = os.loadavg();

      return {
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: Math.round(memoryUsagePercent * 100) / 100,
          totalMB: Math.round(totalMemory / 1024 / 1024),
          freeMB: Math.round(freeMemory / 1024 / 1024),
          usedMB: Math.round(usedMemory / 1024 / 1024),
        },
        cpu: {
          count: cpuCount,
          model: cpus[0]?.model || 'Unknown',
          usagePercent: Math.round(cpuUsagePercent * 100) / 100,
          loadAverage: loadAverage.map(load => Math.round(load * 100) / 100),
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: uptime,
          uptimeFormatted: formatUptime(uptime),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Performance] Failed to get system metrics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve system metrics',
      });
    }
  }),

  /**
   * Get database performance metrics
   */
  getDatabaseMetrics: roleBasedProcedure('system', 'view').query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available',
      });
    }

    try {
      // Get database status variables
      const statusVars: any = await db.execute(`SHOW GLOBAL STATUS`);
      
      // Parse status variables into object
      const status: Record<string, string> = {};
      statusVars.forEach((row: any) => {
        status[row.Variable_name] = row.Value;
      });

      // Get connection info
      const connections = {
        current: parseInt(status.Threads_connected || '0'),
        max: parseInt(status.Max_used_connections || '0'),
        total: parseInt(status.Connections || '0'),
      };

      // Get query statistics
      const queries = {
        total: parseInt(status.Questions || '0'),
        select: parseInt(status.Com_select || '0'),
        insert: parseInt(status.Com_insert || '0'),
        update: parseInt(status.Com_update || '0'),
        delete: parseInt(status.Com_delete || '0'),
      };

      // Get table statistics
      const tableStats: any = await db.execute(`
        SELECT 
          COUNT(*) as table_count,
          SUM(TABLE_ROWS) as total_rows,
          ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
      `);

      return {
        connections,
        queries,
        tables: {
          count: tableStats[0]?.table_count || 0,
          totalRows: tableStats[0]?.total_rows || 0,
          totalSizeMB: tableStats[0]?.total_size_mb || 0,
        },
        uptime: parseInt(status.Uptime || '0'),
        uptimeFormatted: formatUptime(parseInt(status.Uptime || '0')),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Performance] Failed to get database metrics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve database metrics',
      });
    }
  }),

  /**
   * Get slow query logs
   */
  getSlowQueries: roleBasedProcedure('system', 'view')
    .input(z.object({
      limit: z.number().optional().default(50),
      threshold: z.number().optional().default(SLOW_QUERY_THRESHOLD),
    }))
    .query(async ({ input }) => {
      try {
        // Filter slow queries
        const slowQueries = queryLogs
          .filter(log => log.duration >= input.threshold)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, input.limit);

        return {
          queries: slowQueries,
          count: slowQueries.length,
          threshold: input.threshold,
        };
      } catch (error) {
        console.error('[Performance] Failed to get slow queries:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve slow queries',
        });
      }
    }),

  /**
   * Get query performance statistics
   */
  getQueryStats: roleBasedProcedure('system', 'view').query(async () => {
    try {
      if (queryLogs.length === 0) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          avgDuration: 0,
          maxDuration: 0,
          minDuration: 0,
          slowQueries: 0,
        };
      }

      const durations = queryLogs.map(log => log.duration);
      const successful = queryLogs.filter(log => log.success).length;
      const failed = queryLogs.filter(log => !log.success).length;
      const slowQueries = queryLogs.filter(log => log.duration >= SLOW_QUERY_THRESHOLD).length;

      return {
        total: queryLogs.length,
        successful,
        failed,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        slowQueries,
        slowQueryThreshold: SLOW_QUERY_THRESHOLD,
      };
    } catch (error) {
      console.error('[Performance] Failed to get query stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve query statistics',
      });
    }
  }),

  /**
   * Clear query logs
   */
  clearQueryLogs: roleBasedProcedure('system', 'edit').mutation(async () => {
    try {
      const count = queryLogs.length;
      queryLogs.length = 0; // Clear array
      
      return {
        success: true,
        clearedCount: count,
      };
    } catch (error) {
      console.error('[Performance] Failed to clear query logs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clear query logs',
      });
    }
  }),

  /**
   * Get performance history (last N data points)
   */
  getPerformanceHistory: roleBasedProcedure('system', 'view')
    .input(z.object({
      minutes: z.number().optional().default(60),
    }))
    .query(async ({ input }) => {
      try {
        // For now, return empty array
        // In production, you would store historical data in database or time-series DB
        return {
          dataPoints: [],
          minutes: input.minutes,
          message: 'Historical data tracking not yet implemented.',
        };
      } catch (error) {
        console.error('[Performance] Failed to get performance history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve performance history',
        });
      }
    }),
});

/**
 * Helper function to format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
