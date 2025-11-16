import { z } from "zod";
import { canEditDefect, canDeleteDefect } from "@shared/permissions";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { validateTaskCreateInput, validateTaskUpdateInput, validateInspectionSubmission, validateDefectCreateInput, validateDefectUpdateInput } from "@shared/validationUtils";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "./_core/trpc";
import * as db from "./db";
import { generateProjectExport, generateProjectReport } from "./downloadProject";
import { generateArchiveExcel } from "./excelExport";
import { storagePut } from "./storage";
import { getTaskDisplayStatus, getTaskDisplayStatusLabel, getTaskDisplayStatusColor } from "./taskStatusHelper";
import { notifyOwner } from "./_core/notification";
import { checkArchiveWarnings } from "./archiveNotifications";
import { emitNotification } from "./_core/socket";
import { createNotification } from "./notificationService";
import { projectSchema, taskSchema, defectSchema, inspectionSchema } from "@shared/validations";
import { healthRouter } from "./monitoring/healthRouter";
import { optimizationRouter } from "./optimization/optimizationRouter";
import { cacheRouter } from "./cache/cacheRouter";
import { databaseRouter } from "./database/databaseRouter";
import { performanceRouter } from "./performance/performanceRouter";
import { getHealthStatus, formatBytes } from "./health";
import { exportRouter } from "./exportRouter";
import { monitoringRouter } from "./routers/monitoring";
import { teamRouter } from "./routers/teamRouter";

/**
 * Project Router - Project Management
 */
const projectRouter = router({
  getNextProjectCode: protectedProcedure.query(async () => {
    return await db.generateProjectCode();
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getAllProjects();
    const projectsWithStats = await Promise.all(
      projects.map(async (p: any) => {
        const stats = await db.getProjectStats(p.id);
        return {
          ...p,
          taskCount: stats?.totalTasks || 0,
          completedTasks: stats?.completedTasks || 0,
          progressPercentage: stats?.progressPercentage || 0,
          projectStatus: stats?.projectStatus || 'on_track',
        };
      })
    );
    return projectsWithStats;
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await db.getProjectById(input.id);
  }),

  create: roleBasedProcedure('projects', 'create')
    .input(projectSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await db.createProject({
        ...input,
        createdBy: ctx.user!.id,
      });

      const projectId = result.id;
      
      if (!projectId || isNaN(projectId)) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create project: invalid project ID (${projectId})`,
        });
      }
      
      await db.logActivity({
        userId: ctx.user!.id,
        projectId,
        action: "project_created",
        details: JSON.stringify({ name: input.name }),
      });

      return { success: true, id: projectId };
    }),

  update: roleBasedProcedure('projects', 'edit')
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        code: z.string().optional(),
        location: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        ownerName: z.string().optional(),
        color: z.string().optional(),
        status: z.enum(["draft", "planning", "active", "on_hold", "completed", "cancelled"]).optional(),
        completionPercentage: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const project = await db.getProjectById(id);
      const result = await db.updateProject(id, updateData);

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

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    const archivedProjects = await db.getArchivedProjects(ctx.user!.id);
    const projectsWithStats = await Promise.all(
      archivedProjects.map(async (project: any) => {
        const stats = await db.getProjectStats(project.id);
        return {
          ...project,
          taskCount: stats?.totalTasks || 0,
          completedTasks: stats?.completedTasks || 0,
          progressPercentage: stats?.progressPercentage || 0,
        };
      })
    );
    return projectsWithStats;
  }),

  exportArchiveExcel: protectedProcedure.query(async ({ ctx }) => {
    const archivedProjects = await db.getArchivedProjects(ctx.user!.id);
    
    const exportData = archivedProjects.map((project: any) => {
      const archivedYears = project.archivedAt
        ? (Date.now() - new Date(project.archivedAt).getTime()) / (1000 * 60 * 60 * 24 * 365)
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

    const excelBuffer = generateArchiveExcel(exportData);
    const base64 = excelBuffer.toString('base64');
    
    return {
      data: base64,
      fileName: `archive_projects_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }),

  getArchiveHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getArchiveHistory(input.id);
    }),

  addMember: roleBasedProcedure('projects', 'assignMembers')
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(["project_manager", "qc_inspector", "worker"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.addProjectMember(input);
    }),

  validateCompleteness: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.validateProjectCompleteness(input.id);
    }),

  openProject: roleBasedProcedure('projects', 'edit')
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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { exportProjectToExcel, getExportFilename } = await import('./exportExcel');
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const buffer = await exportProjectToExcel(input.id);
      const base64 = buffer.toString('base64');
      const filename = getExportFilename(project.name, 'xlsx');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_exported",
        details: JSON.stringify({ format: 'excel', filename }),
      });

      return { data: base64, filename };
    }),

  exportPDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { exportProjectToPDF } = await import('./exportPDF');
      const { getExportFilename } = await import('./exportExcel');
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const buffer = await exportProjectToPDF(input.id);
      const base64 = buffer.toString('base64');
      const filename = getExportFilename(project.name, 'pdf');

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_exported",
        details: JSON.stringify({ format: 'pdf', filename }),
      });

      return { data: base64, filename };
    }),

  delete: roleBasedProcedure('projects', 'delete')
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteProject(input.id);

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.id,
        action: "project_deleted",
        details: JSON.stringify({ projectId: input.id }),
      });

      return { success: true };
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
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    }),

  stats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getProjectStats(input.id);
    }),

  downloadData: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Simplified version - just get basic project data
      const project = await db.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
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
          budget: project.budget,
          projectStatus: project.status,
          archivedAt: project.archivedAt,
          archivedReason: project.archivedReason,
        },
        exportedAt: new Date().toISOString(),
      };

      // Create simple report
      const report = `# รายงานโครงการ: ${project.name}\n\n` +
        `**รหัส:** ${project.code || 'N/A'}\n` +
        `**สถานที่:** ${project.location || 'N/A'}\n` +
        `**สถานะ:** ${project.status}\n` +
        `**วันที่ Archive:** ${project.archivedAt ? new Date(project.archivedAt).toLocaleDateString('th-TH') : 'N/A'}\n` +
        `**เหตุผล:** ${project.archivedReason || 'N/A'}\n`;
      
      return {
        exportData,
        report,
        fileName: `project_${project.code || project.id}_export_${Date.now()}.json`,
        reportFileName: `project_${project.code || project.id}_report_${Date.now()}.md`,
      };
    }),

  listWithStats: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getProjectsByUser(ctx.user!.id);
    const projectsWithStats = await Promise.all(
      projects.map(async (p: any) => {
        const stats = await db.getProjectStats(p.projects.id);
        return {
          ...p.projects,
          stats,
        };
      })
    );
    return projectsWithStats;
  }),
});

/**
 * Task Router - Task Management
 */
const taskRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      let tasks;
      if (input.projectId) {
        tasks = await db.getTasksByProject(input.projectId);
      } else {
        // Return all tasks for user if no projectId specified
        tasks = await db.getTasksByAssignee(ctx.user!.id);
      }
      
      // Add computed display status to each task
      return tasks.map(task => {
        const displayStatus = getTaskDisplayStatus(task);
        return {
          ...task,
          displayStatus,
          displayStatusLabel: getTaskDisplayStatusLabel(displayStatus),
          displayStatusColor: getTaskDisplayStatusColor(displayStatus),
        };
      });
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const task = await db.getTaskById(input.id);
    if (!task) return null;
    
    // Add computed display status
    const displayStatus = getTaskDisplayStatus(task);
    return {
      ...task,
      displayStatus,
      displayStatusLabel: getTaskDisplayStatusLabel(displayStatus),
      displayStatusColor: getTaskDisplayStatusColor(displayStatus),
    };
  }),

  myTasks: protectedProcedure.query(async ({ ctx }) => {
    // Get all projects where user is a member
    const userProjects = await db.getProjectsByUser(ctx.user!.id);
    const projectIds = userProjects.map((p: any) => p.projects.id);
    
    // Get all tasks from those projects
    const allTasks: any[] = [];
    for (const projectId of projectIds) {
      const projectTasks = await db.getTasksByProject(projectId);
      allTasks.push(...projectTasks);
    }
    
    // Add computed display status to each task
    return allTasks.map(task => {
      const displayStatus = getTaskDisplayStatus(task);
      return {
        ...task,
        displayStatus,
        displayStatusLabel: getTaskDisplayStatusLabel(displayStatus),
        displayStatusColor: getTaskDisplayStatusColor(displayStatus),
      };
    });
  }),

  create: roleBasedProcedure('tasks', 'create')
    .input(taskSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate input using type guards
        const validation = validateTaskCreateInput({
          ...input,
          projectId: input.projectId,
        });
        
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.errors?.join(', ') || 'Invalid input',
          });
        }
        
        const result = await db.createTask({
          ...validation.data!,
          createdBy: ctx.user!.id,
        });

      const taskId = (result as any).insertId as number;

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        taskId,
        action: "task_created",
        details: JSON.stringify({ name: input.name }),
      });

      // Create notification for assignee using notification service
      if (input.assigneeId) {
        await createNotification({
          userId: input.assigneeId,
          type: "task_assigned",
          title: "มอบหมายงานใหม่",
          content: `คุณได้รับมอบหมายงาน: "${input.name}"`,
          priority: "normal",
          relatedTaskId: taskId,
          relatedProjectId: input.projectId,
          sendEmail: true, // Send email for task assignments
        });
      }

      return { success: true, id: taskId };
      } catch (error) {
        console.error('[ERROR] Task create failed:', error);
        throw error;
      }
    }),

  update: roleBasedProcedure('tasks', 'edit')
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z
          .enum([
            "todo",
            "pending_pre_inspection",
            "ready_to_start",
            "in_progress",
            "pending_final_inspection",
            "rectification_needed",
            "completed",
          ])
          .optional(),
        progress: z.number().min(0).max(100).optional(),
        assigneeId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const task = await db.getTaskById(id);
      if (!task) throw new Error("Task not found");

      // Convert date strings to Date objects if present
      const dbUpdateData: any = { ...updateData };
      if (updateData.startDate) {
        dbUpdateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        dbUpdateData.endDate = new Date(updateData.endDate);
      }

      const result = await db.updateTask(id, dbUpdateData);

      await db.logActivity({
        userId: ctx.user!.id,
        taskId: id,
        projectId: task.projectId,
        action: "task_updated",
        details: JSON.stringify(updateData),
      });

      // Send real-time notifications
      if (updateData.status) {
        const displayStatus = getTaskDisplayStatusLabel(updateData.status as any);
        const notification = {
          id: `task-status-${id}-${Date.now()}`,
          type: "task_status" as const,
          title: "สถานะงานเปลี่ยนแปลง",
          message: `งาน "${task.name}" เปลี่ยนสถานะเป็น "${displayStatus}"`,
          link: `/tasks/${id}`,
          timestamp: new Date(),
          read: false,
        };
        
        // Notify task followers
        const followers = await db.getTaskFollowers(id);
        followers.forEach((follower: any) => {
          if (follower.userId !== ctx.user!.id) {
            emitNotification(follower.userId, notification);
          }
        });
      }
      
      // Send notification if task is assigned to someone
      if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
        await createNotification({
          userId: updateData.assigneeId,
          type: "task_assigned",
          title: "มีงานใหม่มอบหมาย",
          content: `คุณได้รับมอบหมายงาน "${task.name}"`,
          priority: "normal",
          relatedTaskId: id,
          relatedProjectId: task.projectId,
          sendEmail: true,
        });
      }

      // Send notification if progress is updated significantly (25%, 50%, 75%, 100%)
      if (updateData.progress !== undefined && task.progress !== updateData.progress) {
        const milestones = [25, 50, 75, 100];
        const oldProgress = task.progress || 0;
        const newProgress = updateData.progress;
        
        // Check if we crossed a milestone
        const crossedMilestone = milestones.find(
          (milestone) => oldProgress < milestone && newProgress >= milestone
        );
        
        if (crossedMilestone && task.assigneeId) {
          // Notify task followers about progress milestone
          const followers = await db.getTaskFollowers(id);
          for (const follower of followers) {
            if (follower.userId !== ctx.user!.id) {
              await createNotification({
                userId: follower.userId,
                type: "task_progress_updated",
                title: "ความคืบหน้างานอัปเดต",
                content: `งาน "${task.name}" คืบหน้าไป ${crossedMilestone}% แล้ว`,
                priority: "normal",
                relatedTaskId: id,
                relatedProjectId: task.projectId,
                sendEmail: false, // Don't send email for progress updates
              });
            }
          }
        }
      }

      return result;
    }),

  addDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        dependsOnTaskId: z.number(),
        type: z.enum(["finish_to_start", "start_to_start", "finish_to_finish"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.addTaskDependency(input);
    }),

  getDependencies: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskDependencies(input.taskId);
    }),

  removeDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        dependsOnTaskId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.removeTaskDependency(input.taskId, input.dependsOnTaskId);
    }),

  getProjectDependencies: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getAllTaskDependenciesForProject(input.projectId);
    }),

  getCriticalPath: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const { calculateCriticalPath } = await import("./criticalPath");
      const tasks = await db.getTasksByProject(input.projectId);
      const dependencies = await db.getAllTaskDependenciesForProject(input.projectId);
      
      // Transform tasks to include dependencies
      const tasksWithDeps = tasks.map(task => ({
        id: task.id,
        startDate: task.startDate,
        endDate: task.endDate,
        dependencies: dependencies.filter(d => d.taskId === task.id),
      }));
      
      return calculateCriticalPath(tasksWithDeps as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const task = await db.getTaskById(input.id);
      if (!task) throw new Error("Task not found");

      await db.deleteTask(input.id);

      await db.logActivity({
        userId: ctx.user!.id,
        projectId: task.projectId,
        taskId: input.id,
        action: "task_deleted",
        details: JSON.stringify({ name: task.name }),
      });

      return { success: true };
    }),

  bulkUpdateStatus: roleBasedProcedure('tasks', 'edit')
    .input(
      z.object({
        taskIds: z.array(z.number()).min(1),
        status: z.enum([
          "todo",
          "pending_pre_inspection",
          "ready_to_start",
          "in_progress",
          "pending_final_inspection",
          "rectification_needed",
          "completed",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { taskIds, status } = input;
      let successCount = 0;

      for (const taskId of taskIds) {
        try {
          const task = await db.getTaskById(taskId);
          if (!task) continue;

          await db.updateTask(taskId, { status: status as any });
          await db.logActivity({
            userId: ctx.user!.id,
            taskId,
            projectId: task.projectId,
            action: "task_updated",
            details: JSON.stringify({ status, bulkUpdate: true }),
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update task ${taskId}:`, error);
        }
      }

      return { success: true, updated: successCount, total: taskIds.length };
    }),

  bulkAssign: roleBasedProcedure('tasks', 'edit')
    .input(
      z.object({
        taskIds: z.array(z.number()).min(1),
        assigneeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { taskIds, assigneeId } = input;
      let successCount = 0;

      for (const taskId of taskIds) {
        try {
          const task = await db.getTaskById(taskId);
          if (!task) continue;

          await db.updateTask(taskId, { assigneeId });
          await db.logActivity({
            userId: ctx.user!.id,
            taskId,
            projectId: task.projectId,
            action: "task_updated",
            details: JSON.stringify({ assigneeId, bulkAssign: true }),
          });

          // Create notification for assignee
          await db.createNotification({
            userId: assigneeId,
            type: "task_assigned",
            title: "New Task Assigned",
            content: task.name,
            relatedTaskId: taskId,
            relatedProjectId: task.projectId,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to assign task ${taskId}:`, error);
        }
      }

      return { success: true, assigned: successCount, total: taskIds.length };
    }),

  bulkDelete: roleBasedProcedure('tasks', 'delete')
    .input(
      z.object({
        taskIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.bulkDeleteTasks(input.taskIds, ctx.user!.id);
      return result;
    }),

  updatePriority: roleBasedProcedure('tasks', 'edit')
    .input(
      z.object({
        id: z.number(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.updateTaskPriority(input.id, input.priority, ctx.user!.id);
    }),

  updateCategory: roleBasedProcedure('tasks', 'edit')
    .input(
      z.object({
        id: z.number(),
        category: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.updateTaskCategory(input.id, input.category, ctx.user!.id);
    }),

  getBlockingDependencies: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getBlockingDependencies(input.taskId);
    }),

  validateCanStart: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.validateTaskCanStart(input.taskId);
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        projectId: z.number().optional(),
        status: z.string().optional(),
        assigneeId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get all tasks based on filters
      let tasks;
      
      if (input.projectId) {
        tasks = await db.getTasksByProject(input.projectId);
      } else {
        // Get all tasks from user's projects
        const userProjects = await db.getProjectsByUser(ctx.user!.id);
        const projectIds = userProjects.map((p: any) => p.projects.id);
        
        const allTasks: any[] = [];
        for (const projectId of projectIds) {
          const projectTasks = await db.getTasksByProject(projectId);
          allTasks.push(...projectTasks);
        }
        tasks = allTasks;
      }
      
      // Apply filters
      let filteredTasks = tasks;
      
      // Filter by search query (name or description)
      if (input.query && input.query.trim() !== '') {
        const queryLower = input.query.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.name.toLowerCase().includes(queryLower) ||
          (task.description && task.description.toLowerCase().includes(queryLower))
        );
      }
      
      // Filter by status
      if (input.status && input.status !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === input.status);
      }
      
      // Filter by assignee
      if (input.assigneeId) {
        filteredTasks = filteredTasks.filter((task: any) => task.assigneeId === input.assigneeId);
      }
      
      // Add computed display status to each task
      return filteredTasks.map((task: any) => {
        const displayStatus = getTaskDisplayStatus(task);
        return {
          ...task,
          displayStatus,
          displayStatusLabel: getTaskDisplayStatusLabel(displayStatus),
          displayStatusColor: getTaskDisplayStatusColor(displayStatus),
        };
      });
    }),
});


