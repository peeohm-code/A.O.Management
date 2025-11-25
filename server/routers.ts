import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { randomBytes } from "crypto";

// Helper function to generate random suffix for file keys
function randomSuffix() {
  return randomBytes(8).toString('hex');
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== Project Routes ====================
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Admin can see all projects, users see only their own
      if (ctx.user.role === 'admin') {
        return await db.getAllProjects();
      }
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
        status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).optional(),
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
        status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).optional(),
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

    getStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectStats(input.projectId);
      }),
  }),

  // ==================== Task Routes ====================
  tasks: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByProject(input.projectId);
      }),

    listByAssignee: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getTasksByAssignee(ctx.user.id);
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
        status: z.enum(['todo', 'in-progress', 'review', 'completed']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        assignedToId: z.number().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTask({
          ...input,
          createdById: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in-progress', 'review', 'completed']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        assignedToId: z.number().optional(),
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

  // ==================== QC Checklist Routes ====================
  qc: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcChecklistsByProject(input.projectId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcChecklistById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        inspectorId: z.number().optional(),
        inspectionDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createQcChecklist(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        inspectorId: z.number().optional(),
        status: z.enum(['pending', 'in-progress', 'completed']).optional(),
        inspectionDate: z.date().optional(),
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

    // QC Checklist Items
    getItems: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQcChecklistItemsByChecklist(input.checklistId);
      }),

    createItem: protectedProcedure
      .input(z.object({
        checklistId: z.number(),
        itemName: z.string().min(1),
        description: z.string().optional(),
        result: z.enum(['pass', 'fail', 'pending', 'na']).optional(),
        notes: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createQcChecklistItem(input);
      }),

    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        itemName: z.string().min(1).optional(),
        description: z.string().optional(),
        result: z.enum(['pass', 'fail', 'pending', 'na']).optional(),
        notes: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateQcChecklistItem(id, data);
      }),

    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteQcChecklistItem(input.id);
      }),
  }),

  // ==================== Defect Routes ====================
  defects: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDefectsByProject(input.projectId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDefectById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        assignedToId: z.number().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createDefect({
          ...input,
          reportedById: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
        assignedToId: z.number().optional(),
        photoUrl: z.string().optional(),
        resolvedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDefect(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDefect(input.id);
      }),
  }),

  // ==================== Document Routes ====================
  documents: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByProject(input.projectId);
      }),

    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        fileData: z.string(), // base64 encoded file
        fileType: z.string(),
        fileSize: z.number(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { projectId, name, description, fileData, fileType, fileSize, category } = input;
        
        // Decode base64 and upload to S3
        const buffer = Buffer.from(fileData, 'base64');
        const fileKey = `project-${projectId}/documents/${name}-${randomSuffix()}`;
        const { url } = await storagePut(fileKey, buffer, fileType);

        return await db.createDocument({
          projectId,
          name,
          description,
          fileUrl: url,
          fileKey,
          fileType,
          fileSize,
          category,
          uploadedById: ctx.user.id,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDocument(input.id);
      }),
  }),

  // ==================== User Routes ====================
  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
