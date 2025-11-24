import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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

  // Projects router
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProjectsByOwnerId(ctx.user.id);
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
        status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createProject({
          ...input,
          ownerId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProject(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProject(input.id);
      }),
  }),

  // Tasks router
  tasks: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByProjectId(input.projectId);
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
        status: z.enum(["todo", "in_progress", "review", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTask({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "review", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateTask(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteTask(input.id);
      }),
  }),

  // QC Checklists router
  qcChecklists: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcChecklistsByProjectId(input.projectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcChecklistById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        taskId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createQcChecklist({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateQcChecklist(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteQcChecklist(input.id);
      }),
  }),

  // QC Inspections router
  qcInspections: router({
    listByChecklist: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcInspectionsByChecklistId(input.checklistId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcInspectionById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        checklistId: z.number(),
        status: z.enum(["pass", "fail", "pending"]).optional(),
        notes: z.string().optional(),
        inspectionDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createQcInspection({
          ...input,
          inspectedBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pass", "fail", "pending"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateQcInspection(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteQcInspection(input.id);
      }),
  }),

  // QC Photos router
  qcPhotos: router({
    listByInspection: protectedProcedure
      .input(z.object({ inspectionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcPhotosByInspectionId(input.inspectionId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        inspectionId: z.number(),
        fileKey: z.string(),
        url: z.string(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createQcPhoto({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteQcPhoto(input.id);
      }),
  }),

  // Project Members router
  projectMembers: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectMembersByProjectId(input.projectId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(["owner", "manager", "member", "viewer"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.addProjectMember(input);
      }),
    
    remove: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.removeProjectMember(input.projectId, input.userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
