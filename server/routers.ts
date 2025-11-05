import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

/**
 * Project Router - Project Management
 */
const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getProjectsByUser(ctx.user.id);
    return projects.map((p) => p.projects);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await db.getProjectById(input.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        location: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const result = await db.updateProject(id, updateData);

      await db.logActivity({
        userId: ctx.user.id,
        projectId: id,
        action: "project_updated",
        details: JSON.stringify(updateData),
      });

      return result;
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(["owner", "pm", "engineer", "qc", "viewer"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.addProjectMember(input);
    }),
});

/**
 * Task Router - Task Management
 */
const taskRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.projectId) {
        return await db.getTasksByProject(input.projectId);
      }
      // Return all tasks for user if no projectId specified
      return await db.getTasksByAssignee(ctx.user.id);
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await db.getTaskById(input.id);
  }),

  myTasks: protectedProcedure.query(async ({ ctx }) => {
    return await db.getTasksByAssignee(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        parentTaskId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        assigneeId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db.createTask({
        ...input,
        createdBy: ctx.user.id,
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
    }),

  update: protectedProcedure
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

      // Notify followers
      const followers = await db.getTaskFollowers(id);
      for (const follower of followers) {
        if (follower.userId !== ctx.user.id) {
          await db.createNotification({
            userId: follower.userId,
            type: "task_updated",
            title: "Task Updated",
            content: task.name,
            relatedTaskId: id,
          });
        }
      }

      return result;
    }),

  addDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        dependsOnTaskId: z.number(),
        type: z.enum(["finish_to_start", "start_to_start", "finish_to_finish"]),
      })
    )
    .mutation(async ({ input }) => {
      return await db.addTaskDependency(input);
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
        items: z
          .array(
            z.object({
              itemText: z.string(),
              requirePhoto: z.boolean().optional(),
              acceptanceCriteria: z.string().optional(),
              order: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const templateResult = await db.createChecklistTemplate({
        name: input.name,
        category: input.category,
        stage: input.stage,
        description: input.description,
        createdBy: ctx.user.id,
      });

      const templateId = (templateResult as any).insertId as number;

      // Add items if provided
      if (input.items && input.items.length > 0) {
        for (const item of input.items) {
          await db.addChecklistTemplateItem({
            templateId,
            ...item,
          });
        }
      }

      return { success: true, id: templateId };
    }),

  listTemplates: protectedProcedure.query(async () => {
    return await db.getAllChecklistTemplates();
  }),

  getTaskChecklists: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskChecklistsByTask(input.taskId);
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
        items: z.array(
          z.object({
            templateItemId: z.number(),
            result: z.enum(["pass", "fail", "na"]),
            comment: z.string().optional(),
            photoUrls: z.string().optional(),
          })
        ),
        signature: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const taskChecklist = await db.getTaskChecklistById(input.taskChecklistId);
      if (!taskChecklist) throw new Error("Checklist not found");

      // Add item results
      let allPassed = true;
      for (const item of input.items) {
        await db.addChecklistItemResult({
          taskChecklistId: input.taskChecklistId,
          templateItemId: item.templateItemId,
          result: item.result,
          comment: item.comment,
          photoUrls: item.photoUrls,
        });

        if (item.result === "fail") {
          allPassed = false;
        }
      }

      // Update checklist status
      const checklistStatus = allPassed ? "passed" : "failed";
      await db.updateTaskChecklist(input.taskChecklistId, {
        status: checklistStatus,
        inspectedBy: ctx.user.id,
        inspectedAt: new Date(),
        signature: input.signature,
      });

      const task = await db.getTaskById(taskChecklist.taskId);
      if (!task) throw new Error("Task not found");

      // Update task status based on checklist result
      if (allPassed) {
        if (taskChecklist.stage === "pre_execution") {
          await db.updateTask(taskChecklist.taskId, {
            status: "ready_to_start",
          });
        } else if (taskChecklist.stage === "post_execution") {
          await db.updateTask(taskChecklist.taskId, {
            status: "completed",
          });
        }
      } else {
        // Create defects for failed items
        const failedItems = input.items.filter((i) => i.result === "fail");
        for (const item of failedItems) {
          const itemResult = await db.getChecklistItemResults(input.taskChecklistId);
          const result = itemResult.find((r) => r.templateItemId === item.templateItemId);

          if (result) {
            await db.createDefect({
              taskId: taskChecklist.taskId,
              checklistItemResultId: result.id,
              title: `Inspection Failed - Item ${item.templateItemId}`,
              description: item.comment,
              photoUrls: item.photoUrls,
              severity: "medium",
              reportedBy: ctx.user.id,
            });
          }
        }

        await db.updateTask(taskChecklist.taskId, {
          status: "rectification_needed",
        });
      }

      await db.logActivity({
        userId: ctx.user.id,
        taskId: taskChecklist.taskId,
        action: "inspection_completed",
        details: JSON.stringify({ stage: taskChecklist.stage, result: checklistStatus }),
      });

      return { success: true, status: checklistStatus };
    }),
});

/**
 * Defect Router - Defect Management
 */
const defectRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectsByTask(input.taskId);
    }),

  openDefects: protectedProcedure.query(async () => {
    return await db.getOpenDefects();
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await db.getDefectById(input.id);
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "verified"]).optional(),
        assignedTo: z.number().optional(),
        resolutionComment: z.string().optional(),
        resolutionPhotoUrls: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const defect = await db.getDefectById(id);
      if (!defect) throw new Error("Defect not found");

      const result = await db.updateDefect(id, {
        ...updateData,
        resolvedBy: updateData.status === "resolved" ? ctx.user.id : undefined,
        resolvedAt: updateData.status === "resolved" ? new Date() : undefined,
      });

      // Notify assignee if assigned
      if (updateData.assignedTo) {
        await db.createNotification({
          userId: updateData.assignedTo,
          type: "defect_assigned",
          title: "Defect Assigned",
          content: defect.title,
          relatedTaskId: defect.taskId,
        });
      }

      return result;
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
    return await db.getUserNotifications(ctx.user.id);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.markNotificationAsRead(input.id);
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
});

/**
 * Main App Router
 */
export const appRouter = router({
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

  project: projectRouter,
  task: taskRouter,
  checklist: checklistRouter,
  defect: defectRouter,
  comment: commentRouter,
  attachment: attachmentRouter,
  notification: notificationRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
