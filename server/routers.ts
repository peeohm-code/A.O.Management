import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
    list: publicProcedure.query(async () => {
      const { getAllProjects } = await import('./db');
      return getAllProjects();
    }),
    getById: publicProcedure
      .input((val: unknown) => val as { id: number })
      .query(async ({ input }) => {
        const { getProjectById } = await import('./db');
        return getProjectById(input.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => val as { name: string; description?: string; location?: string; budget?: number })
      .mutation(async ({ input, ctx }) => {
        const { createProject } = await import('./db');
        return createProject({
          ...input,
          ownerId: ctx.user.id,
        });
      }),
    update: protectedProcedure
      .input((val: unknown) => val as { id: number; data: any })
      .mutation(async ({ input }) => {
        const { updateProject } = await import('./db');
        return updateProject(input.id, input.data);
      }),
    delete: protectedProcedure
      .input((val: unknown) => val as { id: number })
      .mutation(async ({ input }) => {
        const { deleteProject } = await import('./db');
        return deleteProject(input.id);
      }),
  }),

  // Tasks router
  tasks: router({
    listByProject: publicProcedure
      .input((val: unknown) => val as { projectId: number })
      .query(async ({ input }) => {
        const { getTasksByProject } = await import('./db');
        return getTasksByProject(input.projectId);
      }),
    create: protectedProcedure
      .input((val: unknown) => val as { projectId: number; title: string; description?: string; priority?: string; dueDate?: Date })
      .mutation(async ({ input, ctx }) => {
        const { createTask } = await import('./db');
        return createTask({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    update: protectedProcedure
      .input((val: unknown) => val as { id: number; data: any })
      .mutation(async ({ input }) => {
        const { updateTask } = await import('./db');
        return updateTask(input.id, input.data);
      }),
    delete: protectedProcedure
      .input((val: unknown) => val as { id: number })
      .mutation(async ({ input }) => {
        const { deleteTask } = await import('./db');
        return deleteTask(input.id);
      }),
  }),

  // QC router
  qc: router({
    listChecklists: publicProcedure
      .input((val: unknown) => val as { projectId: number })
      .query(async ({ input }) => {
        const { getChecklistsByProject } = await import('./db');
        return getChecklistsByProject(input.projectId);
      }),
    createChecklist: protectedProcedure
      .input((val: unknown) => val as { projectId: number; name: string; description?: string; category?: string; items: string })
      .mutation(async ({ input, ctx }) => {
        const { createChecklist } = await import('./db');
        return createChecklist({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    listInspections: publicProcedure
      .input((val: unknown) => val as { projectId: number })
      .query(async ({ input }) => {
        const { getInspectionsByProject } = await import('./db');
        return getInspectionsByProject(input.projectId);
      }),
    createInspection: protectedProcedure
      .input((val: unknown) => val as { checklistId: number; projectId: number; inspectionDate: Date; results: string; overallStatus: string; notes?: string })
      .mutation(async ({ input, ctx }) => {
        const { createInspection } = await import('./db');
        return createInspection({
          ...input,
          inspectorId: ctx.user.id,
        });
      }),
  }),

  // Documents router
  documents: router({
    listByProject: publicProcedure
      .input((val: unknown) => val as { projectId: number })
      .query(async ({ input }) => {
        const { getDocumentsByProject } = await import('./db');
        return getDocumentsByProject(input.projectId);
      }),
    create: protectedProcedure
      .input((val: unknown) => val as { projectId: number; taskId?: number; inspectionId?: number; fileName: string; fileKey: string; fileUrl: string; fileType?: string; fileSize?: number })
      .mutation(async ({ input, ctx }) => {
        const { createDocument } = await import('./db');
        return createDocument({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
