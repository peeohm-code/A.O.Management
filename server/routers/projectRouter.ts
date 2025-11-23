import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { canEditProject, canDeleteProject, logAuthorizationFailure } from "../rbac";
import { requireEditProjectMiddleware, requireDeleteProjectMiddleware } from "../middleware/permissionMiddleware";
import { logProjectAudit, getClientIp, getUserAgent } from "../auditTrail";
import { emitNotification } from "../_core/socket";
import * as analyticsService from "../services/analytics.service";
import { generateArchiveExcel } from "../excelExport";
import { projectSchema, taskSchema, defectSchema, inspectionSchema } from "@shared/validations";
import { 
  updateProjectSchema, 
  getProjectSchema, 
  deleteProjectSchema,
  addProjectMemberSchema,
  removeProjectMemberSchema,
  paginationSchema,
  projectStatusSchema
} from "@shared/validation";

/**
 * Project Router
 * Auto-generated from server/routers.ts
 */
export const projectRouter = router({
  getNextProjectCode: protectedProcedure.query(async () => {
    return await db.generateProjectCode();
  }),

  list: protectedProcedure
    .input(paginationSchema.extend({
      status: projectStatusSchema.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 25;
      const offset = (page - 1) * pageSize;

      let projects = await db.getAllProjects();
      
      // Apply status filter if provided
      if (input?.status) {
        projects = projects.filter((p: any) => p.status === input.status);
      }
      const totalItems = projects.length;
      
      // Apply pagination
      const paginatedProjects = projects.slice(offset, offset + pageSize);
      const projectIds = paginatedProjects.map((p: any) => p.id);
      const statsMap = await db.getBatchProjectStats(projectIds);
      
      const projectsWithStats = paginatedProjects.map((p: any) => {
        const stats = statsMap.get(p.id);
        return {
          ...p,
          taskCount: stats?.totalTasks || 0,
          completedTasks: stats?.completedTasks || 0,
          progressPercentage: stats?.progressPercentage || 0,
          projectStatus: stats?.projectStatus || "on_track",
        };
      });

      const totalPages = Math.ceil(totalItems / pageSize);
      return {
        items: projectsWithStats,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems,
          totalPages,
          hasMore: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    }),

  get: protectedProcedure
    .input(getProjectSchema)
    .query(async ({ input }) => {
      return await db.getProjectById(input.id);
    }),

  create: roleBasedProcedure("projects", "create")
    .input(projectSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await db.createProject({
        ...input,
        createdBy: ctx.user!.id,
      });

      const projectId = result.id;

      if (!projectId || isNaN(projectId)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create project: invalid project ID (${projectId})`,
        });
      }

      await db.logActivity({
        userId: ctx.user!.id,
        projectId,
        action: "project_created",
        details: JSON.stringify({ name: input.name }),
      });

      // Return the created project
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve created project",
        });
      }

      return project;
    }),

  update: protectedProcedure
    .input(updateProjectSchema)
    .use(requireEditProjectMiddleware)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      
      const project = await db.getProjectById(id);
      const result = await db.updateProject(id, updateData);
      
      // Log audit trail
      await logProjectAudit(
        ctx.user!.id,
        'update',
        id,
        project,
        updateData,
        getClientIp(ctx.req),
        getUserAgent(ctx.req)
      );

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: id,
        action: "project_updated",
        details: JSON.stringify(updateData),
      });

      // Send notification if status changed
      if (updateData.status && project) {
        const members = await db.getProjectMembers(id);
        const statusLabels: Record<string, string> = {
          planning: "วางแผน",
          active: "กำลังดำเนินการ",
          on_hold: "พักไว้",
          completed: "เสร็จสิ้น",
          cancelled: "ยกเลิก",
        };

        // Notify owner about status change
        const notification = {
          id: `project-status-${id}-${Date.now()}`,
          type: "project_status" as const,
          title: "สถานะโครงการเปลี่ยนแปลง",
          message: `โครงการ "${project.name}" เปลี่ยนสถานะเป็น "${statusLabels[updateData.status]}"`,
          link: `/projects/${id}`,
          timestamp: new Date(),
          read: false,
        };

        // Notify all project members
        if (members && members.length > 0) {
          members.forEach((member: any) => {
            emitNotification(member.userId, notification);
          });
        }
      }

      return result;
    }),

  archive: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.archiveProject(input.id, ctx.user!.id, input.reason);

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_archived",
        details: input.reason || "Project archived",
      });

      return { success: true };
    }),

  unarchive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.unarchiveProject(input.id, ctx.user!.id);

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_unarchived",
        details: "Project unarchived",
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(deleteProjectSchema)
    .use(requireDeleteProjectMiddleware)
    .mutation(async ({ input, ctx }) => {
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Log audit trail before deletion
      await logProjectAudit(
        ctx.user!.id,
        'delete',
        input.id,
        project,
        null,
        getClientIp(ctx.req),
        getUserAgent(ctx.req)
      );
      
      // Delete project (cascade will handle related records)
      await db.deleteProject(input.id);

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_deleted",
        details: JSON.stringify({ name: project.name }),
      });

      return { success: true };
    }),

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    const archivedProjects = await db.getArchivedProjects(ctx.user!.id);
    const projectIds = archivedProjects.map((p: any) => p.id);
    const statsMap = await db.getBatchProjectStats(projectIds);
    
    const projectsWithStats = archivedProjects.map((project: any) => {
      const stats = statsMap.get(project.id);
      return {
        ...project,
        taskCount: stats?.totalTasks || 0,
        completedTasks: stats?.completedTasks || 0,
        progressPercentage: stats?.progressPercentage || 0,
      };
    });
    return projectsWithStats;
  }),

  exportArchiveExcel: protectedProcedure.query(async ({ ctx }) => {
    const archivedProjects = await db.getArchivedProjects(ctx.user!.id);

    const exportData = archivedProjects.map((project: any) => {
      const archivedYears = project.archivedAt
        ? (Date.now() - new Date(project.archivedAt).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
        : 0;

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        projectStatus: project.status,
        archivedAt: project.archivedAt,
        archivedReason: project.archivedReason,
        archivedYears,
      };
    });

    const excelBuffer = await generateArchiveExcel(exportData);
    const base64 = excelBuffer.toString("base64");

    return {
      data: base64,
      fileName: `archive_projects_${new Date().toISOString().split("T")[0]}.xlsx`,
    };
  }),

  getArchiveHistory: protectedProcedure
    .input(getProjectSchema)
    .query(async ({ input }) => {
      return await db.getArchiveHistory(input.id);
    }),

  addMember: roleBasedProcedure("projects", "assignMembers")
    .input(addProjectMemberSchema)
    .mutation(async ({ input, ctx }) => {
      return await db.addProjectMember(input);
    }),

  validateCompleteness: protectedProcedure
    .input(getProjectSchema)
    .query(async ({ input }) => {
      return await db.validateProjectCompleteness(input.id);
    }),

  openProject: roleBasedProcedure("projects", "edit")
    .input(
      z.object({
        id: z.number(),
        newStatus: z.enum(["planning", "active"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.openProject(input.id, input.newStatus);

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_opened",
        details: JSON.stringify({ newStatus: input.newStatus }),
      });

      return result;
    }),

  exportExcel: protectedProcedure
    .input(getProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const { exportProjectToExcel, getExportFilename } = await import(
        "../exportExcel"
      );
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const buffer = await exportProjectToExcel(input.id);
      const base64 = buffer.toString("base64");
      const filename = getExportFilename(project.name, "xlsx");

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_exported",
        details: JSON.stringify({ format: "excel", filename }),
      });

      return { data: base64, filename };
    }),

  exportPDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { exportProjectToPDF } = await import("../exportPDF");
      const { getExportFilename } = await import("../exportExcel");
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const buffer = await exportProjectToPDF(input.id);
      const base64 = buffer.toString("base64");
      const filename = getExportFilename(project.name, "pdf");

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_exported",
        details: JSON.stringify({ format: "pdf", filename }),
      });

      return { data: base64, filename };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      const results = {
        success: [] as number[],
        failed: [] as { id: number; error: string }[],
      };

      for (const id of input.ids) {
        try {
          await db.deleteProject(id);
          await db.logActivity({
            userId: ctx.user!.id,
            projectId: id,
            action: "project_deleted",
            details: JSON.stringify({ projectId: id, bulkOperation: true }),
          });
          results.success.push(id);
        } catch (error) {
          results.failed.push({
            id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  stats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await analyticsService.getProjectStats(input.id);
    }),

  downloadData: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Simplified version - just get basic project data
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Create simple export data
      const exportData = {
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
          location: project.location,
          startDate: project.startDate,
          endDate: project.endDate,
          projectStatus: project.status,
          archivedAt: project.archivedAt,
          archivedReason: project.archivedReason,
        },
        exportedAt: new Date().toISOString(),
      };

      // Create simple report
      const report =
        `# รายงานโครงการ: ${project.name}\n\n` +
        `**รหัส:** ${project.code || "N/A"}\n` +
        `**สถานที่:** ${project.location || "N/A"}\n` +
        `**สถานะ:** ${project.status}\n` +
        `**วันที่ Archive:** ${project.archivedAt ? new Date(project.archivedAt).toLocaleDateString("th-TH") : "N/A"}\n` +
        `**เหตุผล:** ${project.archivedReason || "N/A"}\n`;

      return {
        exportData,
        report,
        fileName: `project_${project.code || project.id}_export_${Date.now()}.json`,
        reportFileName: `project_${project.code || project.id}_report_${Date.now()}.md`,
      };
    }),

  listWithStats: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getProjectsByUser(ctx.user!.id);
    const projectIds = projects.map((p: any) => p.projects.id);
    const statsMap = await db.getBatchProjectStats(projectIds);
    
    const projectsWithStats = projects.map((p: any) => {
      const stats = statsMap.get(p.projects.id);
      return {
        ...p.projects,
        stats,
      };
    });
    return projectsWithStats;
  }),
});
