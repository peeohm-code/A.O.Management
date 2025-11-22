import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Inspection Router
 * Auto-generated from server/routers.ts
 */
export const inspectionRouter = router({
  // List inspections by project with pagination
  listByProject: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
    }))
    .query(async ({ input }) => {
      const { projectId, page = 1, pageSize = 25 } = input;
      const offset = (page - 1) * pageSize;

      // Get all inspections for the project
      const allInspections = await db.getTaskChecklistsByProject(projectId);
      const totalItems = allInspections.length;

      // Apply pagination
      const paginatedInspections = allInspections.slice(offset, offset + pageSize);

      const totalPages = Math.ceil(totalItems / pageSize);
      return {
        items: paginatedInspections,
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

  // List all inspections with pagination (for admin)
  list: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
      search: z.string().optional(),
      status: z.enum(["not_started", "pending_inspection", "in_progress", "completed", "failed"]).optional(),
      projectId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 25;
      const offset = (page - 1) * pageSize;

      // Get all inspections
      let allInspections = await db.getAllTaskChecklists();

      // Apply filters
      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        allInspections = allInspections.filter((inspection: any) => 
          inspection.taskName?.toLowerCase().includes(searchLower) ||
          inspection.templateName?.toLowerCase().includes(searchLower) ||
          inspection.projectName?.toLowerCase().includes(searchLower)
        );
      }

      if (input?.status) {
        allInspections = allInspections.filter((inspection: any) => inspection.status === input.status);
      }

      if (input?.projectId) {
        allInspections = allInspections.filter((inspection: any) => inspection.projectId === input.projectId);
      }

      const totalItems = allInspections.length;

      // Apply pagination
      const paginatedInspections = allInspections.slice(offset, offset + pageSize);

      const totalPages = Math.ceil(totalItems / pageSize);
      return {
        items: paginatedInspections,
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

  // Get inspection statistics
  getStats: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      let allInspections = await db.getAllTaskChecklists();

      // Filter by project if specified
      if (input?.projectId) {
        allInspections = allInspections.filter((inspection: any) => inspection.projectId === input.projectId);
      }

      const total = allInspections.length;
      const pending = allInspections.filter((i: any) => 
        i.status === "not_started" || i.status === "pending_inspection" || i.status === "in_progress"
      ).length;
      const passed = allInspections.filter((i: any) => i.status === "completed").length;
      const failed = allInspections.filter((i: any) => i.status === "failed").length;

      return {
        total,
        pending,
        passed,
        failed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      };
    }),
});