/**
 * Checklist Router - QC Management
 */
const checklistRouter = router({
  templates: protectedProcedure.query(async () => {
    // Return all templates grouped by stage
    const preExecution = await db.getChecklistTemplatesByStage("pre_execution");
    const inProgress = await db.getChecklistTemplatesByStage("in_progress");
    const postExecution = await db.getChecklistTemplatesByStage("post_execution");

    return { preExecution, inProgress, postExecution };
  }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        stage: z.enum(["pre_execution", "in_progress", "post_execution"]),
        description: z.string().optional(),
        allowGeneralComments: z.boolean().optional(),
        allowPhotos: z.boolean().optional(),
        items: z
          .array(
            z.object({
              itemText: z.string(),
              order: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Create checklist template
        
        const templateResult = await db.createChecklistTemplate({
          name: input.name,
          category: input.category,
          stage: input.stage,
          description: input.description,
          allowGeneralComments: input.allowGeneralComments,
          allowPhotos: input.allowPhotos,
          createdBy: ctx.user!.id,
        });

        const templateId = templateResult.insertId;

        // Add items if provided
        if (input.items && input.items.length > 0) {
          // Add template items
          for (const item of input.items) {
            await db.addChecklistTemplateItem({
              templateId,
              itemText: item.itemText,
              order: item.order,
            });
          }
          // Items added
        }

        return { success: true };
      } catch (error) {
        console.error('[createTemplate] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create template',
        });
      }
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.string().optional(),
        stage: z.enum(["pre_execution", "in_progress", "post_execution"]).optional(),
        description: z.string().optional(),
        allowGeneralComments: z.boolean().optional(),
        allowPhotos: z.boolean().optional(),
        items: z
          .array(
            z.object({
              itemText: z.string(),
              order: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, items, ...templateData } = input;

      // Update template basic info
      if (Object.keys(templateData).length > 0) {
        await db.updateChecklistTemplate(id, templateData);
      }

      // Update items if provided
      if (items) {
        // Delete existing items
        await db.deleteChecklistTemplateItems(id);
        // Add new items
        for (const item of items) {
          await db.addChecklistTemplateItem({
            templateId: id,
            itemText: item.itemText,
            order: item.order,
          });
        }
      }

      await db.logActivity({
        userId: ctx.user!.id,
        action: "checklist_template_updated",
        details: JSON.stringify({ templateId: id }),
      });

      return { success: true };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if template is in use (has associated task checklists)
        const checklistsUsingTemplate = await db.getTaskChecklistsByTemplateId(input.id);
        
        if (checklistsUsingTemplate && checklistsUsingTemplate.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot delete template. It is currently used in ${checklistsUsingTemplate.length} task checklist(s). Please remove the template from all tasks first.`,
          });
        }

        // Delete the template (this will also delete associated items)
        await db.deleteChecklistTemplate(input.id);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "checklist_template_deleted",
          details: JSON.stringify({ templateId: input.id }),
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[deleteTemplate] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete template',
        });
      }
    }),

  listTemplates: protectedProcedure.query(async () => {
    return await db.getAllChecklistTemplates();
  }),

  getTaskChecklists: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskChecklistsByTask(input.taskId);
    }),

  getByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskChecklistsByProject(input.projectId);
    }),

  getTaskChecklistsByTemplateId: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const checklists = await db.getTaskChecklistsByTemplateId(input.templateId);
      // Get task details for each checklist
      const result: any[] = [];
      for (const checklist of checklists) {
        const task = await db.getTaskById(checklist.taskId);
        if (task) {
          result.push({
            id: checklist.id,
            taskId: checklist.taskId,
            taskName: task.name,
            stage: checklist.stage,
            status: checklist.status,
          });
        }
      }
      return result;
    }),

  assignToTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        templateId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get template to determine stage
      const template = await db.getChecklistTemplateById(input.templateId);
      if (!template) throw new Error("Template not found");

      const result = await db.createTaskChecklist({
        taskId: input.taskId,
        templateId: input.templateId,
        stage: template.stage,
      });

      await db.logActivity({
        userId: ctx.user!.id,
        taskId: input.taskId,
        action: "checklist_assigned",
        details: JSON.stringify({ templateName: template.name }),
      });

      // Send notification to task assignee about new checklist
      const task = await db.getTaskById(input.taskId);
      if (task && task.assigneeId) {
        await createNotification({
          userId: task.assigneeId,
          type: "checklist_assigned",
          title: "มอบหมาย Checklist ใหม่",
          content: `ได้รับมอบหมาย checklist "${template.name}" สำหรับงาน "${task.name}"`,
          priority: "normal",
          relatedTaskId: input.taskId,
          relatedProjectId: task.projectId,
          sendEmail: false, // Don't send email for checklist assignments (low priority)
        });
      }

      return { success: true, id: (result as any).insertId };
    }),

  removeFromTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const checklist = await db.getTaskChecklistById(input.id);
      if (!checklist) throw new Error("Checklist not found");

      await db.deleteTaskChecklist(input.id);

      await db.logActivity({
        userId: ctx.user!.id,
        taskId: checklist.taskId,
        action: "checklist_removed",
        details: JSON.stringify({ checklistId: input.id }),
      });

      return { success: true };
    }),

  updateChecklistStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["not_started", "pending_inspection", "in_progress", "completed", "failed"]),
        generalComments: z.string().optional(),
        photoUrls: z.string().optional(),
        signature: z.string().optional(),
        itemResults: z.array(z.object({
          templateItemId: z.number(),
          result: z.enum(["pass", "fail", "na"]),
        })).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const checklist = await db.getTaskChecklistById(input.id);
      if (!checklist) throw new Error("Checklist not found");
      
      // Validate inspection submission if itemResults provided
      if (input.itemResults && input.itemResults.length > 0) {
        const validation = validateInspectionSubmission({
          taskChecklistId: input.id,
          inspectorId: ctx.user!.id,
          itemResults: input.itemResults.map(item => ({
            templateItemId: item.templateItemId,
            result: item.result,
          })),
          overallNote: input.generalComments,
          signatureUrl: input.signature,
          photoUrls: input.photoUrls ? JSON.parse(input.photoUrls) : undefined,
        });
        
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.errors?.join(', ') || 'Invalid inspection data',
          });
        }
      }

      // Update checklist status, comments, photos, and signature
      await db.updateTaskChecklist(input.id, {
        status: input.status,
        generalComments: input.generalComments,
        photoUrls: input.photoUrls,
        signature: input.signature,
        inspectedBy: ctx.user!.id,
        inspectedAt: new Date(),
      });

      // Save individual item results if provided
      if (input.itemResults && input.itemResults.length > 0) {
        for (const itemResult of input.itemResults) {
          await db.saveChecklistItemResult({
            taskChecklistId: input.id,
            templateItemId: itemResult.templateItemId,
            result: itemResult.result,
          });
        }
      }

      await db.logActivity({
        userId: ctx.user!.id,
        taskId: checklist.taskId,
        action: "checklist_status_updated",
        details: JSON.stringify({ checklistId: input.id, status: input.status }),
      });

      // Auto-update task progress based on checklist completion
      const { calculateAndUpdateTaskProgress } = await import("./taskProgressHelper");
      await calculateAndUpdateTaskProgress(checklist.taskId);

      return { success: true };
    }),

  attachToTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        templateId: z.number(),
        stage: z.enum(["pre_execution", "in_progress", "post_execution"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.createTaskChecklist(input);

      // Update task status if pre_execution
      if (input.stage === "pre_execution") {
        await db.updateTask(input.taskId, {
          status: "pending_pre_inspection",
        });

        // Notify QC team
        await db.createNotification({
          userId: ctx.user!.id,
          type: "inspection_requested",
          title: "Inspection Requested",
          relatedTaskId: input.taskId,
        });
      }

      return result;
    }),

  submitInspection: protectedProcedure
    .input(
      z.object({
        taskChecklistId: z.number(),
        taskId: z.number(),
        items: z.array(
          z.object({
            templateItemId: z.number(),
            itemText: z.string(),
            result: z.enum(["pass", "fail", "na"]),
            photoUrls: z.string().optional(), // JSON string of photo URLs for this item
          })
        ),
        generalComments: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
        signature: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Use the new submitInspection function from db.ts
      const result = await db.submitInspection({
        taskChecklistId: input.taskChecklistId,
        taskId: input.taskId,
        inspectedBy: ctx.user!.id,
        itemResults: input.items,
        generalComments: input.generalComments,
        photoUrls: input.photoUrls,
        signature: input.signature,
      });

      return result;
    }),

  // Get inspection results for a checklist
  getInspectionResults: protectedProcedure
    .input(z.object({ taskChecklistId: z.number() }))
    .query(async ({ input }) => {
      const results = await db.getChecklistResults(input.taskChecklistId);
      return results;
    }),

  // Get inspection history with details for a task checklist
  getInspectionHistory: protectedProcedure
    .input(z.object({ taskChecklistId: z.number() }))
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      // Get the checklist info
      const checklist = await db.getTaskChecklistById(input.taskChecklistId);
      if (!checklist) return [];

      // Get all inspection results
      const results = await db.getChecklistResults(input.taskChecklistId);
      if (results.length === 0) return [];

      // Get template items for reference
      const templateItems = await db.getChecklistTemplateItems(checklist.templateId);

      // Group results by inspection (assuming one inspection per checklist for now)
      // In the future, we might want to track multiple inspections with timestamps
      const inspection = {
        id: checklist.id,
        checklistId: checklist.id,
        inspectedAt: checklist.updatedAt,
        inspectedBy: checklist.inspectedBy,
        status: checklist.status,
        generalComments: checklist.generalComments,
        photoUrls: checklist.photoUrls ? JSON.parse(checklist.photoUrls) : [],
        items: results.map((r: any) => {
          const templateItem = templateItems.find((ti: any) => ti.id === r.templateItemId);
          return {
            id: r.id,
            itemText: templateItem?.itemText || 'Unknown item',
            result: r.result,
            photoUrls: r.photoUrls ? JSON.parse(r.photoUrls) : [],
          };
        }),
      };

      return [inspection];
    }),

  // Create re-inspection from failed inspection
  createReinspection: protectedProcedure
    .input(z.object({ checklistId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.createReinspection(input.checklistId);
      
      // Send notification to assignee
      const checklist = await db.getTaskChecklistById(input.checklistId);
      if (checklist) {
        const task = await db.getTaskById(checklist.taskId);
        if (task && task.assigneeId) {
          await createNotification({
            userId: task.assigneeId,
            type: "inspection_requested",
            title: "ขอตรวจสอบซ้ำ",
            content: `งาน "${task.name}" ต้องการการตรวจสอบซ้ำ`,
            relatedTaskId: task.id,
            relatedProjectId: task.projectId,
          });
        }
      }
      
      return result;
    }),

  // Get re-inspection history
  getReinspectionHistory: protectedProcedure
    .input(z.object({ checklistId: z.number() }))
    .query(async ({ input }) => {
      return await db.getReinspectionHistory(input.checklistId);
    }),

  // Get original inspection
  getOriginalInspection: protectedProcedure
    .input(z.object({ reinspectionId: z.number() }))
    .query(async ({ input }) => {
      return await db.getOriginalInspection(input.reinspectionId);
    }),

  // Get inspection history for a task
  getTaskInspectionHistory: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getInspectionHistoryByTask(input.taskId);
    }),

  // Get detailed inspection results
  getInspectionDetail: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return await db.getInspectionDetail(input.inspectionId);
    }),

  // Get inspection summary statistics for a task
  getInspectionSummary: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getInspectionSummaryByTask(input.taskId);
    }),

  // Generate PDF report for inspection
  generateInspectionPDF: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      const { generateInspectionPDF } = await import("./inspectionPdfGenerator");
      const htmlContent = await generateInspectionPDF(input.inspectionId);
      return { html: htmlContent };
    }),

  // Get all task checklists with template and task info
  getAllTaskChecklists: protectedProcedure.query(async () => {
    const checklists = await db.getAllTaskChecklists();
    const tasks = await db.getAllTasks();
    const templates = await db.getAllChecklistTemplates();
    
    // Get all template items for all templates
    const allTemplateItems = await Promise.all(
      templates.map(async (template: any) => ({
        templateId: template.id,
        items: await db.getChecklistTemplateItems(template.id),
      }))
    );
    
    // Map checklists with task and template info
    return checklists.map((checklist: any) => {
      const task = tasks.find((t: any) => t.id === checklist.taskId);
      const template = templates.find((t: any) => t.id === checklist.templateId);
      const templateItems = allTemplateItems.find((t: any) => t.templateId === checklist.templateId)?.items || [];
      
      return {
        ...checklist,
        name: template?.name || "Unknown Template",
        taskName: task?.name || "Unknown Task",
        items: templateItems.map((item: any) => ({
          id: item.id,
          description: item.itemText,
          acceptanceCriteria: null, // Can be added to schema later if needed
        })),
      };
    });
  }),
});

/**
 * Defect Router - Defect Management (CAR/PAR/NCR)
 */
const defectRouter = router({
  // Get defect by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectById(input.id);
    }),

  // Get defects by task
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectsByTask(input.taskId);
    }),

  // Get defects by type (CAR/PAR/NCR)
  listByType: protectedProcedure
    .input(z.object({ type: z.enum(["CAR", "PAR", "NCR"]) }))
    .query(async ({ input }) => {
      return await db.getDefectsByType(input.type);
    }),

  // Get defects by status
  listByStatus: protectedProcedure
    .input(z.object({ 
      status: z.enum(["reported", "rca_pending", "action_plan", "assigned", "in_progress", "implemented", "verification", "effectiveness_check", "closed", "rejected", "analysis", "resolved"]) 
    }))
    .query(async ({ input }) => {
    // @ts-ignore
      return await db.getDefectsByStatus(input.status);
    }),

  // Get defects by checklist
  listByChecklist: protectedProcedure
    .input(z.object({ checklistId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectsByChecklist(input.checklistId);
    }),

  // Get open/reported defects
  openDefects: protectedProcedure.query(async () => {
    return await db.getOpenDefects();
  }),

  // Get all defects
  allDefects: protectedProcedure.query(async () => {
    try {
      const defects = await db.getAllDefects();
      return Array.isArray(defects) ? defects : [];
    } catch (error) {
      console.error('[defectRouter.allDefects] Error:', error);
      return [];
    }
  }),

  // Get single defect by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectById(input.id);
    }),

  // Create new CAR/PAR/NCR
  create: roleBasedProcedure('defects', 'create')
    .input(
      z.object({
        taskId: z.number(),
        checklistItemResultId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        photoUrls: z.string().optional(),
        beforePhotos: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        assignedTo: z.number().optional(),
        // CAR/PAR/NCR specific fields
        type: z.enum(["CAR", "PAR", "NCR"]).default("CAR"),
        checklistId: z.number().optional(),
        rootCause: z.string().optional(),
        correctiveAction: z.string().optional(),
        preventiveAction: z.string().optional(),
        dueDate: z.date().optional(),
        ncrLevel: z.enum(["major", "minor"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate defect creation input
      const validation = validateDefectCreateInput({
        title: input.title,
        taskId: input.taskId,
        taskChecklistId: input.checklistId,
        severity: input.severity,
        description: input.description,
        detectedById: ctx.user!.id,
        assignedToId: input.assignedTo,
        dueDate: input.dueDate,
      });
      
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errors?.join(', ') || 'Invalid defect data',
        });
      }
      
      const result = await db.createDefect({
        ...input,
        reportedBy: ctx.user!.id,
      });

      // Send notification to assignee using notification service
      if (input.assignedTo) {
        await createNotification({
          userId: input.assignedTo,
          type: "defect_created",
          title: `มี ${input.type} ใหม่มอบหมาย`,
          content: `คุณได้รับมอบหมาย ${input.type}: "${input.title}" ระดับความรุนแรง: ${input.severity}`,
          priority: input.severity === "critical" ? "urgent" : input.severity === "high" ? "high" : "normal",
          relatedDefectId: (result as any).insertId,
          relatedTaskId: input.taskId,
          sendEmail: true, // Always send email for defect assignments
        });
      }

      return result;
    }),

  // Update defect (workflow transitions)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        // Basic fields
        title: z.string().optional(),
        description: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        status: z.enum(["reported", "analysis", "in_progress", "resolved", "pending_reinspection", "closed"]).optional(),
        assignedTo: z.number().optional(),
        resolutionComment: z.string().optional(),
        resolutionPhotoUrls: z.string().optional(),
        // CAR/PAR/NCR workflow fields
        rootCause: z.string().optional(),
        correctiveAction: z.string().optional(),
        preventiveAction: z.string().optional(),
        dueDate: z.date().optional(),
        // Action Plan fields (in_progress status)
        actionMethod: z.string().optional(),
        actionResponsible: z.string().optional(),
        actionDeadline: z.date().optional(),
        actionNotes: z.string().optional(),
        ncrLevel: z.enum(["major", "minor"]).optional(),
        verificationComment: z.string().optional(),
        resolutionNotes: z.string().optional(),
        implementationMethod: z.string().optional(),
        beforePhotos: z.string().optional(),
        afterPhotos: z.string().optional(),
        closureNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateData } = input;
        const defect = await db.getDefectById(id);
        if (!defect) throw new Error("Defect not found");
        
        // Check edit permission
        if (!canEditDefect(ctx.user.role, ctx.user!.id, defect)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'คุณไม่มีสิทธิ์แก้ไข defect นี้',
          });
        }

        const dataToUpdate = {
        ...updateData,
        resolvedBy: updateData.status === "resolved" ? ctx.user!.id : undefined,
        resolvedAt: updateData.status === "resolved" ? new Date() : undefined,
        verifiedBy: updateData.status === "closed" ? ctx.user!.id : undefined,
        verifiedAt: updateData.status === "closed" ? new Date() : undefined,
      };
      // Validation: If beforePhotos exists, afterPhotos is required when status is resolved
      if (updateData.status === "resolved") {
        const defect = await db.getDefectById(id);
        if (defect && defect.beforePhotos) {
          try {
            const beforePhotosArray = JSON.parse(defect.beforePhotos);
            if (beforePhotosArray && beforePhotosArray.length > 0) {
              if (!input.afterPhotos) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "After photos are required when before photos exist",
                });
              }
              const afterPhotosArray = JSON.parse(input.afterPhotos);
              if (!afterPhotosArray || afterPhotosArray.length === 0) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "After photos are required when before photos exist",
                });
              }
            }
          } catch (e) {
            if (e instanceof TRPCError) throw e;
            // If JSON parse fails, ignore validation
          }
        }
      }
      
      const result = await db.updateDefect(id, dataToUpdate);

      // Notify assignee if assigned
      if (updateData.assignedTo && updateData.assignedTo !== defect.assignedTo) {
        await createNotification({
          userId: updateData.assignedTo,
          type: "defect_created",
          title: `${defect.type} มอบหมายให้คุณ`,
          content: `คุณได้รับมอบหมาย ${defect.type}: "${defect.title}"`,
          priority: defect.severity === "critical" ? "urgent" : defect.severity === "high" ? "high" : "normal",
          relatedDefectId: defect.id,
          relatedTaskId: defect.taskId,
          sendEmail: true,
        });
      }

      // Notify when status changes
      if (updateData.status && updateData.status !== defect.status) {
        const statusLabels: Record<string, string> = {
          reported: "รายงานแล้ว",
          analysis: "กำลังวิเคราะห์",
          in_progress: "กำลังดำเนินการ",
          resolved: "แก้ไขเสร็จแล้ว",
          pending_reinspection: "รอตรวจสอบซ้ำ",
          closed: "ปิดแล้ว",
        };

        // Notify assignee about status change
        if (defect.assignedTo) {
          await createNotification({
            userId: defect.assignedTo,
            type: "defect_status_changed",
            title: `${defect.type} เปลี่ยนสถานะ`,
            content: `${defect.type} "${defect.title}" เปลี่ยนสถานะเป็น: ${statusLabels[updateData.status]}`,
            priority: "normal",
            relatedDefectId: defect.id,
            relatedTaskId: defect.taskId,
            sendEmail: false,
          });
        }

        // Notify owner/admin when defect is resolved
        if (updateData.status === "resolved") {
          await notifyOwner({
            title: `${defect.type} แก้ไขเสร็จแล้ว`,
            content: `${defect.title} - รอตรวจสอบผลการแก้ไข`,
          });
        }
      }

        return result;
      } catch (error) {
        console.error("[defect.update] Error:", error);
        throw error;
      }
    }),

  // Defect Attachments
  getAttachments: protectedProcedure
    .input(z.object({ defectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectAttachments(input.defectId);
    }),

  getAttachmentsByType: protectedProcedure
    .input(z.object({ 
      defectId: z.number(),
      attachmentType: z.enum(["before", "after", "supporting"])
    }))
    .query(async ({ input }) => {
      return await db.getDefectAttachmentsByType(input.defectId, input.attachmentType);
    }),

  hasAfterPhotos: protectedProcedure
    .input(z.object({ defectId: z.number() }))
    .query(async ({ input }) => {
      const photos = await db.getDefectAttachmentsByType(input.defectId, 'after');
      return photos.length > 0;
    }),

  uploadAttachment: protectedProcedure
    .input(z.object({
      defectId: z.number(),
      fileUrl: z.string(),
      fileKey: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
      attachmentType: z.enum(["before", "after", "supporting"])
    }))
    .mutation(async ({ input, ctx }) => {
      const attachmentId = await db.createDefectAttachment({
        ...input,
        uploadedBy: ctx.user!.id,
      });
      return { id: attachmentId };
    }),

  deleteAttachment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteDefectAttachment(input.id);
      return { success: true };
    }),

  // Delete defect (Owner, Admin, PM only)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Check delete permission
      if (!canDeleteDefect(ctx.user!.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'เฉพาะ Owner, Admin และ PM เท่านั้นที่สามารถลบ defect ได้',
        });
      }
      
      await db.deleteDefect(input.id);
      return { success: true };
    }),

  // Dashboard Statistics
  getStatsByStatus: protectedProcedure
    .query(async () => {
      try {
        const stats = await db.getDefectStatsByStatus();
        return Array.isArray(stats) ? stats : [];
      } catch (error) {
        console.error('[defectRouter.getStatsByStatus] Error:', error);
        return [];
      }
    }),

  getStatsByType: protectedProcedure
    .query(async () => {
      try {
        const stats = await db.getDefectStatsByType();
        return Array.isArray(stats) ? stats : [];
      } catch (error) {
        console.error('[defectRouter.getStatsByType] Error:', error);
        return [];
      }
    }),

  getStatsByPriority: protectedProcedure
    .query(async () => {
      try {
        const stats = await db.getDefectStatsByPriority();
        return Array.isArray(stats) ? stats : [];
      } catch (error) {
        console.error('[defectRouter.getStatsByPriority] Error:', error);
        return [];
      }
    }),

  getMetrics: protectedProcedure
    .query(async () => {
      try {
        const metrics = await db.getDefectMetrics();
        // Ensure we always return a valid metrics object
        return metrics || { total: 0, open: 0, closed: 0, pendingVerification: 0, overdue: 0 };
      } catch (error) {
        console.error('[defectRouter.getMetrics] Error:', error);
        return { total: 0, open: 0, closed: 0, pendingVerification: 0, overdue: 0 };
      }
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getRecentDefects(input.limit);
    }),

  // Re-inspection workflow
  requestReinspection: protectedProcedure
    .input(z.object({ 
      defectId: z.number(),
      comments: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        
        const defect = await db.getDefectById(input.defectId);
        if (!defect) throw new Error("Defect not found");
        
        if (defect.status !== "resolved") {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'เฉพาะ defect ที่มีสถานะ resolved เท่านั้นที่สามารถขอตรวจสอบซ้ำได้',
          });
        }

        // Update defect status to pending_reinspection
        await db.updateDefect(input.defectId, {
          status: "pending_reinspection",
        });

        // Create inspection record
        const inspectionData = {
          defectId: input.defectId,
          inspectorId: ctx.user.id,
          inspectionType: "reinspection" as const,
          result: "pending" as const,
          comments: input.comments,
        };
        await db.createDefectInspection(inspectionData);

        // Notify QC inspectors
        await notifyOwner({
          title: `มีการขอตรวจสอบซ้ำ ${defect.type}`,
          content: `${defect.title} - รอการตรวจสอบซ้ำ`,
        });

        return { success: true };
      } catch (error) {
        console.error('[requestReinspection] Error:', error);
        throw error;
      }
    }),

  submitReinspection: protectedProcedure
    .input(z.object({
      defectId: z.number(),
      result: z.enum(["passed", "failed"]),
      comments: z.string().optional(),
      photoUrls: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const defect = await db.getDefectById(input.defectId);
      if (!defect) throw new Error("Defect not found");
      if (defect.status !== "pending_reinspection") {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Defect ต้องอยู่ในสถานะ pending_reinspection',
        });
      }

      // Create inspection record
      await db.createDefectInspection({
        defectId: input.defectId,
        inspectorId: ctx.user!.id,
        inspectionType: "reinspection",
        result: input.result,
        comments: input.comments,
        photoUrls: input.photoUrls,
      });

      // Update defect status based on result
      const newStatus = input.result === "passed" ? "closed" : "in_progress";
      await db.updateDefect(input.defectId, {
        status: newStatus,
        verifiedBy: input.result === "passed" ? ctx.user!.id : undefined,
        verifiedAt: input.result === "passed" ? new Date() : undefined,
      });

      // Notify assignee
      if (defect.assignedTo) {
        const message = input.result === "passed" 
          ? `${defect.type} ผ่านการตรวจสอบซ้ำแล้ว`
          : `${defect.type} ไม่ผ่านการตรวจสอบซ้ำ - ต้องแก้ไขใหม่`;
        
        await db.createNotification({
          userId: defect.assignedTo,
          type: "defect_reinspected",
          title: `ผลการตรวจสอบซ้ำ ${defect.type}`,
          content: message,
          relatedTaskId: defect.taskId,
        });
      }

      return { success: true, newStatus };
    }),

  getInspectionHistory: protectedProcedure
    .input(z.object({ defectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectInspections(input.defectId);
    }),

  getLatestInspection: protectedProcedure
    .input(z.object({ defectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getLatestInspection(input.defectId);
    }),
});

/**
 * Comment Router - Collaboration
 */
const commentRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskComments(input.taskId);
    }),

  add: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        content: z.string().min(1),
        mentions: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.addTaskComment({
        taskId: input.taskId,
        userId: ctx.user!.id,
        content: input.content,
        mentions: input.mentions ? JSON.stringify(input.mentions) : undefined,
      });

      // Notify mentioned users using notification service
      if (input.mentions && input.mentions.length > 0) {
        const task = await db.getTaskById(input.taskId);
        const commenter = ctx.user!;
        
        for (const userId of input.mentions) {
          // Don't notify the commenter themselves
          if (userId === ctx.user!.id) continue;
          
          await createNotification({
            userId,
            type: "comment_mention",
            title: "มีคน mention คุณใน comment",
            content: `${commenter.name || "ผู้ใช้"} ได้ mention คุณใน comment${task ? ` ของงาน "${task.name}"` : ""}`,
            priority: "normal",
            relatedTaskId: input.taskId,
            relatedProjectId: task?.projectId,
            sendEmail: false, // Don't send email for mentions (low priority)
          });
        }
      }

      return result;
    }),
});

/**
 * Attachment Router - File Management
 */
const attachmentRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskAttachments(input.taskId);
    }),

  upload: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      
      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `task-${input.taskId}/${timestamp}-${randomSuffix}-${input.fileName}`;
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(input.fileContent, "base64");
      const fileSize = fileBuffer.length;
      
      // Upload to S3
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
      
      // Save to database
      const result = await db.addTaskAttachment({
        taskId: input.taskId,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        fileSize,
        mimeType: input.mimeType,
        uploadedBy: ctx.user!.id,
      });
      
      // Log activity
      const task = await db.getTaskById(input.taskId);
      if (task) {
        await db.logActivity({
          userId: ctx.user!.id,
          projectId: task.projectId,
          taskId: input.taskId,
          action: "attachment_added",
          details: JSON.stringify({ fileName: input.fileName }),
        });
      }
      
      return { success: true, id: (result as any).insertId, url };
    }),

  add: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.addTaskAttachment({
        ...input,
        uploadedBy: ctx.user!.id,
      });
    }),
    
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Get attachment info
      const attachment = await db.getAttachmentById(input.id);
      if (!attachment) {
        throw new Error("Attachment not found");
      }
      
      // Check permission: only uploader, admin, or PM can delete
      const canDelete =
        attachment.uploadedBy === ctx.user!.id ||
        ctx.user!.role === "admin" ||
        ctx.user!.role === "project_manager";
      
      if (!canDelete) {
        throw new Error("Permission denied");
      }
      
      // Delete from database
      await db.deleteTaskAttachment(input.id);
      
      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        taskId: attachment.taskId,
        action: "attachment_deleted",
        details: JSON.stringify({ fileName: attachment.fileName }),
      });
      
      return { success: true };
    }),
});

/**
 * Notification Router
 */
const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const notifications = await db.getUserNotifications(ctx.user!.id);
      // Ensure we always return an array
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      console.error('[notificationRouter.list] Error:', error);
      // Return empty array instead of throwing to prevent frontend crashes
      return [];
    }
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await db.markNotificationAsRead(input.id);
      } catch (error) {
        console.error('[notificationRouter.markAsRead] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read',
        });
      }
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        return await db.markAllNotificationsAsRead(ctx.user!.id);
      } catch (error) {
        console.error('[notificationRouter.markAllAsRead] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read',
        });
      }
    }),

  /**
   * Create System Alert Notification
   * ใช้สำหรับส่ง notification จาก health check หรือ system monitoring
   */
  createSystemAlert: protectedProcedure
    .input(z.object({
      severity: z.enum(['info', 'warning', 'critical']),
      title: z.string(),
      content: z.string(),
      targetUserId: z.number().optional(), // ถ้าไม่ระบุจะส่งให้ owner/admin
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Map severity to notification type and priority
        const typeMap = {
          info: 'system_health_info' as const,
          warning: 'system_health_warning' as const,
          critical: 'system_health_critical' as const,
        };
        
        const priorityMap = {
          info: 'normal' as const,
          warning: 'high' as const,
          critical: 'urgent' as const,
        };

        // ถ้าไม่ระบุ targetUserId ให้ส่งให้ owner (user ID 1)
        const targetUserId = input.targetUserId || 1;

        // Create notification
        const notification = await db.createNotification({
          userId: targetUserId,
          type: typeMap[input.severity],
          priority: priorityMap[input.severity],
          title: input.title,
          content: input.content,
        });

        // Emit real-time notification via socket.io
        if (notification?.id) {
          emitNotification(targetUserId, {
            id: String(notification.id),
            type: 'task_status',
            title: notification.title,
            message: notification.content || '',
            timestamp: notification.createdAt,
            read: notification.isRead,
          });
        }

        return { success: true, notificationId: notification?.id };
      } catch (error) {
        console.error('[notificationRouter.createSystemAlert] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create system alert',
        });
      }
    }),
});

/**
 * Activity Router
 */
const activityRouter = router({
  taskActivity: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskActivityLog(input.taskId);
    }),
  getByTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskActivityLog(input.taskId);
    }),
  // Note: activityLog doesn't have defectId column
  // getByDefect: protectedProcedure
  //   .input(z.object({ defectId: z.number() }))
  //   .query(async ({ input }) => {
  //     return await db.getDefectActivityLog(input.defectId);
  //   }),
});

/**
 * Main App Router
 */
/**
 * Dashboard Router - Statistics and Overview
 */
const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get all projects (admin can see all projects)
    const allProjects = await db.getAllProjects();
    const projectsWithStats = await Promise.all(
      allProjects.map(async (project: any) => {
        const stats = await db.getProjectStats(project.id);
        return { ...project, stats };
      })
    );

    // Count projects by new 4-status logic:
    // 1. total = all projects
    // 2. on_track = no delayed tasks, not past endDate
    // 3. delayed = has delayed tasks, not past endDate
    // 4. overdue = past endDate and not completed
    const onTrackProjects = projectsWithStats.filter(p => p.stats?.projectStatus === 'on_track');
    const delayedProjects = projectsWithStats.filter(p => p.stats?.projectStatus === 'delayed');
    const overdueProjects = projectsWithStats.filter(p => p.stats?.projectStatus === 'overdue');
    
    const projectStats = {
      total: projectsWithStats.length,
      on_track: onTrackProjects.length,
      delayed: delayedProjects.length,
      overdue: overdueProjects.length,
      completed: projectsWithStats.filter(p => p.status === 'completed').length,
      // Keep old fields for backward compatibility
      active: projectsWithStats.filter(p => p.status === 'active').length,
      on_hold: projectsWithStats.filter(p => p.status === 'on_hold').length,
      at_risk: 0, // Deprecated
      onTrack: onTrackProjects.length, // Alias for on_track
    };

    // @ts-ignore
    // Calculate average progress across all projects
    const totalProgress = projectsWithStats.reduce((sum: any, p) => sum + p.stats.progressPercentage, 0);
    const averageProgress = projectsWithStats.length > 0 ? Math.round(totalProgress / projectsWithStats.length) : 0;

    // Get tasks from user's projects only (consistent with Tasks page)
    const userProjects = await db.getProjectsByUser(ctx.user!.id);
    const projectIds = userProjects.map((p: any) => p.projects.id);
    
    const allTasks: any[] = [];
    for (const projectId of projectIds) {
      const projectTasks = await db.getTasksByProject(projectId);
      allTasks.push(...projectTasks);
    }
    
    const tasksWithStatus = allTasks.map(task => ({
      ...task,
      displayStatus: getTaskDisplayStatus(task),
    }));

    // Count tasks by display status
    const taskStats = {
      not_started: tasksWithStatus.filter(t => t.displayStatus === 'not_started').length,
      in_progress: tasksWithStatus.filter(t => t.displayStatus === 'in_progress').length,
      delayed: tasksWithStatus.filter(t => t.displayStatus === 'delayed').length,
      completed: tasksWithStatus.filter(t => t.displayStatus === 'completed').length,
      total: tasksWithStatus.length,
    };

    // Get all checklists
    const allChecklists = await db.getAllTaskChecklists();
    
    // Count checklists by status
    const checklistStats = {
      not_started: allChecklists.filter((c: any) => c.status === 'not_started').length,
      pending_inspection: allChecklists.filter((c: any) => c.status === 'pending_inspection').length,
      in_progress: allChecklists.filter((c: any) => c.status === 'in_progress').length,
      completed: allChecklists.filter((c: any) => c.status === 'completed').length,
      failed: allChecklists.filter((c: any) => c.status === 'failed').length,
      total: allChecklists.length,
    };

    // Get project count (use already fetched data)
    const projectCount = projectsWithStats.length;

    // Get user's assigned tasks
    const myTasks = tasksWithStatus.filter(t => t.assigneeId === ctx.user!.id);
    const myTasksCount = myTasks.length;

    // Get defect statistics
    const defectStats = await db.getDefectMetrics();

    // Calculate trends (compare with last week)
    // For now, we'll use simple mock data - in production, store historical data
    const trends = {
      active: Math.floor(Math.random() * 21) - 10, // -10 to +10
      onTrack: Math.floor(Math.random() * 21) - 10,
      at_risk: Math.floor(Math.random() * 21) - 10,
      delayed: Math.floor(Math.random() * 21) - 10,
    };

    return {
      projectStats,
      averageProgress,
      taskStats,
      checklistStats,
      defectStats,
      projectCount,
      myTasksCount,
      trends,
    };
  }),
});

/**
 * Category Color Router - Manage category colors
 */
const categoryColorRouter = router({  
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getCategoryColorsByProject(input.projectId);
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum(["preparation", "structure", "architecture", "mep", "other"]),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.updateCategoryColor(input.projectId, input.category, input.color);
      
      await db.logActivity({
        userId: ctx.user!.id,
        projectId: input.projectId,
        action: "category_color_updated",
        details: JSON.stringify({ category: input.category, color: input.color }),
      });

      return { success: true };
    }),
});

export const appRouter = router({
  // Export Router
  export: exportRouter,

  // Team Management Router
  team: teamRouter,

  // Archive notifications check endpoint
  checkArchiveNotifications: protectedProcedure.mutation(async () => {
    const result = await checkArchiveWarnings();
    return result;
  }),

  // Advanced Analytics Router
  analytics: router({ 
    // Predictive Analytics
    predictive: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPredictiveAnalytics(input.projectId);
      }),

    // Cost Analysis
    costAnalysis: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCostAnalysis(input.projectId);
      }),

    // Resource Utilization
    resourceUtilization: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getResourceUtilization(input.projectId);
      }),

    // Quality Trend Analysis
    qualityTrend: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        days: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        return await db.getQualityTrendAnalysis(input.projectId, input.days);
      }),

    // Risk Assessment
    riskAssessment: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiskAssessment(input.projectId);
      }),

    // Performance KPIs
    performanceKPIs: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPerformanceKPIs(input.projectId);
      }),

    // Comparative Analysis
    comparative: protectedProcedure
      .input(z.object({ projectIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return await db.getComparativeAnalysis(input.projectIds);
      }),
  }),

  archiveRules: router({
    list: protectedProcedure.query(async () => {
      return await db.getArchiveRules();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        projectStatus: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
        daysAfterCompletion: z.number().optional(),
        daysAfterEndDate: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createArchiveRule({ ...input, createdBy: ctx.user!.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        enabled: z.boolean().optional(),
        projectStatus: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
        daysAfterCompletion: z.number().optional(),
        daysAfterEndDate: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateArchiveRule(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteArchiveRule(input.id);
      }),
  }),

  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const { COOKIE_NAME } = require("@shared/const");
      const { getSessionCookieOptions } = require("./_core/cookies");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  user: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    updateRole: roleBasedProcedure('users', 'edit')
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["owner", "admin", "project_manager", "qc_inspector", "worker"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "user_role_updated",
          details: JSON.stringify({ targetUserId: input.userId, newRole: input.role }),
        });

        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserProfile(ctx.user!.id, input);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "profile_updated",
          details: JSON.stringify({ name: input.name, email: input.email }),
        });

        return { success: true };
      }),

    getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user!.id);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return {
        notificationDaysAdvance: user.notificationDaysAdvance,
        enableInAppNotifications: user.enableInAppNotifications,
        enableEmailNotifications: user.enableEmailNotifications,
        enableDailySummaryEmail: user.enableDailySummaryEmail,
        dailySummaryTime: user.dailySummaryTime,
      };
    }),

    updateNotificationSettings: protectedProcedure
      .input(
        z.object({
          notificationDaysAdvance: z.number().min(1).max(30).optional(),
          enableInAppNotifications: z.boolean().optional(),
          enableEmailNotifications: z.boolean().optional(),
          enableDailySummaryEmail: z.boolean().optional(),
          dailySummaryTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:mm format
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserNotificationSettings(ctx.user!.id, input);

        await db.logActivity({
          userId: ctx.user!.id,
          action: "notification_settings_updated",
          details: JSON.stringify(input),
        });

        return { success: true };
      }),
  }),

  signature: router({
    create: protectedProcedure
      .input(
        z.object({
          checklistId: z.number(),
          signatureData: z.string(),
          signedBy: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const signature = await db.createSignature({
          checklistId: input.checklistId,
          signatureData: input.signatureData,
          signedBy: input.signedBy,
        });
        return signature;
      }),

    getByChecklist: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSignaturesByChecklistId(input.checklistId);
      }),
  }),

  dashboard: dashboardRouter,
  project: projectRouter,
  task: taskRouter,
  checklist: checklistRouter,
  defect: defectRouter,
  comment: commentRouter,
  attachment: attachmentRouter,
  notification: notificationRouter,
  activity: activityRouter,
  categoryColor: categoryColorRouter,
  monitoring: monitoringRouter,
  optimization: optimizationRouter,
  cache: cacheRouter,
  database: databaseRouter,
  performance: performanceRouter,
  
  // System Monitor for Admin
  systemMonitor: router({
    getMetrics: roleBasedProcedure('system', 'view').query(async () => {
      const { getSystemMetrics } = await import('./monitoring/startMonitoring');
      return await getSystemMetrics();
    }),
    
    getDatabaseStats: roleBasedProcedure('system', 'view').query(async () => {
      const { getDatabaseStats } = await import('./monitoring/startMonitoring');
      return await getDatabaseStats();
    }),
    
    applyIndexes: roleBasedProcedure('system', 'edit').mutation(async () => {
      const { applyRecommendedIndexes } = await import('./monitoring/startMonitoring');
      return await applyRecommendedIndexes();
    }),
  }),

  // Health Check Endpoint (using existing healthRouter)
  health: healthRouter,

  // Push Notifications Router
  pushNotifications: router({
    // Subscribe to push notifications
    subscribe: protectedProcedure
      .input(
        z.object({
          endpoint: z.string(),
          p256dh: z.string(),
          auth: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createPushSubscription({
          userId: ctx.user!.id,
          ...input,
        });
      }),

    // Unsubscribe from push notifications
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        return await db.deletePushSubscriptionByEndpoint(input.endpoint);
      }),

    // Get user's subscriptions
    getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPushSubscriptionsByUserId(ctx.user!.id);
    }),

    // Get VAPID public key
    getVapidPublicKey: publicProcedure.query(() => {
      const { getVapidPublicKey } = require("./_core/pushNotification");
      return { publicKey: getVapidPublicKey() };
    }),
  }),

  // Memory Monitoring Router
  memoryMonitoring: router({
    // บันทึก memory log
    createLog: protectedProcedure
      .input(
        z.object({
          totalMemoryMB: z.number(),
          usedMemoryMB: z.number(),
          freeMemoryMB: z.number(),
          usagePercentage: z.number(),
          buffersCacheMB: z.number().optional(),
          availableMemoryMB: z.number().optional(),
          swapTotalMB: z.number().optional(),
          swapUsedMB: z.number().optional(),
          swapFreePercentage: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createMemoryLog(input);
      }),

    // ดึงข้อมูล memory logs
    getLogs: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMemoryLogs(input);
      }),

    // ดึง memory statistics
    getStatistics: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMemoryStatistics(input);
      }),

    // บันทึก OOM event
    createOomEvent: protectedProcedure
      .input(
        z.object({
          processName: z.string().optional(),
          processId: z.number().optional(),
          killedProcessName: z.string().optional(),
          killedProcessId: z.number().optional(),
          memoryUsedMB: z.number().optional(),
          severity: z.enum(["low", "medium", "high", "critical"]).optional(),
          logMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOomEvent(input);
      }),

    // ดึงข้อมูล OOM events
    getOomEvents: protectedProcedure
      .input(
        z.object({
          resolved: z.boolean().optional(),
          severity: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getOomEvents(input);
      }),

    // แก้ไข OOM event
    resolveOomEvent: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          resolutionNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.resolveOomEvent(input.eventId, ctx.user!.id, input.resolutionNotes);
      }),

    // ดึง OOM event statistics
    getOomStatistics: protectedProcedure.query(async () => {
      return await db.getOomEventStatistics();
    }),
  }),

  // Alert Thresholds Router
  alertThresholds: router({
    // ดึงรายการ alert thresholds ของผู้ใช้
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAlertThresholds(ctx.user!.id);
    }),

    // สร้าง alert threshold ใหม่
    create: protectedProcedure
      .input(
        z.object({
          metricType: z.enum(["cpu", "memory"]),
          threshold: z.number().min(0).max(100),
          isEnabled: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createAlertThreshold({
          userId: ctx.user!.id,
          ...input,
        });
      }),

    // อัปเดต alert threshold
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          threshold: z.number().min(0).max(100).optional(),
          isEnabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAlertThreshold(id, data);
        return { success: true };
      }),

    // ลบ alert threshold
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAlertThreshold(input.id);
        return { success: true };
      }),

    // ตรวจสอบว่าค่าปัจจุบันเกิน threshold หรือไม่
    check: protectedProcedure
      .input(
        z.object({
          cpu: z.number(),
          memory: z.number(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await db.checkAlertThresholds(ctx.user!.id, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
