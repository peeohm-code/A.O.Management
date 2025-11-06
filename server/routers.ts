import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { getTaskDisplayStatus, getTaskDisplayStatusLabel, getTaskDisplayStatusColor } from "./taskStatusHelper";
import { notifyOwner } from "./_core/notification";

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

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Only Admin can delete projects
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can delete projects",
        });
      }

      await db.deleteProject(input.id);

      await db.logActivity({
        userId: ctx.user.id,
        projectId: input.id,
        action: "project_deleted",
        details: JSON.stringify({ projectId: input.id }),
      });

      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getProjectStats(input.id);
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
      const templateResult = await db.createChecklistTemplate({
        name: input.name,
        category: input.category,
        stage: input.stage,
        description: input.description,
        allowGeneralComments: input.allowGeneralComments,
        allowPhotos: input.allowPhotos,
        createdBy: ctx.user.id,
      });

      const templateId = (templateResult as any).insertId as number;

      // Add items if provided
      if (input.items && input.items.length > 0) {
        for (const item of input.items) {
          await db.addChecklistTemplateItem({
            templateId,
            itemText: item.itemText,
            order: item.order,
          });
        }
      }

      return { success: true, id: templateId };
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

  updateChecklistStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["not_started", "pending_inspection"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const checklist = await db.getTaskChecklistById(input.id);
      if (!checklist) throw new Error("Checklist not found");

      await db.updateTaskChecklistStatus(input.id, input.status);

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
    
    // Map checklists with task and template info
    return checklists.map(checklist => {
      const task = tasks.find(t => t.id === checklist.taskId);
      const template = templates.find(t => t.id === checklist.templateId);
      
      return {
        ...checklist,
        name: template?.name || "Unknown Template",
        taskName: task?.name || "Unknown Task",
        items: [], // Will be populated from checklistItemResults if needed
      };
    });
  }),
});

/**
 * Defect Router - Defect Management (CAR/PAR/NCR)
 */
const defectRouter = router({
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
      status: z.enum(["reported", "rca_pending", "action_plan", "assigned", "in_progress", "implemented", "verification", "effectiveness_check", "closed", "rejected"]) 
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
    return await db.getAllDefects();
  }),

  // Get single defect by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefectById(input.id);
    }),

  // Create new CAR/PAR/NCR
  create: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        checklistItemResultId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        photoUrls: z.string().optional(),
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

      // Notify assignee if assigned
      if (input.assignedTo) {
        await db.createNotification({
          userId: input.assignedTo,
          type: "defect_assigned",
          title: `${input.type} Assigned`,
          content: input.title,
          relatedTaskId: input.taskId,
        });
      }

      return result;
    }),

  // Update defect (workflow transitions)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["reported", "rca_pending", "action_plan", "assigned", "in_progress", "implemented", "verification", "effectiveness_check", "closed", "rejected"]).optional(),
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const defect = await db.getDefectById(id);
      if (!defect) throw new Error("Defect not found");

      const result = await db.updateDefect(id, {
        ...updateData,
        resolvedBy: updateData.status === "implemented" ? ctx.user.id : undefined,
        resolvedAt: updateData.status === "implemented" ? new Date() : undefined,
        verifiedBy: updateData.status === "closed" ? ctx.user.id : undefined,
        verifiedAt: updateData.status === "closed" ? new Date() : undefined,
      });

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

      // Notify owner/admin when verification is requested
      if (updateData.status === "verification") {
        await notifyOwner({
          title: `${defect.type} รอการตรวจสอบ`,
          content: `${defect.title} - ขอตรวจสอบผลการแก้ไข`,
        });
      }

      return result;
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

  // Dashboard Statistics
  getStatsByStatus: protectedProcedure
    .query(async () => {
      return await db.getDefectStatsByStatus();
    }),

  getStatsByType: protectedProcedure
    .query(async () => {
      return await db.getDefectStatsByType();
    }),

  getStatsByPriority: protectedProcedure
    .query(async () => {
      return await db.getDefectStatsByPriority();
    }),

  getMetrics: protectedProcedure
    .query(async () => {
      return await db.getDefectMetrics();
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

    // Count projects by status
    const projectStats = {
      active: projectsWithStats.filter(p => p.status === 'active').length,
      completed: projectsWithStats.filter(p => p.status === 'completed').length,
      on_hold: projectsWithStats.filter(p => p.status === 'on_hold').length,
      delayed: projectsWithStats.filter(p => p.stats.projectStatus === 'delayed').length,
      at_risk: projectsWithStats.filter(p => p.stats.projectStatus === 'at_risk').length,
      total: projectsWithStats.length,
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

    // Get project count
    const projects = await db.getProjectsByUser(ctx.user.id);
    const projectCount = projects.length;

    // Get user's assigned tasks
    const myTasks = tasksWithStatus.filter(t => t.assigneeId === ctx.user.id);
    const myTasksCount = myTasks.length;

    return {
      projectStats,
      averageProgress,
      taskStats,
      checklistStats,
      projectCount,
      myTasksCount,
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
