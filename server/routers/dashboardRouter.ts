import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";
import * as db from "../db";
import { getTaskDisplayStatus, getTaskDisplayStatusLabel, getTaskDisplayStatusColor } from "../taskStatusHelper";
import * as analyticsService from "../services/analytics.service";
import { logger } from "../logger";

/**
 * Dashboard Router
 * Auto-generated from server/routers.ts
 */
export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get all projects (admin can see all projects)
    const allProjects = await db.getAllProjects();
    const projectIds = allProjects.map((p: any) => p.id);
    const statsMap = await analyticsService.getBatchProjectStats(projectIds);
    
    const projectsWithStats = allProjects.map((project: any) => {
      const stats = statsMap.get(project.id);
      return { ...project, stats };
    });

    // Count projects by new 4-status logic:
    // 1. total = all projects
    // 2. on_track = no delayed tasks, not past endDate
    // 3. delayed = has delayed tasks, not past endDate
    // 4. overdue = past endDate and not completed
    const onTrackProjects = projectsWithStats.filter(
      p => p.stats?.projectStatus === "on_track"
    );
    const delayedProjects = projectsWithStats.filter(
      p => p.stats?.projectStatus === "delayed"
    );
    const overdueProjects = projectsWithStats.filter(
      p => p.stats?.projectStatus === "overdue"
    );

    const projectStats = {
      total: projectsWithStats.length,
      on_track: onTrackProjects.length,
      delayed: delayedProjects.length,
      overdue: overdueProjects.length,
      completed: projectsWithStats.filter(p => p.status === "completed").length,
      // Keep old fields for backward compatibility
      active: projectsWithStats.filter(p => p.status === "active").length,
      on_hold: projectsWithStats.filter(p => p.status === "on_hold").length,
      at_risk: 0, // Deprecated
      onTrack: onTrackProjects.length, // Alias for on_track
    };

    // @ts-ignore
    // Calculate average progress across all projects
    const totalProgress = projectsWithStats.reduce(
      (sum: any, p) => sum + p.stats.progressPercentage,
      0
    );
    const averageProgress =
      projectsWithStats.length > 0
        ? Math.round(totalProgress / projectsWithStats.length)
        : 0;

    // Get tasks from user's projects only (consistent with Tasks page)
    const userProjects = await db.getProjectsByUser(ctx.user!.id);
    const userProjectIds = userProjects.map((p: any) => p.projects.id);

    // Fix N+1 query: Use single query with inArray instead of loop
    const allTasks = userProjectIds.length > 0
      ? await db.getTasksByProjectIds(userProjectIds)
      : [];

    const tasksWithStatus = allTasks.map(task => ({
      ...task,
      displayStatus: getTaskDisplayStatus(task),
    }));

    // Count tasks by display status
    const taskStats = {
      not_started: tasksWithStatus.filter(
        t => t.displayStatus === "not_started"
      ).length,
      in_progress: tasksWithStatus.filter(
        t => t.displayStatus === "in_progress"
      ).length,
      delayed: tasksWithStatus.filter(t => t.displayStatus === "delayed")
        .length,
      completed: tasksWithStatus.filter(t => t.displayStatus === "completed")
        .length,
      total: tasksWithStatus.length,
    };

    // Get all checklists
    const allChecklists = await db.getAllTaskChecklists();

    // Count checklists by status
    const checklistStats = {
      not_started: allChecklists.filter((c: any) => c.status === "not_started")
        .length,
      pending_inspection: allChecklists.filter(
        (c: any) => c.status === "pending_inspection"
      ).length,
      in_progress: allChecklists.filter((c: any) => c.status === "in_progress")
        .length,
      completed: allChecklists.filter((c: any) => c.status === "completed")
        .length,
      failed: allChecklists.filter((c: any) => c.status === "failed").length,
      total: allChecklists.length,
    };

    // Get project count (use already fetched data)
    const projectCount = projectsWithStats.length;

    // Get user's assigned tasks
    const myTasks = tasksWithStatus.filter(t => t.assigneeId === ctx.user!.id);
    const myTasksCount = myTasks.length;

    // Get defect statistics
    const defectStats = await db.getDefectMetrics();

    // Calculate trends (compare with last week)
    // For now, we'll use simple mock data - in production, store historical data
    const trends = {
      active: Math.floor(Math.random() * 21) - 10, // -10 to +10
      onTrack: Math.floor(Math.random() * 21) - 10,
      at_risk: Math.floor(Math.random() * 21) - 10,
      delayed: Math.floor(Math.random() * 21) - 10,
    };

    return {
      projectStats,
      averageProgress,
      taskStats,
      checklistStats,
      defectStats,
      projectCount,
      myTasksCount,
      trends,
    };
  }),

  // CEO Dashboard - Core Features
  ceoDashboard: protectedProcedure.query(async () => {
    const [projectOverview, projectStatus, tasksOverview, inspectionStats, defectStats, alerts] =
      await Promise.all([
        db.getCEOProjectOverview(),
        analyticsService.getCEOProjectStatusBreakdown(),
        db.getCEOTasksOverview(),
        db.getCEOInspectionStats(),
        db.getCEODefectStats(),
        db.getCEOAlerts(),
      ]);

    return {
      projectOverview,
      projectStatus,
      tasksOverview,
      inspectionStats,
      defectStats,
      alerts,
    };
  }),

  // Dashboard Enhancement - New Widgets
  getProjectTimelineOverview: protectedProcedure.query(async () => {
    try {
      const data = await db.getProjectTimelineOverview();
      return data || { summary: { total: 0, onTrack: 0, atRisk: 0, behindSchedule: 0 }, projects: [] };
    } catch (error) {
      logger.error('[dashboardRouter.getProjectTimelineOverview] Error', undefined, error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch project timeline overview',
      });
    }
  }),

  getTeamPerformanceMetrics: protectedProcedure.query(async () => {
    try {
      const data = await db.getTeamPerformanceMetrics();
      return data || { summary: { teamSize: 0, avgCompletionRate: 0, avgOnTimeRate: 0, totalTasksAssigned: 0, totalCompleted: 0 }, members: [] };
    } catch (error) {
      logger.error('[dashboardRouter.getTeamPerformanceMetrics] Error', undefined, error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch team performance metrics',
      });
    }
  }),

  getQCStatusSummary: protectedProcedure.query(async () => {
    try {
      const data = await db.getQCStatusSummary();
      return data || {
        inspections: { total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 },
        defects: { total: 0, critical: 0, high: 0, medium: 0, low: 0, resolvedLast30Days: 0, avgResolutionTime: 0 },
      };
    } catch (error) {
      logger.error('[dashboardRouter.getQCStatusSummary] Error', undefined, error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch QC status summary',
      });
    }
  }),

  getRecentActivities: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(15) }).optional())
    .query(async ({ input }) => {
      try {
        const limit = input?.limit || 15;
        const activities = await db.getRecentActivitiesEnhanced(limit);
        return activities;
      } catch (error) {
        logger.error('[dashboardRouter.getRecentActivities] Error', undefined, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent activities',
        });
      }
    }),
});
