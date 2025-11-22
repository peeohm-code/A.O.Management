import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { validateTaskCreateInput, validateTaskUpdateInput, validateInspectionSubmission, validateDefectCreateInput, validateDefectUpdateInput } from "@shared/validationUtils";
import { canEditDefect, canDeleteDefect } from "@shared/permissions";
import { notifyOwner } from "../_core/notification";
import { createNotification } from "../notificationService";
import { logger } from "../logger";
import {
  createDefectSchema,
  updateDefectSchema,
  getDefectSchema,
  deleteDefectSchema,
  getDefectsByTaskSchema,
  getDefectsByProjectSchema,
  defectStatusSchema,
  defectTypeSchema,
  paginationSchema
} from "@shared/validation";

/**
 * Defect Router
 * Auto-generated from server/routers.ts
 */
export const defectRouter = router({
  // Get defect by ID
  getById: protectedProcedure
    .input(getDefectSchema)
    .query(async ({ input }) => {
      return await db.getDefectById(input.id);
    }),

  // Get defects by task
  list: protectedProcedure
    .input(getDefectsByTaskSchema)
    .query(async ({ input }) => {
      return await db.getDefectsByTask(input.taskId);
    }),

  // Get defects by type (CAR/PAR/NCR)
  listByType: protectedProcedure
    .input(z.object({ type: defectTypeSchema }))
    .query(async ({ input }) => {
      return await db.getDefectsByType(input.type);
    }),

  // Get defects by status
  listByStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum([
          "reported",
          "rca_pending",
          "action_plan",
          "assigned",
          "in_progress",
          "implemented",
          "verification",
          "effectiveness_check",
          "closed",
          "rejected",
          "analysis",
          "resolved",
        ]),
      })
    )
    .query(async ({ input }) => {
      // @ts-ignore
      return await db.getDefectsByStatus(input.status);
    }),

  // Get defects by checklist
  listByChecklist: protectedProcedure
    .input(z.object({ checklistId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await db.getDefectsByChecklist(input.checklistId);
    }),

  // Get open/reported defects
  openDefects: protectedProcedure.query(async () => {
    return await db.getOpenDefects();
  }),

  // Get all defects
  allDefects: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ input }) => {
      try {
        const page = input?.page || 1;
        const pageSize = input?.pageSize || 25;
        const offset = (page - 1) * pageSize;

        const defects = await db.getAllDefects();
        const allDefects = Array.isArray(defects) ? defects : [];
        const totalItems = allDefects.length;

        // Apply pagination
        const paginatedDefects = allDefects.slice(offset, offset + pageSize);

        const totalPages = Math.ceil(totalItems / pageSize);
        return {
          items: paginatedDefects,
          pagination: {
            currentPage: page,
            pageSize,
            totalItems,
            totalPages,
            hasMore: page < totalPages,
            hasPrevious: page > 1,
          },
        };
      } catch (error) {
        logger.error("[defectRouter.allDefects] Error", undefined, error);
        return {
          items: [],
          pagination: {
            currentPage: 1,
            pageSize: 25,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
          },
        };
      }
    }),

  // Get single defect by ID
  get: protectedProcedure
    .input(getDefectSchema)
    .query(async ({ input }) => {
      return await db.getDefectById(input.id);
    }),

  // Create new CAR/PAR/NCR
  create: roleBasedProcedure("defects", "create")
    .input(createDefectSchema)
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
          code: "BAD_REQUEST",
          message: validation.errors?.join(", ") || "Invalid defect data",
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
          priority:
            input.severity === "critical"
              ? "urgent"
              : input.severity === "high"
                ? "high"
                : "normal",
          relatedDefectId: (result as any).insertId,
          relatedTaskId: input.taskId,
          sendEmail: true, // Always send email for defect assignments
        });
      }

      return result;
    }),

  // Update defect (workflow transitions)
  update: protectedProcedure
    .input(updateDefectSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateData } = input;
        const defect = await db.getDefectById(id);
        if (!defect) throw new Error("Defect not found");

        // Check edit permission
        if (!canEditDefect(ctx.user.role, ctx.user!.id, defect)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "คุณไม่มีสิทธิ์แก้ไข defect นี้",
          });
        }

        const dataToUpdate: any = {
          ...updateData,
          resolvedBy:
            updateData.status === "resolved" ? ctx.user!.id : undefined,
          resolvedAt: updateData.status === "resolved" ? new Date() : undefined,
          verifiedBy: updateData.status === "closed" ? ctx.user!.id : undefined,
          verifiedAt: updateData.status === "closed" ? new Date() : undefined,
        };
        
        // Ensure reportedBy is set if not present
        if (!dataToUpdate.reportedBy && defect.reportedBy) {
          dataToUpdate.reportedBy = defect.reportedBy;
        }
        // Validation: If beforePhotos exists, afterPhotos is required when status is resolved
        if (updateData.status === "resolved") {
          const defect = await db.getDefectById(id);
          if (defect && defect.beforePhotos) {
            try {
              const beforePhotosArray = JSON.parse(defect.beforePhotos as string);
              if (beforePhotosArray && beforePhotosArray.length > 0) {
                if (!input.afterPhotos) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                      "After photos are required when before photos exist",
                  });
                }
                const afterPhotosArray = JSON.parse(input.afterPhotos);
                if (!afterPhotosArray || afterPhotosArray.length === 0) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                      "After photos are required when before photos exist",
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
        if (
          updateData.assignedTo &&
          updateData.assignedTo !== defect.assignedTo
        ) {
          await createNotification({
            userId: updateData.assignedTo,
            type: "defect_created",
            title: `${defect.type} มอบหมายให้คุณ`,
            content: `คุณได้รับมอบหมาย ${defect.type}: "${defect.title}"`,
            priority:
              defect.severity === "critical"
                ? "urgent"
                : defect.severity === "high"
                  ? "high"
                  : "normal",
            relatedDefectId: defect.id as number,
            relatedTaskId: defect.taskId as number,
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
              userId: defect.assignedTo as number,
              type: "defect_status_changed",
              title: `${defect.type} เปลี่ยนสถานะ`,
              content: `${defect.type} "${defect.title}" เปลี่ยนสถานะเป็น: ${statusLabels[updateData.status]}`,
                   priority: "normal",
              relatedDefectId: defect.id as number,
              relatedTaskId: defect.taskId as number,
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
        logger.error("[defect.update] Error", undefined, error);
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
    .input(
      z.object({
        defectId: z.number(),
        attachmentType: z.enum(["before", "after", "supporting"]),
      })
    )
    .query(async ({ input }) => {
      return await db.getDefectAttachmentsByType(
        input.defectId,
        input.attachmentType
      );
    }),

  hasAfterPhotos: protectedProcedure
    .input(z.object({ defectId: z.number() }))
    .query(async ({ input }) => {
      const photos = await db.getDefectAttachmentsByType(
        input.defectId,
        "after"
      );
      return photos.length > 0;
    }),

  uploadAttachment: protectedProcedure
    .input(
      z.object({
        defectId: z.number(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        attachmentType: z.enum(["before", "after", "supporting"]),
      })
    )
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
          code: "FORBIDDEN",
          message: "เฉพาะ Owner, Admin และ PM เท่านั้นที่สามารถลบ defect ได้",
        });
      }

      await db.deleteDefect(input.id);
      return { success: true };
    }),

  // Dashboard Statistics
  getStatsByStatus: protectedProcedure.query(async () => {
    try {
      const stats = await db.getDefectStatsByStatus();
      return Array.isArray(stats) ? stats : [];
    } catch (error) {
      logger.error("[defectRouter.getStatsByStatus] Error", undefined, error);
      return [];
    }
  }),

  getStatsByType: protectedProcedure.query(async () => {
    try {
      const stats = await db.getDefectStatsByType();
      return Array.isArray(stats) ? stats : [];
    } catch (error) {
      logger.error("[defectRouter.getStatsByType] Error", undefined, error);
      return [];
    }
  }),

  getStatsByPriority: protectedProcedure.query(async () => {
    try {
      const stats = await db.getDefectStatsByPriority();
      return Array.isArray(stats) ? stats : [];
    } catch (error) {
      logger.error("[defectRouter.getStatsByPriority] Error", undefined, error);
      return [];
    }
  }),

  getMetrics: protectedProcedure.query(async () => {
    try {
      const metrics = await db.getDefectMetrics();
      // Ensure we always return a valid metrics object
      return (
        metrics || {
          total: 0,
          open: 0,
          closed: 0,
          pendingVerification: 0,
          overdue: 0,
        }
      );
    } catch (error) {
      logger.error("[defectRouter.getMetrics] Error", undefined, error);
      return {
        total: 0,
        open: 0,
        closed: 0,
        pendingVerification: 0,
        overdue: 0,
      };
    }
  }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getRecentDefects(input.limit);
    }),

  // Re-inspection workflow
  requestReinspection: protectedProcedure
    .input(
      z.object({
        defectId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const defect = await db.getDefectById(input.defectId);
        if (!defect) throw new Error("Defect not found");

        if (defect.status !== "resolved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "เฉพาะ defect ที่มีสถานะ resolved เท่านั้นที่สามารถขอตรวจสอบซ้ำได้",
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
        logger.error("[requestReinspection] Error", undefined, error);
        throw error;
      }
    }),

  submitReinspection: protectedProcedure
    .input(
      z.object({
        defectId: z.number(),
        result: z.enum(["passed", "failed"]),
        comments: z.string().optional(),
        photoUrls: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const defect = await db.getDefectById(input.defectId);
      if (!defect) throw new Error("Defect not found");
      if (defect.status !== "pending_reinspection") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Defect ต้องอยู่ในสถานะ pending_reinspection",
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
        const message =
          input.result === "passed"
            ? `${defect.type} ผ่านการตรวจสอบซ้ำแล้ว`
            : `${defect.type} ไม่ผ่านการตรวจสอบซ้ำ - ต้องแก้ไขใหม่`;

        await db.createNotification({
          userId: defect.assignedTo as number,
          type: "defect_reinspected",
          title: `ผลการตรวจสอบซ้ำ ${defect.type}`,
          content: message,
          relatedTaskId: defect.taskId as number,
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

  // Bulk Operations
  bulkUpdateStatus: roleBasedProcedure("defects", "edit")
    .input(
      z.object({
        defectIds: z.array(z.number()).min(1),
        status: z.enum([
          "reported",
          "rca_completed",
          "action_plan_approved",
          "in_progress",
          "resolved",
          "pending_reinspection",
          "closed",
          "analysis",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { defectIds, status } = input;
      let successCount = 0;

      for (const defectId of defectIds) {
        try {
          const defect = await db.getDefectById(defectId);
          if (!defect) continue;

          // Get task to find projectId
          const task = await db.getTaskById(defect.taskId);
          if (!task) continue;

          await db.updateDefect(defectId, { status: status as any });
          await db.logActivity({
            userId: ctx.user!.id,
            projectId: task.projectId,
            action: "defect_updated",
            details: JSON.stringify({ defectId, status, bulkUpdate: true }),
          });
          successCount++;
        } catch (error) {
          logger.error(`Failed to update defect ${defectId}`, undefined, error);
        }
      }

      return { success: true, updated: successCount, total: defectIds.length };
    }),

  bulkAssign: roleBasedProcedure("defects", "edit")
    .input(
      z.object({
        defectIds: z.array(z.number()).min(1),
        assigneeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { defectIds, assigneeId } = input;
      let successCount = 0;

      for (const defectId of defectIds) {
        try {
          const defect = await db.getDefectById(defectId);
          if (!defect) continue;

          // Get task to find projectId
          const task = await db.getTaskById(defect.taskId);
          if (!task) continue;

          await db.updateDefect(defectId, { assignedTo: assigneeId });
          await db.logActivity({
            userId: ctx.user!.id,
            projectId: task.projectId,
            action: "defect_updated",
            details: JSON.stringify({ defectId, assigneeId, bulkAssign: true }),
          });

          // Create notification for assignee
          await db.createNotification({
            userId: assigneeId as number,
            type: "defect_assigned",
            title: "New Defect Assigned",
            content: defect.title as string,
            relatedProjectId: task.projectId,
          });
          successCount++;
        } catch (error) {
          logger.error(`Failed to assign defect ${defectId}`, undefined, error);
        }
      }

      return { success: true, assigned: successCount, total: defectIds.length };
    }),

  bulkDelete: protectedProcedure
    .input(
      z.object({
        defectIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check delete permission
      if (!canDeleteDefect(ctx.user!.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "เฉพาะ Owner, Admin และ PM เท่านั้นที่สามารถลบ defect ได้",
        });
      }

      const { defectIds } = input;
      let successCount = 0;

      for (const defectId of defectIds) {
        try {
          await db.deleteDefect(defectId);
          successCount++;
        } catch (error) {
          logger.error(`Failed to delete defect ${defectId}`, undefined, error);
        }
      }

      return { success: true, deleted: successCount, total: defectIds.length };
    }),
});
