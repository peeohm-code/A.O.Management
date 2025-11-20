import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== Projects Router ====================
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllProjects(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(["planning", "in_progress", "completed", "on_hold"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createProject({
          ...input,
          ownerId: ctx.user.id,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(["planning", "in_progress", "completed", "on_hold"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ==================== Tasks Router ====================
  tasks: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByProject(input.projectId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createTask({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTask(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  // ==================== QC Router ====================
  qc: router({
    // Checklists
    listChecklists: protectedProcedure.query(async () => {
      return await db.getAllQcChecklists();
    }),

    getChecklistById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const checklist = await db.getQcChecklistById(input.id);
        if (!checklist) return null;
        
        const items = await db.getQcChecklistItems(input.id);
        return { ...checklist, items };
      }),

    createChecklist: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        isTemplate: z.boolean().optional(),
        projectId: z.number().optional(),
        items: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { items, ...checklistData } = input;
        
        const result = await db.createQcChecklist({
          ...checklistData,
          createdBy: ctx.user.id,
        });

        const checklistId = Number((result as any).insertId);

        // Create checklist items if provided
        if (items && items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            await db.createQcChecklistItem({
              checklistId,
              itemText: items[i],
              orderIndex: i,
            });
          }
        }

        return { success: true, checklistId };
      }),

    // Inspections
    listInspectionsByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcInspectionsByProject(input.projectId);
      }),

    getInspectionById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const inspection = await db.getQcInspectionById(input.id);
        if (!inspection) return null;
        
        const results = await db.getQcInspectionResults(input.id);
        return { ...inspection, results };
      }),

    createInspection: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        checklistId: z.number(),
        taskId: z.number().optional(),
        inspectionDate: z.date(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createQcInspection({
          ...input,
          inspectorId: ctx.user.id,
        });

        return { success: true, inspectionId: Number((result as any).insertId) };
      }),

    submitInspectionResults: protectedProcedure
      .input(z.object({
        inspectionId: z.number(),
        results: z.array(z.object({
          checklistItemId: z.number(),
          result: z.enum(["pass", "fail", "na"]),
          remarks: z.string().optional(),
          photoUrl: z.string().optional(),
        })),
        overallResult: z.enum(["pass", "fail", "conditional"]),
      }))
      .mutation(async ({ input }) => {
        const { inspectionId, results, overallResult } = input;

        // Save each result
        for (const result of results) {
          await db.createQcInspectionResult({
            inspectionId,
            ...result,
          });
        }

        // Update inspection status
        await db.updateQcInspection(inspectionId, {
          status: "completed",
          overallResult,
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
