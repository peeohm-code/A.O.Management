import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createNotification } from "./notificationService";

export const inspectionRequestRouter = router({
  create: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      inspectorId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.createInspectionRequest({
        ...input,
        requestedBy: ctx.user!.id,
      });

      // Send notification to inspector if assigned
      if (input.inspectorId) {
        await createNotification({
          userId: input.inspectorId,
          type: 'inspection_requested',
          priority: 'high',
          title: 'คำขอตรวจงานใหม่',
          content: `${ctx.user!.name} ขอให้คุณตรวจงาน`,
          relatedTaskId: input.taskId,
        });
      }

      return result;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // If user is QC Inspector, show requests assigned to them
    if (ctx.user!.role === 'qc_inspector') {
      return await db.getInspectionRequestsByInspector(ctx.user!.id);
    }
    // Otherwise show all requests
    return await db.getAllInspectionRequests();
  }),

  getByTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getInspectionRequestsByTask(input.taskId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getInspectionRequestById(input.id);
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const request = await db.getInspectionRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'ไม่พบคำขอตรวจงาน' });
      }

      const result = await db.approveInspectionRequest(input.id, ctx.user!.id);

      // Send notification to requester
      await createNotification({
        userId: request.requestedBy,
        type: 'inspection_requested',
        priority: 'normal',
        title: 'คำขอตรวจงานได้รับอนุมัติ',
        content: `${ctx.user!.name} อนุมัติคำขอตรวจงานของคุณแล้ว`,
        relatedTaskId: request.taskId,
      });

      return result;
    }),

  reject: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      rejectedReason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await db.getInspectionRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'ไม่พบคำขอตรวจงาน' });
      }

      const result = await db.rejectInspectionRequest(input.id, ctx.user!.id, input.rejectedReason);

      // Send notification to requester
      await createNotification({
        userId: request.requestedBy,
        type: 'inspection_requested',
        priority: 'high',
        title: 'คำขอตรวจงานถูกปฏิเสธ',
        content: `${ctx.user!.name} ปฏิเสธคำขอตรวจงาน: ${input.rejectedReason}`,
        relatedTaskId: request.taskId,
      });

      return result;
    }),
});
