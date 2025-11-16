import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { 
  createExcelWorkbook, 
  createPDFDocument, 
  formatDate, 
  formatDateTime, 
  formatStatus, 
  formatPriority,
  type ExcelColumn,
  type PDFTableColumn 
} from "./export";
import { generateProgressReport } from "./progressReport";

/**
 * Export Router - Export data to Excel/PDF
 */
export const exportRouter = router({
  // Export Tasks to Excel
  exportTasksExcel: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const tasks = await db.getTasksByProject(input.projectId);
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Prepare data for Excel
      const excelData = tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || '-',
        status: formatStatus(task.status),
        priority: task.priority ? formatPriority(task.priority) : '-',
        assignee: task.assigneeId ? `User ${task.assigneeId}` : '-',
        startDate: formatDate(task.startDate),
        endDate: formatDate(task.endDate),
        progress: `${task.progress || 0}%`,
        category: task.category || '-',
      }));

      const columns: ExcelColumn[] = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'ชื่องาน', key: 'name', width: 30 },
        { header: 'รายละเอียด', key: 'description', width: 40 },
        { header: 'สถานะ', key: 'status', width: 20 },
        { header: 'ความสำคัญ', key: 'priority', width: 15 },
        { header: 'ผู้รับผิดชอบ', key: 'assignee', width: 25 },
        { header: 'วันเริ่ม', key: 'startDate', width: 15 },
        { header: 'วันสิ้นสุด', key: 'endDate', width: 15 },
        { header: 'ความคืบหน้า', key: 'progress', width: 12 },
        { header: 'หมวดหมู่', key: 'category', width: 20 },
      ];

      const buffer = await createExcelWorkbook('Tasks', columns, excelData);
      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "tasks_exported",
        details: JSON.stringify({ format: 'excel', count: tasks.length }),
      });

      return {
        data: base64,
        filename: `tasks_${project.code || project.id}_${Date.now()}.xlsx`,
      };
    }),

  // Export Tasks to PDF
  exportTasksPDF: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const tasks = await db.getTasksByProject(input.projectId);
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Prepare data for PDF
      const pdfData = tasks.map(task => ({
        name: task.name,
        status: formatStatus(task.status),
        assignee: task.assigneeId ? `User ${task.assigneeId}` : '-',
        startDate: formatDate(task.startDate),
        endDate: formatDate(task.endDate),
        progress: `${task.progress || 0}%`,
      }));

      const columns: PDFTableColumn[] = [
        { header: 'ชื่องาน', key: 'name', width: 200 },
        { header: 'สถานะ', key: 'status', width: 100 },
        { header: 'ผู้รับผิดชอบ', key: 'assignee', width: 120 },
        { header: 'วันเริ่ม', key: 'startDate', width: 80 },
        { header: 'วันสิ้นสุด', key: 'endDate', width: 80 },
        { header: 'ความคืบหน้า', key: 'progress', width: 70 },
      ];

      const buffer = await createPDFDocument({
        title: `รายงานงาน - ${project.name}`,
        subtitle: `รหัสโครงการ: ${project.code || project.id} | จำนวนงาน: ${tasks.length} รายการ`,
        columns,
        data: pdfData,
        orientation: 'landscape',
      });

      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "tasks_exported",
        details: JSON.stringify({ format: 'pdf', count: tasks.length }),
      });

      return {
        data: base64,
        filename: `tasks_${project.code || project.id}_${Date.now()}.pdf`,
      };
    }),

  // Export Defects to Excel
  exportDefectsExcel: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const tasks = await db.getTasksByProject(input.projectId);
      const allDefects = await db.getAllDefects();
      const defects = allDefects.filter((d: any) => d.taskId && tasks.some((t: any) => t.id === d.taskId && t.projectId === input.projectId));
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Prepare data for Excel
      const excelData = defects.map(defect => ({
        id: defect.id,
        taskName: defect.taskName || '-',
        description: defect.description,
        severity: formatPriority(defect.severity),
        status: formatStatus(defect.status),
        assignedTo: defect.assignedToName || '-',
        detectedBy: defect.detectedByName || '-',
        detectedAt: formatDateTime(defect.detectedAt),
        resolvedAt: defect.resolvedAt ? formatDateTime(defect.resolvedAt) : '-',
      }));

      const columns: ExcelColumn[] = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'งานที่เกี่ยวข้อง', key: 'taskName', width: 25 },
        { header: 'รายละเอียดข้อบกพร่อง', key: 'description', width: 40 },
        { header: 'ความรุนแรง', key: 'severity', width: 15 },
        { header: 'สถานะ', key: 'status', width: 15 },
        { header: 'ผู้รับผิดชอบแก้ไข', key: 'assignedTo', width: 20 },
        { header: 'ผู้ตรวจพบ', key: 'detectedBy', width: 20 },
        { header: 'วันที่ตรวจพบ', key: 'detectedAt', width: 18 },
        { header: 'วันที่แก้ไข', key: 'resolvedAt', width: 18 },
        { header: 'สถานที่', key: 'location', width: 25 },
      ];

      const buffer = await createExcelWorkbook('Defects', columns, excelData);
      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "defects_exported",
        details: JSON.stringify({ format: 'excel', count: defects.length }),
      });

      return {
        data: base64,
        filename: `defects_${project.code || project.id}_${Date.now()}.xlsx`,
      };
    }),

  // Export Defects to PDF
  exportDefectsPDF: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const tasks = await db.getTasksByProject(input.projectId);
      const allDefects = await db.getAllDefects();
      const defects = allDefects.filter((d: any) => d.taskId && tasks.some((t: any) => t.id === d.taskId && t.projectId === input.projectId));
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Prepare data for PDF
      const pdfData = defects.map(defect => ({
        taskName: defect.taskName || '-',
        description: defect.description ? (defect.description.substring(0, 50) + (defect.description.length > 50 ? '...' : '')) : '-',
        severity: formatPriority(defect.severity),
        status: formatStatus(defect.status),
        assignedTo: defect.assignedToName || '-',
        detectedAt: formatDate(defect.detectedAt),
      }));

      const columns: PDFTableColumn[] = [
        { header: 'งาน', key: 'taskName', width: 120 },
        { header: 'รายละเอียด', key: 'description', width: 180 },
        { header: 'ความรุนแรง', key: 'severity', width: 80 },
        { header: 'สถานะ', key: 'status', width: 80 },
        { header: 'ผู้รับผิดชอบ', key: 'assignedTo', width: 100 },
        { header: 'วันที่พบ', key: 'detectedAt', width: 90 },
      ];

      const buffer = await createPDFDocument({
        title: `รายงานข้อบกพร่อง - ${project.name}`,
        subtitle: `รหัสโครงการ: ${project.code || project.id} | จำนวนข้อบกพร่อง: ${defects.length} รายการ`,
        columns,
        data: pdfData,
        orientation: 'landscape',
      });

      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "defects_exported",
        details: JSON.stringify({ format: 'pdf', count: defects.length }),
      });

      return {
        data: base64,
        filename: `defects_${project.code || project.id}_${Date.now()}.pdf`,
      };
    }),

  // Export Inspections to Excel
  exportInspectionsExcel: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const tasks = await db.getTasksByProject(input.projectId);
      const taskIds = tasks.map((t: any) => t.id);
      const allChecklists = await db.getAllTaskChecklists();
      const inspections = allChecklists.filter((c: any) => taskIds.includes(c.taskId));
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Get checklist results for each inspection to calculate pass/fail/na counts
      const inspectionsWithCounts = await Promise.all(
        inspections.map(async (inspection: any) => {
          const results = await db.getChecklistItemResults(inspection.id);
          const passCount = results.filter((r: any) => r.result === 'pass').length;
          const failCount = results.filter((r: any) => r.result === 'fail').length;
          const naCount = results.filter((r: any) => r.result === 'na').length;
          
          return {
            id: inspection.id,
            taskName: inspection.taskName || '-',
            checklistName: inspection.templateName || '-',
            inspectorName: inspection.inspectedBy ? `User ${inspection.inspectedBy}` : '-',
            inspectionDate: formatDateTime(inspection.inspectedAt),
            overallResult: formatStatus(inspection.status),
            passCount,
            failCount,
            naCount,
            notes: inspection.notes || '-',
          };
        })
      );

      const excelData = inspectionsWithCounts;

      const columns: ExcelColumn[] = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'งาน', key: 'taskName', width: 25 },
        { header: 'Checklist', key: 'checklistName', width: 30 },
        { header: 'ผู้ตรวจ', key: 'inspectorName', width: 20 },
        { header: 'วันที่ตรวจ', key: 'inspectionDate', width: 18 },
        { header: 'ผลการตรวจ', key: 'overallResult', width: 15 },
        { header: 'ผ่าน', key: 'passCount', width: 10 },
        { header: 'ไม่ผ่าน', key: 'failCount', width: 10 },
        { header: 'N/A', key: 'naCount', width: 10 },
        { header: 'หมายเหตุ', key: 'notes', width: 35 },
      ];

      const buffer = await createExcelWorkbook('Inspections', columns, excelData);
      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "inspections_exported",
        details: JSON.stringify({ format: 'excel', count: inspections.length }),
      });

      return {
        data: base64,
        filename: `inspections_${project.code || project.id}_${Date.now()}.xlsx`,
      };
    }),

  // Export Inspections to PDF
  exportInspectionsPDF: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const tasks = await db.getTasksByProject(input.projectId);
      const taskIds = tasks.map((t: any) => t.id);
      const allChecklists = await db.getAllTaskChecklists();
      const inspections = allChecklists.filter((c: any) => taskIds.includes(c.taskId));
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Get checklist results for each inspection to calculate pass/fail/na counts
      const pdfData = await Promise.all(
        inspections.map(async (inspection: any) => {
          const results = await db.getChecklistItemResults(inspection.id);
          const passCount = results.filter((r: any) => r.result === 'pass').length;
          const failCount = results.filter((r: any) => r.result === 'fail').length;
          const naCount = results.filter((r: any) => r.result === 'na').length;
          
          return {
            checklistName: inspection.templateName || '-',
            inspectorName: inspection.inspectedBy ? `User ${inspection.inspectedBy}` : '-',
            inspectionDate: formatDateTime(inspection.inspectedAt),
            overallResult: formatStatus(inspection.status),
            passCount,
            failCount,
            naCount,
          };
        })
      );

      const columns: PDFTableColumn[] = [
        { header: 'งาน', key: 'taskName', width: 130 },
        { header: 'Checklist', key: 'checklistName', width: 150 },
        { header: 'ผู้ตรวจ', key: 'inspectorName', width: 100 },
        { header: 'วันที่', key: 'inspectionDate', width: 90 },
        { header: 'ผล', key: 'overallResult', width: 80 },
        { header: 'ผ่าน/ไม่ผ่าน/N/A', key: 'summary', width: 100 },
      ];

      const buffer = await createPDFDocument({
        title: `รายงานการตรวจสอบ - ${project.name}`,
        subtitle: `รหัสโครงการ: ${project.code || project.id} | จำนวนการตรวจ: ${inspections.length} ครั้ง`,
        columns,
        data: pdfData,
        orientation: 'landscape',
      });

      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "inspections_exported",
        details: JSON.stringify({ format: 'pdf', count: inspections.length }),
      });

      return {
        data: base64,
        filename: `inspections_${project.code || project.id}_${Date.now()}.pdf`,
      };
    }),

  // Export Daily Progress Report
  exportDailyProgressReport: protectedProcedure
    .input(z.object({ 
      projectId: z.number().optional(),
      date: z.string() // YYYY-MM-DD format
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = await generateProgressReport({
        projectId: input.projectId,
        startDate: input.date,
        endDate: input.date,
        reportType: 'daily',
      });

      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId || 0,
        action: "daily_progress_report_exported",
        details: JSON.stringify({ date: input.date }),
      });

      return {
        data: base64,
        filename: `daily_progress_${input.date}.pdf`,
      };
    }),

  // Export Weekly Progress Report
  exportWeeklyProgressReport: protectedProcedure
    .input(z.object({ 
      projectId: z.number().optional(),
      startDate: z.string(), // YYYY-MM-DD format
      endDate: z.string() // YYYY-MM-DD format
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = await generateProgressReport({
        projectId: input.projectId,
        startDate: input.startDate,
        endDate: input.endDate,
        reportType: 'weekly',
      });

      const base64 = buffer.toString('base64');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId || 0,
        action: "weekly_progress_report_exported",
        details: JSON.stringify({ startDate: input.startDate, endDate: input.endDate }),
      });

      return {
        data: base64,
        filename: `weekly_progress_${input.startDate}_to_${input.endDate}.pdf`,
      };
    }),
});
