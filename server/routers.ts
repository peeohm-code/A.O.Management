import { z } from "zod";
import { canEditDefect, canDeleteDefect } from "@shared/permissions";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
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

/**
 * Project Router - Project Management
 */
const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getAllProjects();
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
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
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        budget: z.number().optional(),
        ownerName: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.createProject({
        ...input,
        createdBy: ctx.user.id,
      });

      const projectId = (result as any).insertId as number;
      
      await db.logActivity({
        userId: ctx.user.id,
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
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        ownerName: z.string().optional(),
        color: z.string().optional(),
        status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const project = await db.getProjectById(id);
      const result = await db.updateProject(id, updateData);

      await db.logActivity({
        userId: ctx.user.id,
        projectId: id,
        action: "project_updated",
        details: JSON.stringify(updateData),
      });

      // Send notification if status changed
      if (updateData.status && project) {
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
        members.forEach((member) => {
          emitNotification(member.userId, notification);
        });
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
      await db.archiveProject(input.id, ctx.user.id, input.reason);

      await db.logActivity({
        userId: ctx.user.id,
        projectId: input.id,
        action: "project_archived",
        details: input.reason || "Project archived",
      });

      return { success: true };
    }),

  unarchive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.unarchiveProject(input.id, ctx.user.id);

      await db.logActivity({
        userId: ctx.user.id,
        projectId: input.id,
        action: "project_unarchived",
        details: "Project unarchived",
      });

      return { success: true };
    }),

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    const archivedProjects = await db.getArchivedProjects(ctx.user.id);
    const projectsWithStats = await Promise.all(
      archivedProjects.map(async (project) => {
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
    const archivedProjects = await db.getArchivedProjects(ctx.user.id);
    
    const exportData = archivedProjects.map((project) => {
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
        projectStatus: project.projectStatus,
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
        role: z.enum(["project_manager", "qc_inspector", "field_engineer"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.addProjectMember(input);
    }),

  delete: roleBasedProcedure('projects', 'delete')
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteProject(input.id);

      await db.logActivity({
        userId: ctx.user.id,
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
            userId: ctx.user.id,
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
          projectStatus: project.projectStatus,
          archivedAt: project.archivedAt,
          archivedReason: project.archivedReason,
        },
        exportedAt: new Date().toISOString(),
      };

      // Create simple report
      const report = `# รายงานโครงการ: ${project.name}\n\n` +
        `**รหัส:** ${project.code || 'N/A'}\n` +
        `**สถานที่:** ${project.location || 'N/A'}\n` +
        `**สถานะ:** ${project.projectStatus}\n` +
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
    const projects = await db.getProjectsByUser(ctx.user.id);
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
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
        tasks = await db.getTasksByAssignee(ctx.user.id);
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
    const userProjects = await db.getProjectsByUser(ctx.user.id);
    const projectIds = userProjects.map(p => p.projects.id);
    
    // Get all tasks from those projects
    const allTasks = [];
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
    .input(
      z.object({
        projectId: z.number(),
        parentTaskId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        status: z.enum([
          "todo",
          "pending_pre_inspection",
          "ready_to_start",
          "in_progress",
          "pending_final_inspection",
          "rectification_needed",
          "completed",
          "not_started",
          "delayed"
        ]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        assigneeId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log('[DEBUG] Task create mutation called with input:', JSON.stringify(input, null, 2));
      try {
        const result = await db.createTask({
          ...input,
        });

      const taskId = (result as any).insertId as number;

      await db.logActivity({
        userId: ctx.user.id,
        projectId: input.projectId,
        taskId,
        action: "task_created",
        details: JSON.stringify({ name: input.name }),
      });

      // Create notification for assignee
      if (input.assigneeId) {
        await db.createNotification({
          userId: input.assigneeId,
          type: "task_assigned",
          title: "New Task Assigned",
          content: input.name,
          relatedTaskId: taskId,
          relatedProjectId: input.projectId,
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

      const result = await db.updateTask(id, updateData);

      await db.logActivity({
        userId: ctx.user.id,
        taskId: id,
        projectId: task.projectId,
        action: "task_updated",
        details: JSON.stringify(updateData),
      });

      // Send real-time notifications
      if (updateData.status) {
        const displayStatus = getTaskDisplayStatusLabel(updateData.status);
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
        followers.forEach((follower) => {
          if (follower.userId !== ctx.user.id) {
            emitNotification(follower.userId, notification);
          }
        });
      }
      
      // Send notification if task is assigned to someone
      if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
        const notification = {
          id: `task-assigned-${id}-${Date.now()}`,
          type: "task_assigned" as const,
          title: "มีงานใหม่มอบหมาย",
          message: `คุณได้รับมอบหมายงาน "${task.name}"`,
          link: `/tasks/${id}`,
          timestamp: new Date(),
          read: false,
        };
        emitNotification(updateData.assigneeId, notification);
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
      
      return calculateCriticalPath(tasksWithDeps);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const task = await db.getTaskById(input.id);
      if (!task) throw new Error("Task not found");

      await db.deleteTask(input.id);

      await db.logActivity({
        userId: ctx.user.id,
        projectId: task.projectId,
        taskId: input.id,
        action: "task_deleted",
        details: JSON.stringify({ name: task.name }),
      });

      return { success: true };
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
          createdBy: ctx.user.id,
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
        userId: ctx.user.id,
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
          userId: ctx.user.id,
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
      const result = [];
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
        userId: ctx.user.id,
        taskId: input.taskId,
        action: "checklist_assigned",
        details: JSON.stringify({ templateName: template.name }),
      });

      return { success: true, id: (result as any).insertId };
    }),

  removeFromTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const checklist = await db.getTaskChecklistById(input.id);
      if (!checklist) throw new Error("Checklist not found");

      await db.deleteTaskChecklist(input.id);

      await db.logActivity({
        userId: ctx.user.id,
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
        itemResults: z.array(z.object({
          templateItemId: z.number(),
          result: z.enum(["pass", "fail", "na"]),
        })).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const checklist = await db.getTaskChecklistById(input.id);
      if (!checklist) throw new Error("Checklist not found");

      // Update checklist status, comments, and photos
      await db.updateTaskChecklist(input.id, {
        status: input.status,
        generalComments: input.generalComments,
        photoUrls: input.photoUrls,
        inspectedBy: ctx.user.id,
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
        userId: ctx.user.id,
        taskId: checklist.taskId,
        action: "checklist_status_updated",
        details: JSON.stringify({ checklistId: input.id, status: input.status }),
      });

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
          userId: ctx.user.id,
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
          })
        ),
        generalComments: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Use the new submitInspection function from db.ts
      const result = await db.submitInspection({
        taskChecklistId: input.taskChecklistId,
        taskId: input.taskId,
        inspectedBy: ctx.user.id,
        itemResults: input.items,
        generalComments: input.generalComments,
        photoUrls: input.photoUrls,
      });

      return result;
    }),

  // Get all task checklists with template and task info
  getAllTaskChecklists: protectedProcedure.query(async () => {
    const checklists = await db.getAllTaskChecklists();
    const tasks = await db.getAllTasks();
    const templates = await db.getAllChecklistTemplates();
    
    // Get all template items for all templates
    const allTemplateItems = await Promise.all(
      templates.map(async (template) => ({
        templateId: template.id,
        items: await db.getChecklistTemplateItems(template.id),
      }))
    );
    
    // Map checklists with task and template info
    return checklists.map(checklist => {
      const task = tasks.find(t => t.id === checklist.taskId);
      const template = templates.find(t => t.id === checklist.templateId);
      const templateItems = allTemplateItems.find(t => t.templateId === checklist.templateId)?.items || [];
      
      return {
        ...checklist,
        name: template?.name || "Unknown Template",
        taskName: task?.name || "Unknown Task",
        items: templateItems.map(item => ({
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
      const result = await db.createDefect({
        ...input,
        reportedBy: ctx.user.id,
      });

      // Send real-time notification to assignee
      if (input.assignedTo) {
        const notification = {
          id: `defect-reported-${Date.now()}`,
          type: "defect_reported" as const,
          title: `มี ${input.type} ใหม่มอบหมาย`,
          message: `คุณได้รับมอบหมาย ${input.type}: "${input.title}"`,
          link: `/defects`,
          timestamp: new Date(),
          read: false,
        };
        emitNotification(input.assignedTo, notification);
      }

      return result;
    }),

  // Update defect (workflow transitions)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["reported", "analysis", "in_progress", "resolved", "closed"]).optional(),
        assignedTo: z.number().optional(),
        resolutionComment: z.string().optional(),
        resolutionPhotoUrls: z.string().optional(),
        // CAR/PAR/NCR workflow fields
        rootCause: z.string().optional(),
        correctiveAction: z.string().optional(),
        preventiveAction: z.string().optional(),
        dueDate: z.date().optional(),
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
        console.log("[defect.update] Received input:", JSON.stringify(input, null, 2));
        const { id, ...updateData } = input;
        const defect = await db.getDefectById(id);
        if (!defect) throw new Error("Defect not found");
        console.log("[defect.update] Found defect:", defect.id, defect.title);
        
        // Check edit permission
        if (!canEditDefect(ctx.user.role, ctx.user.id, defect)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'คุณไม่มีสิทธิ์แก้ไข defect นี้',
          });
        }

        const dataToUpdate = {
        ...updateData,
        resolvedBy: updateData.status === "resolved" ? ctx.user.id : undefined,
        resolvedAt: updateData.status === "resolved" ? new Date() : undefined,
        verifiedBy: updateData.status === "closed" ? ctx.user.id : undefined,
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
      
      console.log("[defect.update] Calling updateDefect with:", JSON.stringify(dataToUpdate, null, 2));
      const result = await db.updateDefect(id, dataToUpdate);
      console.log("[defect.update] Update successful");

      // Notify assignee if assigned
      if (updateData.assignedTo) {
        await db.createNotification({
          userId: updateData.assignedTo,
          type: "defect_assigned",
          title: `${defect.type} Assigned`,
          content: defect.title,
          relatedTaskId: defect.taskId,
        });
      }

      // Notify owner/admin when defect is resolved
      if (updateData.status === "resolved") {
        await notifyOwner({
          title: `${defect.type} แก้ไขเสร็จแล้ว`,
          content: `${defect.title} - รอตรวจสอบผลการแก้ไข`,
        });
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
        uploadedBy: ctx.user.id,
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
      if (!canDeleteDefect(ctx.user.role)) {
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
        userId: ctx.user.id,
        content: input.content,
        mentions: input.mentions ? JSON.stringify(input.mentions) : undefined,
      });

      // Notify mentioned users
      if (input.mentions && input.mentions.length > 0) {
        for (const userId of input.mentions) {
          await db.createNotification({
            userId,
            type: "comment_mention",
            title: "You were mentioned in a comment",
            relatedTaskId: input.taskId,
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
        uploadedBy: ctx.user.id,
      });
      
      // Log activity
      const task = await db.getTaskById(input.taskId);
      if (task) {
        await db.logActivity({
          userId: ctx.user.id,
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
        uploadedBy: ctx.user.id,
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
        attachment.uploadedBy === ctx.user.id ||
        ctx.user.role === "admin" ||
        ctx.user.role === "pm";
      
      if (!canDelete) {
        throw new Error("Permission denied");
      }
      
      // Delete from database
      await db.deleteTaskAttachment(input.id);
      
      // Log activity
      await db.logActivity({
        userId: ctx.user.id,
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
      const notifications = await db.getUserNotifications(ctx.user.id);
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
        return await db.markAllNotificationsAsRead(ctx.user.id);
      } catch (error) {
        console.error('[notificationRouter.markAllAsRead] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read',
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
  getByDefect: protectedProcedure
    .input(z.object({ defectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectActivityLog(input.defectId);
    }),
});

/**
 * Main App Router
 */
/**
 * Dashboard Router - Statistics and Overview
 */
const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get user's projects with stats
    const userProjectsData = await db.getProjectsByUser(ctx.user.id);
    const allProjects = userProjectsData.map(p => p.projects);
    const projectsWithStats = await Promise.all(
      allProjects.map(async (project) => {
        const stats = await db.getProjectStats(project.id);
        return { ...project, stats };
      })
    );

    // Count projects by new 4-status logic:
    // 1. total = all projects
    // 2. on_track = no delayed tasks, not past endDate
    // 3. delayed = has delayed tasks, not past endDate
    // 4. overdue = past endDate and not completed
    const onTrackProjects = projectsWithStats.filter(p => p.stats.projectStatus === 'on_track');
    const delayedProjects = projectsWithStats.filter(p => p.stats.projectStatus === 'delayed');
    const overdueProjects = projectsWithStats.filter(p => p.stats.projectStatus === 'overdue');
    
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

    // Calculate average progress across all projects
    const totalProgress = projectsWithStats.reduce((sum, p) => sum + p.stats.progressPercentage, 0);
    const averageProgress = projectsWithStats.length > 0 ? Math.round(totalProgress / projectsWithStats.length) : 0;

    // Get all tasks with computed display status
    const allTasks = await db.getAllTasks();
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
      not_started: allChecklists.filter(c => c.status === 'not_started').length,
      pending_inspection: allChecklists.filter(c => c.status === 'pending_inspection').length,
      in_progress: allChecklists.filter(c => c.status === 'in_progress').length,
      completed: allChecklists.filter(c => c.status === 'completed').length,
      failed: allChecklists.filter(c => c.status === 'failed').length,
      total: allChecklists.length,
    };

    // Get project count (use already fetched data)
    const projectCount = projectsWithStats.length;

    // Get user's assigned tasks
    const myTasks = tasksWithStatus.filter(t => t.assigneeId === ctx.user.id);
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
        userId: ctx.user.id,
        projectId: input.projectId,
        action: "category_color_updated",
        details: JSON.stringify({ category: input.category, color: input.color }),
      });

      return { success: true };
    }),
});

export const appRouter = router({
  // Archive notifications check endpoint
  checkArchiveNotifications: protectedProcedure.mutation(async () => {
    const result = await checkArchiveWarnings();
    return result;
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
        return await db.createArchiveRule({ ...input, createdBy: ctx.user.id });
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
          role: z.enum(["owner", "admin", "project_manager", "qc_inspector", "field_engineer", "user"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);

        await db.logActivity({
          userId: ctx.user.id,
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
        await db.updateUserProfile(ctx.user.id, input);

        await db.logActivity({
          userId: ctx.user.id,
          action: "profile_updated",
          details: JSON.stringify({ name: input.name, email: input.email }),
        });

        return { success: true };
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
});

export type AppRouter = typeof appRouter;
