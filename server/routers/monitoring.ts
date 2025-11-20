/**
 * Monitoring Router
 * API endpoints สำหรับดู error logs และ monitoring data
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getErrorPatterns, getRecentErrors, clearErrorPatterns } from '../monitoring/errorLogger';
import { checkMemoryUsage } from '../monitoring/cronJobs';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import os from 'os';
import * as v8 from 'v8';

export const monitoringRouter = router({
  /**
   * รับ error patterns สำหรับการวิเคราะห์
   */
  getErrorPatterns: protectedProcedure.query(async ({ ctx }) => {
    // เฉพาะ admin เท่านั้นที่ดูได้
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view error patterns',
      });
    }

    const patterns = await getErrorPatterns();
    return patterns;
  }),

  /**
   * รับ error logs ล่าสุด
   */
  getRecentErrors: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // เฉพาะ admin เท่านั้นที่ดูได้
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view error logs',
        });
      }

      const errors = await getRecentErrors(input.limit);
      return errors;
    }),

  /**
   * ล้าง error patterns
   */
  clearErrorPatterns: protectedProcedure.mutation(async ({ ctx }) => {
    // เฉพาะ admin เท่านั้นที่ทำได้
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can clear error patterns',
      });
    }

    await clearErrorPatterns();
    return { success: true };
  }),

  /**
   * รัน memory check แบบ manual
   */
  runMemoryCheck: protectedProcedure.mutation(async ({ ctx }) => {
    // เฉพาะ admin เท่านั้นที่ทำได้
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can run memory check',
      });
    }

    await checkMemoryUsage();
    return { success: true, message: 'Memory check completed' };
  }),

  /**
   * ดึงข้อมูลสถิติฐานข้อมูล
   */
  getDatabaseStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view database stats',
      });
    }

    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      // Query table statistics
      const tableStatsQuery = `
        SELECT 
          table_name,
          table_rows,
          data_length,
          index_length
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY table_name
      `;

      const [rows] = await db.execute(tableStatsQuery) as any;

      const tables = rows.map((row: any) => ({
        name: row.table_name || row.TABLE_NAME,
        rowCount: parseInt(row.table_rows || row.TABLE_ROWS || '0'),
        dataSize: parseInt(row.data_length || row.DATA_LENGTH || '0'),
        indexSize: parseInt(row.index_length || row.INDEX_LENGTH || '0'),
      }));

      return { tables };
    } catch (error) {
      console.error('[Monitoring] Error getting database stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get database stats',
      });
    }
  }),

  /**
   * ดึงข้อมูลสถิติระบบ
   */
  getSystemStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view system stats',
      });
    }

    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Calculate CPU usage (simplified)
      let totalIdle = 0;
      let totalTick = 0;
      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += (cpu.times as any)[type];
        }
        totalIdle += cpu.times.idle;
      });
      const cpuUsage = 100 - (100 * totalIdle / totalTick);

      return {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: (usedMem / totalMem) * 100,
        },
        disk: {
          // Note: Node.js doesn't have built-in disk usage API
          // This is a placeholder - in production, use a library like 'diskusage'
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0,
        },
        uptime: os.uptime(),
        platform: os.platform(),
      };
    } catch (error) {
      console.error('[Monitoring] Error getting system stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get system stats',
      });
    }
  }),

  /**
   * ดึงข้อมูล Memory Usage
   */
  getMemoryStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view memory stats',
      });
    }

    try {
      const memUsage = process.memoryUsage();

      const heapStats = v8.getHeapStatistics();
      
      return {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        heapLimit: heapStats.heap_size_limit,
      };
    } catch (error) {
      console.error('[Monitoring] Error getting memory stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get memory stats',
      });
    }
  }),
});
