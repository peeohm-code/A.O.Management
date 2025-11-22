import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { canEditTask, canDeleteTask, logAuthorizationFailure } from "../rbac";
import { requireEditTaskMiddleware, requireDeleteTaskMiddleware, requireCreateTaskMiddleware } from "../middleware/permissionMiddleware";
import { logTaskAudit, getClientIp, getUserAgent } from "../auditTrail";
import { validateTaskCreateInput, validateTaskUpdateInput, validateInspectionSubmission, validateDefectCreateInput, validateDefectUpdateInput } from "@shared/validationUtils";
import { getTaskDisplayStatus, getTaskDisplayStatusLabel, getTaskDisplayStatusColor } from "../taskStatusHelper";
import { emitNotification } from "../_core/socket";
import { createNotification } from "../notificationService";
import { logger } from "../logger";
import { projectSchema, taskSchema, defectSchema, inspectionSchema } from "@shared/validations";
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  deleteTaskSchema,
  getTasksByProjectSchema,
  paginationSchema
} from "@shared/validation";

/**
 * Task Router
 * Auto-generated from server/routers.ts
 */
export const taskRouter = router({
  list: protectedProcedure
    .input(paginationSchema.extend({
      projectId: z.number().int().positive().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { projectId, page = 1, pageSize = 25 } = input;
      const offset = (page - 1) * pageSize;

      let tasks;
      if (projectId) {
        tasks = await db.getTasksByProject(projectId);
      } else {
        // Return all tasks for user if no projectId specified
        tasks = await db.getTasksByAssignee(ctx.user!.id);
      }

      const totalItems = tasks.length;

      // Apply pagination
      const paginatedTasks = tasks.slice(offset, offset + pageSize);

      // Add computed display status to each task
      const tasksWithStatus = paginatedTasks.map((task: any) => {
        const displayStatus = getTaskDisplayStatus(task);
        return {
          ...task,
          displayStatus,
          displayStatusLabel: getTaskDisplayStatusLabel(displayStatus),
          displayStatusColor: getTaskDisplayStatusColor(displayStatus),
        };
      });

      const totalPages = Math.ceil(totalItems / pageSize);
      return {
        items: tasksWithStatus,
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
    .input(getTaskSchema)
    .query(async ({ input }) => {
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
    const myProjectIds = userProjects.map((p: any) => p.projects.id);

    // Get all tasks from those projects
    const allTasks: any[] = [];
    for (const projectId of myProjectIds) {
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

  create: roleBasedProcedure("tasks", "create")
    .input(createTaskSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate input using type guards
        const validation = validateTaskCreateInput({
          ...input,
          projectId: input.projectId,
        });

        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.errors?.join(", ") || "Invalid input",
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
        logger.error("[ERROR] Task create failed", undefined, error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(updateTaskSchema)
    .use(requireEditTaskMiddleware)
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
      
      // Log audit trail
      await logTaskAudit(
        ctx.user!.id,
        'update',
        id,
        task.projectId,
        task,
        dbUpdateData,
        getClientIp(ctx.req),
        getUserAgent(ctx.req)
      );

      await db.logActivity({
        userId: ctx.user!.id,
        taskId: id,
        projectId: task.projectId,
        action: "task_updated",
        details: JSON.stringify(updateData),
      });

      // Send real-time notifications
      if (updateData.status) {
        const displayStatus = getTaskDisplayStatusLabel(
          updateData.status as any
        );
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
      if (
        updateData.progress !== undefined &&
        task.progress !== updateData.progress
      ) {
        const milestones = [25, 50, 75, 100];
        const oldProgress = task.progress || 0;
        const newProgress = updateData.progress;

        // Check if we crossed a milestone
        const crossedMilestone = milestones.find(
          milestone => oldProgress < milestone && newProgress >= milestone
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
        type: z
          .enum(["finish_to_start", "start_to_start", "finish_to_finish"])
          .optional(),
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
      const { calculateCriticalPath } = await import("../criticalPath");
      const tasks = await db.getTasksByProject(input.projectId);
      const dependencies = await db.getAllTaskDependenciesForProject(
        input.projectId
      );

      // Transform tasks to include dependencies
      const tasksWithDeps = tasks.map((task: any) => ({
        id: task.id,
        startDate: task.startDate,
        endDate: task.endDate,
        dependencies: dependencies.filter((d: any) => d.taskId === task.id),
      }));

      return calculateCriticalPath(tasksWithDeps as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .use(requireDeleteTaskMiddleware)
    .mutation(async ({ input, ctx }) => {
      const task = await db.getTaskById(input.id);
      if (!task) throw new Error("Task not found");

      // Log audit trail before deletion
      await logTaskAudit(
        ctx.user!.id,
        'delete',
        input.id,
        task.projectId,
        task,
        null,
        getClientIp(ctx.req),
        getUserAgent(ctx.req)
      );
      
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

  bulkUpdateStatus: roleBasedProcedure("tasks", "edit")
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
          logger.error(`Failed to update task ${taskId}`, undefined, error);
        }
      }

      return { success: true, updated: successCount, total: taskIds.length };
    }),

  bulkAssign: roleBasedProcedure("tasks", "edit")
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
          logger.error(`Failed to assign task ${taskId}`, undefined, error);
        }
      }

      return { success: true, assigned: successCount, total: taskIds.length };
    }),

  bulkDelete: roleBasedProcedure("tasks", "delete")
    .input(
      z.object({
        taskIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.bulkDeleteTasks(input.taskIds, ctx.user!.id);
      return result;
    }),

  updatePriority: roleBasedProcedure("tasks", "edit")
    .input(
      z.object({
        id: z.number(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.updateTaskPriority(
        input.id,
        input.priority,
        ctx.user!.id
      );
    }),

  updateCategory: roleBasedProcedure("tasks", "edit")
    .input(
      z.object({
        id: z.number(),
        category: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.updateTaskCategory(
        input.id,
        input.category,
        ctx.user!.id
      );
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
      if (input.query && input.query.trim() !== "") {
        const queryLower = input.query.toLowerCase();
        filteredTasks = filteredTasks.filter(
          (task: any) =>
            task.name.toLowerCase().includes(queryLower) ||
            (task.description &&
              task.description.toLowerCase().includes(queryLower))
        );
      }

      // Filter by status
      if (input.status && input.status !== "all") {
        filteredTasks = filteredTasks.filter(
          (task: any) => task.status === input.status
        );
      }

      // Filter by assignee
      if (input.assigneeId) {
        filteredTasks = filteredTasks.filter(
          (task: any) => task.assigneeId === input.assigneeId
        );
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
