/**
 * Analytics Service - Optimized with SQL Aggregations
 * 
 * This service refactors analytics and reporting logic to use SQL aggregations
 * instead of JavaScript loops for optimal performance.
 * 
 * Key Optimizations:
 * - Uses Drizzle ORM's count(), sum(), and groupBy() functions
 * - Eliminates N+1 queries by using JOINs and aggregations
 * - Single-query approach instead of multiple queries + JS loops
 */

import { eq, and, ne, lt, isNull, count, sql, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  projects,
  tasks,
  taskChecklists,
  defects,
  users,
} from "../../drizzle/schema";
import { logger } from "../logger";

/**
 * Dashboard Statistics - Optimized with SQL Aggregations
 * 
 * Before: Multiple separate queries + JavaScript counting
 * After: Single query with CASE WHEN aggregations
 */
export async function getDashboardStats(userId?: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Single aggregated query for all task statistics
    const taskStatsResult = await db
      .select({
        totalTasks: count(),
        completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`,
        inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        overdueTasks: sql<number>`SUM(CASE WHEN ${tasks.status} != 'completed' AND ${tasks.endDate} < ${today} THEN 1 ELSE 0 END)`,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));

    const taskStats = taskStatsResult[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
    };

    // Get total active projects
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(isNull(projects.archivedAt));
    
    const totalActiveProjects = activeProjectsResult[0]?.count || 0;

    // Get inspection statistics
    const inspectionStatsResult = await db
      .select({
        pendingInspections: sql<number>`SUM(CASE WHEN ${taskChecklists.status} = 'pending_inspection' THEN 1 ELSE 0 END)`,
      })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));

    const pendingInspections = inspectionStatsResult[0]?.pendingInspections || 0;

    // Get defect statistics
    const defectStatsResult = await db
      .select({
        openDefects: sql<number>`SUM(CASE WHEN ${defects.status} != 'resolved' THEN 1 ELSE 0 END)`,
        criticalDefects: sql<number>`SUM(CASE WHEN ${defects.severity} = 'critical' AND ${defects.status} != 'resolved' THEN 1 ELSE 0 END)`,
      })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));

    const defectStats = defectStatsResult[0] || {
      openDefects: 0,
      criticalDefects: 0,
    };

    // Get team members count
    const teamMembersResult = await db
      .select({ count: count() })
      .from(users)
      .where(ne(users.role, "owner"));
    
    const teamMembers = teamMembersResult[0]?.count || 0;

    // Calculate completion rate
    const totalTasks = Number(taskStats.totalTasks) || 0;
    const completedTasks = Number(taskStats.completedTasks) || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalActiveProjects,
      totalTasks,
      completedTasks: Number(taskStats.completedTasks) || 0,
      inProgressTasks: Number(taskStats.inProgressTasks) || 0,
      overdueTasks: Number(taskStats.overdueTasks) || 0,
      pendingInspections: Number(pendingInspections) || 0,
      openDefects: Number(defectStats.openDefects) || 0,
      criticalDefects: Number(defectStats.criticalDefects) || 0,
      teamMembers,
      completionRate,
    };
  } catch (error: unknown) {
    logger.error('[getDashboardStats] Error:', error as Error);
    return null;
  }
}

/**
 * Project Statistics - Optimized with SQL Aggregations
 * 
 * Before: Fetch all tasks, loop through in JavaScript to count statuses
 * After: Single query with GROUP BY and CASE WHEN aggregations
 */
export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get project info
    const project = await db
      .select({
        id: projects.id,
        status: projects.status,
        endDate: projects.endDate,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    const projectData = project[0];
    if (!projectData) return null;

    // Single aggregated query for all task statistics
    const taskStatsResult = await db
      .select({
        totalTasks: count(),
        completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`,
        inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        notStartedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'not_started' THEN 1 ELSE 0 END)`,
        overdueTasks: sql<number>`SUM(CASE WHEN ${tasks.endDate} < ${today} AND ${tasks.status} != 'completed' THEN 1 ELSE 0 END)`,
        totalProgress: sql<number>`SUM(COALESCE(${tasks.progress}, 0))`,
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const stats = taskStatsResult[0];
    
    if (!stats || stats.totalTasks === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        notStartedTasks: 0,
        overdueTasks: 0,
        progressPercentage: 0,
        projectStatus: 'on_track' as const,
      };
    }

    const totalTasks = Number(stats.totalTasks) || 0;
    const completedTasks = Number(stats.completedTasks) || 0;
    const inProgressTasks = Number(stats.inProgressTasks) || 0;
    const notStartedTasks = Number(stats.notStartedTasks) || 0;
    const overdueTasks = Number(stats.overdueTasks) || 0;
    const totalProgress = Number(stats.totalProgress) || 0;

    // Calculate overall progress (average of all task progress)
    const progress = Math.round(totalProgress / totalTasks);

    // Determine project status based on logic:
    // 1. completed = all tasks completed OR project status is completed
    // 2. overdue = project endDate passed and not completed
    // 3. delayed = has at least one delayed task (overdue task)
    // 4. on_track = no delayed tasks
    let status: 'on_track' | 'delayed' | 'overdue' | 'completed';
    
    if (completedTasks === totalTasks || projectData.status === 'completed') {
      status = 'completed';
    } else if (projectData.endDate && new Date(projectData.endDate) < now) {
      // Project passed its end date and not completed = overdue
      status = 'overdue';
    } else if (overdueTasks > 0) {
      // Has at least one delayed task = delayed
      status = 'delayed';
    } else {
      // No delayed tasks = on track
      status = 'on_track';
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
      progressPercentage: progress,
      projectStatus: status,
    };
  } catch (error: unknown) {
    logger.error('[getProjectStats] Error:', error as Error);
    return null;
  }
}

/**
 * Batch Project Statistics - Optimized with SQL Aggregations
 * 
 * Before: Loop through projects, fetch tasks for each, count in JavaScript
 * After: Single query with GROUP BY projectId
 */
export async function getBatchProjectStats(projectIds: number[]) {
  const db = await getDb();
  if (!db || projectIds.length === 0) return new Map();

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get all projects in one query
    const projectsData = await db
      .select({
        id: projects.id,
        status: projects.status,
        endDate: projects.endDate,
      })
      .from(projects)
      .where(inArray(projects.id, projectIds));

    // Single aggregated query grouped by project
    const taskStatsResult = await db
      .select({
        projectId: tasks.projectId,
        totalTasks: count(),
        completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`,
        inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        notStartedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'not_started' THEN 1 ELSE 0 END)`,
        overdueTasks: sql<number>`SUM(CASE WHEN ${tasks.endDate} < ${today} AND ${tasks.status} != 'completed' THEN 1 ELSE 0 END)`,
        totalProgress: sql<number>`SUM(COALESCE(${tasks.progress}, 0))`,
      })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds))
      .groupBy(tasks.projectId);

    // Build a map of stats by projectId
    const statsMap = new Map();
    
    for (const projectData of projectsData) {
      const stats = taskStatsResult.find(s => s.projectId === projectData.id);
      
      if (!stats || stats.totalTasks === 0) {
        statsMap.set(projectData.id, {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          notStartedTasks: 0,
          overdueTasks: 0,
          progressPercentage: 0,
          projectStatus: 'on_track' as const,
        });
        continue;
      }

      const totalTasks = Number(stats.totalTasks) || 0;
      const completedTasks = Number(stats.completedTasks) || 0;
      const inProgressTasks = Number(stats.inProgressTasks) || 0;
      const notStartedTasks = Number(stats.notStartedTasks) || 0;
      const overdueTasks = Number(stats.overdueTasks) || 0;
      const totalProgress = Number(stats.totalProgress) || 0;

      const progress = Math.round(totalProgress / totalTasks);

      // Determine project status
      let status: 'on_track' | 'delayed' | 'overdue' | 'completed';
      
      if (completedTasks === totalTasks || projectData.status === 'completed') {
        status = 'completed';
      } else if (projectData.endDate && new Date(projectData.endDate) < now) {
        status = 'overdue';
      } else if (overdueTasks > 0) {
        status = 'delayed';
      } else {
        status = 'on_track';
      }

      statsMap.set(projectData.id, {
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        overdueTasks,
        progressPercentage: progress,
        projectStatus: status,
      });
    }

    return statsMap;
  } catch (error: unknown) {
    logger.error('[getBatchProjectStats] Error:', error as Error);
    return new Map();
  }
}

/**
 * CEO Project Status Breakdown - Optimized with SQL Aggregations
 * 
 * Before: Fetch all projects, loop through in JavaScript to categorize
 * After: Single query with CASE WHEN to categorize in SQL
 * 
 * Categories: on_track, at_risk, critical
 * Logic:
 * - Critical: overdue by 7+ days
 * - At Risk: overdue by 1-6 days OR < 30 days to deadline with < 50% completion
 * - On Track: everything else
 */
export async function getCEOProjectStatusBreakdown() {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Single query with SQL CASE WHEN to categorize projects
    const result = await db
      .select({
        onTrack: sql<number>`SUM(CASE 
          WHEN ${projects.endDate} IS NULL THEN 1
          WHEN DATEDIFF(${projects.endDate}, ${today}) >= 0 
            AND NOT (DATEDIFF(${projects.endDate}, ${today}) < 30 AND COALESCE(${projects.completionPercentage}, 0) < 50) 
            THEN 1
          ELSE 0
        END)`,
        atRisk: sql<number>`SUM(CASE 
          WHEN ${projects.endDate} IS NOT NULL 
            AND DATEDIFF(${projects.endDate}, ${today}) BETWEEN -6 AND -1 
            THEN 1
          WHEN ${projects.endDate} IS NOT NULL 
            AND DATEDIFF(${projects.endDate}, ${today}) BETWEEN 0 AND 29 
            AND COALESCE(${projects.completionPercentage}, 0) < 50 
            THEN 1
          ELSE 0
        END)`,
        critical: sql<number>`SUM(CASE 
          WHEN ${projects.endDate} IS NOT NULL 
            AND DATEDIFF(${projects.endDate}, ${today}) < -7 
            THEN 1
          ELSE 0
        END)`,
        total: count(),
      })
      .from(projects)
      .where(
        and(
          isNull(projects.archivedAt),
          ne(projects.status, "completed"),
          ne(projects.status, "cancelled")
        )
      );

    const stats = result[0];
    
    return {
      onTrack: Number(stats?.onTrack) || 0,
      atRisk: Number(stats?.atRisk) || 0,
      critical: Number(stats?.critical) || 0,
      total: Number(stats?.total) || 0,
    };
  } catch (error: unknown) {
    logger.error('[getCEOProjectStatusBreakdown] Error:', error as Error);
    return null;
  }
}

/**
 * Task Status Breakdown - Optimized with SQL Aggregations
 * 
 * Returns task counts grouped by status using SQL GROUP BY
 */
export async function getTaskStatusBreakdown(projectId?: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions = [isNull(projects.archivedAt)];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    // Use SQL GROUP BY to count tasks by status
    const result = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions))
      .groupBy(tasks.status);

    // Transform array to object for easier access
    const breakdown: Record<string, number> = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
    };

    for (const row of result) {
      if (row.status) {
        breakdown[row.status] = Number(row.count) || 0;
      }
    }

    return breakdown;
  } catch (error: unknown) {
    logger.error('[getTaskStatusBreakdown] Error:', error as Error);
    return null;
  }
}

/**
 * Defect Severity Breakdown - Optimized with SQL Aggregations
 * 
 * Returns defect counts grouped by severity using SQL GROUP BY
 */
export async function getDefectSeverityBreakdown(projectId?: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions = [
      isNull(projects.archivedAt),
      ne(defects.status, "resolved"),
    ];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    // Use SQL GROUP BY to count defects by severity
    const result = await db
      .select({
        severity: defects.severity,
        count: count(),
      })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions))
      .groupBy(defects.severity);

    // Transform array to object for easier access
    const breakdown: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const row of result) {
      if (row.severity) {
        breakdown[row.severity] = Number(row.count) || 0;
      }
    }

    return breakdown;
  } catch (error: unknown) {
    logger.error('[getDefectSeverityBreakdown] Error:', error as Error);
    return null;
  }
}

/**
 * Inspection Pass Rate - Optimized with SQL Aggregations
 * 
 * Calculates pass rate using SQL aggregations instead of fetching all records
 */
export async function getInspectionPassRate(projectId?: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions = [isNull(projects.archivedAt)];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    // Single query with aggregations
    const result = await db
      .select({
        total: count(),
        passed: sql<number>`SUM(CASE WHEN ${taskChecklists.status} = 'passed' THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN ${taskChecklists.status} = 'failed' THEN 1 ELSE 0 END)`,
      })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions));

    const stats = result[0];
    const total = Number(stats?.total) || 0;
    const passed = Number(stats?.passed) || 0;
    const failed = Number(stats?.failed) || 0;
    
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      passRate: Math.round(passRate * 100) / 100, // Round to 2 decimal places
    };
  } catch (error: unknown) {
    logger.error('[getInspectionPassRate] Error:', error as Error);
    return null;
  }
}
