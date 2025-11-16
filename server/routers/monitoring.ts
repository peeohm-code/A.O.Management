/**
 * Monitoring Router
 * API endpoints สำหรับดู error logs และ monitoring data
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getErrorPatterns, getRecentErrors, clearErrorPatterns } from '../monitoring/errorLogger';
import { checkMemoryUsage } from '../monitoring/cronJobs';
import { TRPCError } from '@trpc/server';

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
});
