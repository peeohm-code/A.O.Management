import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import { logAuthorizationFailure } from "../rbac";
import { requireEditInspectionMiddleware } from "../middleware/permissionMiddleware";
import { logInspectionAudit, getClientIp, getUserAgent } from "../auditTrail";
import * as db from "../db";
import { taskChecklists } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { validateTaskCreateInput, validateTaskUpdateInput, validateInspectionSubmission, validateDefectCreateInput, validateDefectUpdateInput } from "@shared/validationUtils";
import { createNotification } from "../notificationService";
import { logger } from "../logger";

/**
 * Checklist Router
 * Auto-generated from server/routers.ts
 */
export const checklistRouter = router({
  templates: protectedProcedure.query(async () => {
    // Return all templates grouped by stage
    const preExecution = await db.getChecklistTemplatesByStage("pre_execution");
    const inProgress = await db.getChecklistTemplatesByStage("in_progress");
    const postExecution =
      await db.getChecklistTemplatesByStage("post_execution");

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
        logger.error("[createTemplate] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create template",
        });
      }
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.string().optional(),
        stage: z
          .enum(["pre_execution", "in_progress", "post_execution"])
          .optional(),
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
        const checklistsUsingTemplate = await db.getTaskChecklistsByTemplateId(
          input.id
        );

        if (checklistsUsingTemplate && checklistsUsingTemplate.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
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
        logger.error("[deleteTemplate] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete template",
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
      const checklists = await db.getTaskChecklistsByTemplateId(
        input.templateId
      );
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
        status: z.enum([
          "not_started",
          "pending_inspection",
          "in_progress",
          "completed",
          "failed",
        ]),
        generalComments: z.string().optional(),
        photoUrls: z.string().optional(),
        signature: z.string().optional(),
        itemResults: z
          .array(
            z.object({
              templateItemId: z.number(),
              result: z.enum(["pass", "fail", "na"]),
            })
          )
          .optional(),
      })
    )
    .use(requireEditInspectionMiddleware)
    .mutation(async ({ input, ctx }) => {
      const checklist = await db.getTaskChecklistById(input.id);
      if (!checklist) throw new Error("Checklist not found");
      
      // Permission check handled by middleware
      
      // Log audit trail
      await logInspectionAudit(
        ctx.user!.id,
        'submit',
        input.id,
        checklist.taskId,
        undefined,
        checklist,
        input,
        getClientIp(ctx.req),
        getUserAgent(ctx.req)
      );

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
            code: "BAD_REQUEST",
            message: validation.errors?.join(", ") || "Invalid inspection data",
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
        details: JSON.stringify({
          checklistId: input.id,
          status: input.status,
        }),
      });

      // Auto-update task progress based on checklist completion
      const { calculateAndUpdateTaskProgress } = await import(
        "../taskProgressHelper"
      );
      await calculateAndUpdateTaskProgress(checklist.taskId);

      // Send automatic notification when inspection fails
      if (input.status === "failed") {
        const task = await db.getTaskById(checklist.taskId);
        const project = task ? await db.getProjectById(task.projectId) : null;
        const template = await db.getChecklistTemplateById(checklist.templateId);
        
        // Notify task assignee
        if (task && task.assigneeId) {
          await createNotification({
            userId: task.assigneeId,
            type: "inspection_failed",
            title: "การตรวจสอบไม่ผ่าน",
            content: `การตรวจสอบ "${template?.name || 'Checklist'}" สำหรับงาน "${task.name}" ไม่ผ่าน กรุณาดำเนินการแก้ไข`,
            priority: "high",
            relatedTaskId: task.id,
            relatedProjectId: task.projectId,
            sendEmail: true,
          });
        }

        // Notify project manager
        if (project && project.createdBy) {
          await createNotification({
            userId: project.createdBy,
            type: "inspection_failed",
            title: "การตรวจสอบไม่ผ่าน",
            content: `โครงการ "${project.name}" - งาน "${task?.name}" การตรวจสอบไม่ผ่าน`,
            priority: "high",
            relatedTaskId: task?.id,
            relatedProjectId: project.id,
            sendEmail: true,
          });
        }

        // Update notification sent flag
        await db.updateTaskChecklist(input.id, {
          notificationSent: true,
          notifiedAt: new Date(),
        });
      }

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
      const templateItems = await db.getChecklistTemplateItems(
        checklist.templateId
      );

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
          const templateItem = templateItems.find(
            (ti: any) => ti.id === r.templateItemId
          );
          return {
            id: r.id,
            itemText: templateItem?.itemText || "Unknown item",
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
    .mutation(async ({ input }) => {
      const { generateInspectionPDF } = await import(
        "../inspectionPdfGenerator"
      );
      const htmlContent = await generateInspectionPDF(input.inspectionId);
      return { html: htmlContent };
    }),

  // Update individual checklist item result
  updateChecklistItem: protectedProcedure
    .input(
      z.object({
        itemResultId: z.number(),
        result: z.enum(["pass", "fail", "na"]),
        comments: z.string().optional(),
        photoUrls: z.string().optional(), // JSON string of photo URLs
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get the item result to find the checklist
      const itemResult = await db.getChecklistItemResultById(input.itemResultId);
      if (!itemResult) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Checklist item result not found",
        });
      }

      // Update the item result
      await db.updateChecklistItemResult(input.itemResultId, {
        result: input.result,
        comments: input.comments,
        photoUrls: input.photoUrls,
      });

      // Log activity
      const checklist = await db.getTaskChecklistById(itemResult.taskChecklistId);
      if (checklist) {
        await db.logActivity({
          userId: ctx.user!.id,
          taskId: checklist.taskId,
          action: "checklist_item_updated",
          details: JSON.stringify({
            itemResultId: input.itemResultId,
            result: input.result,
          }),
        });

        // Auto-update task progress
        const { calculateAndUpdateTaskProgress } = await import(
          "../taskProgressHelper"
        );
        await calculateAndUpdateTaskProgress(checklist.taskId);
      }

      return { success: true };
    }),

  // ===== Checklist Instance Management =====
  
  /**
   * Create a new checklist instance from a template
   */
  createInstance: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        templateId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await db.createChecklistInstance({
          taskId: input.taskId,
          templateId: input.templateId,
          createdBy: ctx.user!.id,
        });

        // Log activity
        await db.logActivity({
          userId: ctx.user!.id,
          taskId: input.taskId,
          action: "checklist_instance_created",
          details: JSON.stringify({
            instanceId: result.id,
            templateId: input.templateId,
          }),
        });

        return { success: true, instanceId: result.id };
      } catch (error) {
        logger.error("[createInstance] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create checklist instance",
        });
      }
    }),

  /**
   * Get a checklist instance with all items and progress
   */
  getInstance: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .query(async ({ input }) => {
      const instance = await db.getChecklistInstance(input.instanceId);
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Checklist instance not found",
        });
      }
      return instance;
    }),

  /**
   * List all checklist instances for a task
   */
  listInstancesByTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];

      const instances = await dbInstance
        .select()
        .from(taskChecklists)
        .where(eq(taskChecklists.taskId, input.taskId))
        .orderBy(desc(taskChecklists.createdAt));

      // Get progress for each instance
      const instancesWithProgress = await Promise.all(
        instances.map(async (instance: any) => {
          const fullInstance = await db.getChecklistInstance(instance.id);
          return {
            id: instance.id,
            templateId: instance.templateId,
            stage: instance.stage,
            status: fullInstance?.status || instance.status,
            completionPercentage: fullInstance?.completionPercentage || 0,
            inspectedBy: instance.inspectedBy,
            inspectedAt: instance.inspectedAt,
            createdAt: instance.createdAt,
          };
        })
      );

      return instancesWithProgress;
    }),

  /**
   * Complete a checklist item
   */
  completeItem: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        result: z.enum(["passed", "failed", "na"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await db.completeChecklistItem(input.itemId, {
          completedBy: ctx.user!.id,
          notes: input.notes,
          result: input.result,
        });

        return { success: true };
      } catch (error) {
        logger.error("[completeItem] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to complete checklist item",
        });
      }
    }),

  /**
   * Update checklist instance progress (recalculate and update status)
   */
  updateProgress: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // Get updated instance with recalculated progress
        const instance = await db.getChecklistInstance(input.instanceId);
        if (!instance) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Checklist instance not found",
          });
        }

        // Update status in database
        const dbInstance = await db.getDb();
        if (dbInstance) {
          await dbInstance
            .update(taskChecklists)
            .set({ status: instance.status })
            .where(eq(taskChecklists.id, input.instanceId));
        }

        return {
          success: true,
          completionPercentage: instance.completionPercentage,
          status: instance.status,
        };
      } catch (error) {
        logger.error("[updateProgress] Error", undefined, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update progress",
        });
      }
    }),

  // Get all task checklists with template and task info
  getAllTaskChecklists: protectedProcedure.query(async () => {
    const checklists = await db.getAllTaskChecklists();
    const tasks = await db.getAllTasks();
    const templates = await db.getAllChecklistTemplates();

    // Get all template items for all templates (optimized batch query)
    const templateIds = templates.map((t: any) => t.id);
    const itemsMap = await db.getBatchChecklistTemplateItems(templateIds);
    
    const allTemplateItems = templates.map((template: any) => ({
      templateId: template.id,
      items: itemsMap.get(template.id) || [],
    }));

    // Map checklists with task and template info
    return checklists.map((checklist: any) => {
      const task = tasks.find((t: any) => t.id === checklist.taskId);
      const template = templates.find(
        (t: any) => t.id === checklist.templateId
      );
      const templateItems =
        allTemplateItems.find((t: any) => t.templateId === checklist.templateId)
          ?.items || [];

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

  getPendingCount: protectedProcedure.query(async () => {
    // Count checklists that are pending inspection
    const allChecklists = await db.getAllTaskChecklists();
    
    // Filter for pending/in-progress checklists
    const pendingCount = allChecklists.filter((checklist: any) => 
      checklist.status === "pending_inspection" || checklist.status === "in_progress"
    ).length;
    
    return pendingCount;
  }),
});
