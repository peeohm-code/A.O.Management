import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createNotification } from "./notificationService";
import { sendEmail, emailTemplates } from "./email";

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
          type: 'inspection_request',
          priority: 'high',
          title: 'คำขอตรวจงานใหม่',
          content: `${ctx.user!.name} ขอให้คุณตรวจงาน`,
          relatedTaskId: input.taskId,
        });

        // Send email notification to inspector
        const inspector = await db.getUserById(input.inspectorId);
        const task = await db.getTaskById(input.taskId);
        if (inspector && inspector.email && task) {
          const project = task.projectId ? await db.getProjectById(task.projectId) : null;
          await sendEmail({
            to: inspector.email,
            subject: `🔔 คำขอตรวจงานใหม่ - ${task.name}`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00366D 0%, #00CE81 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .info-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #00CE81; margin: 20px 0; }
    .button { display: inline-block; background: #00366D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 คำขอตรวจงานใหม่</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${inspector.name}</strong></p>
      
      <p><strong>${ctx.user!.name}</strong> ขอให้คุณตรวจงาน</p>
      
      <div class="info-box">
        <p><strong>ชื่องาน:</strong> ${task.name}</p>
        ${project ? `<p><strong>โครงการ:</strong> ${project.name}</p>` : ''}
        ${input.notes ? `<p><strong>หมายเหตุ:</strong> ${input.notes}</p>` : ''}
      </div>
      
      <p>กรุณาเข้าสู่ระบบเพื่อดำเนินการอนุมัติหรือปฏิเสธคำขอ</p>
      
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/inspection-requests" class="button">ดูคำขอตรวจงาน</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
            `,
          });
        }
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
        type: 'inspection_request',
        priority: 'medium',
        title: 'คำขอตรวจงานได้รับอนุมัติ',
        content: `${ctx.user!.name} อนุมัติคำขอตรวจงานของคุณแล้ว`,
        relatedTaskId: request.taskId,
      });

      // Send email notification to requester
      const requester = await db.getUserById(request.requestedBy);
      const task = await db.getTaskById(request.taskId);
      if (requester && requester.email && task) {
        const project = task.projectId ? await db.getProjectById(task.projectId) : null;
        await sendEmail({
          to: requester.email,
          subject: `✅ คำขอตรวจงานได้รับอนุมัติ - ${task.name}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #00CE81 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .success-box { background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ คำขอตรวจงานได้รับอนุมัติ</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${requester.name}</strong></p>
      
      <p><strong>${ctx.user!.name}</strong> ได้อนุมัติคำขอตรวจงานของคุณแล้ว</p>
      
      <div class="success-box">
        <p><strong>ชื่องาน:</strong> ${task.name}</p>
        ${project ? `<p><strong>โครงการ:</strong> ${project.name}</p>` : ''}
        <p><strong>สถานะ:</strong> อนุมัติแล้ว</p>
      </div>
      
      <p>คุณสามารถดำเนินการตรวจงานได้แล้ว</p>
      
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/tasks/${request.taskId}" class="button">ดูรายละเอียดงาน</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
          `,
        });
      }

      return result;
    }),

  getPendingCount: protectedProcedure
    .query(async ({ ctx }) => {
      // For QC Inspector, count pending requests assigned to them
      if (ctx.user!.role === 'qc_inspector') {
        const requests = await db.getInspectionRequestsByInspector(ctx.user!.id);
        return requests.filter(r => r.status === 'pending').length;
      }
      // For others, return 0
      return 0;
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
        type: 'inspection_request',
        priority: 'high',
        title: 'คำขอตรวจงานถูกปฏิเสธ',
        content: `${ctx.user!.name} ปฏิเสธคำขอตรวจงาน: ${input.rejectedReason}`,
        relatedTaskId: request.taskId,
      });

      // Send email notification to requester
      const requester = await db.getUserById(request.requestedBy);
      const task = await db.getTaskById(request.taskId);
      if (requester && requester.email && task) {
        const project = task.projectId ? await db.getProjectById(task.projectId) : null;
        await sendEmail({
          to: requester.email,
          subject: `❌ คำขอตรวจงานถูกปฏิเสธ - ${task.name}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .alert-box { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ คำขอตรวจงานถูกปฏิเสธ</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${requester.name}</strong></p>
      
      <p><strong>${ctx.user!.name}</strong> ได้ปฏิเสธคำขอตรวจงานของคุณ</p>
      
      <div class="alert-box">
        <p><strong>ชื่องาน:</strong> ${task.name}</p>
        ${project ? `<p><strong>โครงการ:</strong> ${project.name}</p>` : ''}
        <p><strong>เหตุผล:</strong> ${input.rejectedReason}</p>
      </div>
      
      <p>กรุณาตรวจสอบเหตุผลและดำเนินการแก้ไขก่อนขอตรวจงานใหม่</p>
      
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/tasks/${request.taskId}" class="button">ดูรายละเอียดงาน</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
          `,
        });
      }

      return result;
    }),
});
