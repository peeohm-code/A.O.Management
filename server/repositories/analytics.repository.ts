import { eq, and, desc, count, sql, gte, lte, inArray } from "drizzle-orm";
import {
  projects,
  tasks,
  defects,
  taskChecklists,
  users,
  activityLog,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";

/**
 * Analytics Repository
 * 
 * Handles all analytics and statistics operations including:
 * - Dashboard statistics
 * - Project metrics and KPIs
 * - Defect analytics
 * - Inspection statistics
 * - Team performance metrics
 * - Predictive analytics
 */
export class AnalyticsRepository extends BaseRepository {
  /**
   * Get project statistics
   */
  async getProjectStats(projectId: number) {
    if (!this.db) return null;

    // Get task counts by status
    const taskStats = await this.db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .groupBy(tasks.status);

    // Get defect counts
    const defectCounts = await this.db
      .select({ count: count() })
      .from(defects)
      .leftJoin(tasks, eq(defects.taskId, tasks.id))
      .where(eq(tasks.projectId, projectId));

    // Get inspection counts
    const inspectionCounts = await this.db
      .select({ count: count() })
      .from(taskChecklists)
      .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .where(eq(tasks.projectId, projectId));

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedTasks = taskStats.find((s: any) => s.status === 'completed')?.count || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      progress,
      tasksByStatus: taskStats,
      totalDefects: defectCounts[0]?.count || 0,
      totalInspections: inspectionCounts[0]?.count || 0,
    };
  }

  /**
   * Get batch project stats (optimized for multiple projects)
   */
  async getBatchProjectStats(projectIds: number[]) {
    if (!this.db || projectIds.length === 0) return new Map();

    // Get all tasks for these projects
    const allTasks = await this.db
      .select({
        projectId: tasks.projectId,
        status: tasks.status,
      })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds));

    // Group by project and status
    const statsMap = new Map<number, any>();
    
    for (const task of allTasks) {
      if (!statsMap.has(task.projectId)) {
        statsMap.set(task.projectId, {
          totalTasks: 0,
          completedTasks: 0,
          tasksByStatus: {},
        });
      }
      
      const stats = statsMap.get(task.projectId)!;
      stats.totalTasks++;
      if (task.status === 'completed') stats.completedTasks++;
      stats.tasksByStatus[task.status] = (stats.tasksByStatus[task.status] || 0) + 1;
    }

    // Calculate progress for each project
    Array.from(statsMap.entries()).forEach(([projectId, stats]) => {
      stats.progress = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
        : 0;
    });

    return statsMap;
  }

  /**
   * Get defect statistics by status
   */
  async getDefectStatsByStatus() {
    if (!this.db) return [];

    return await this.db
      .select({
        status: defects.status,
        count: count(),
      })
      .from(defects)
      .groupBy(defects.status);
  }

  /**
   * Get defect statistics by type (CAR/PAR/NCR)
   */
  async getDefectStatsByType() {
    if (!this.db) return [];

    return await this.db
      .select({
        type: defects.type,
        count: count(),
      })
      .from(defects)
      .groupBy(defects.type);
  }

  /**
   * Get defect statistics by severity
   */
  async getDefectStatsBySeverity() {
    if (!this.db) return [];

    return await this.db
      .select({
        severity: defects.severity,
        count: count(),
      })
      .from(defects)
      .groupBy(defects.severity);
  }

  /**
   * Get defect metrics
   */
  async getDefectMetrics() {
    if (!this.db) return null;

    const total = await this.db.select({ count: count() }).from(defects);
    const resolved = await this.db
      .select({ count: count() })
      .from(defects)
      .where(eq(defects.status, 'resolved'));
    const critical = await this.db
      .select({ count: count() })
      .from(defects)
      .where(eq(defects.severity, 'critical'));

    return {
      total: total[0]?.count || 0,
      resolved: resolved[0]?.count || 0,
      critical: critical[0]?.count || 0,
      resolutionRate: total[0]?.count > 0 
        ? Math.round(((resolved[0]?.count || 0) / total[0].count) * 100) 
        : 0,
    };
  }

  /**
   * Get user task statistics
   */
  async getUserTaskStats(userId: number) {
    if (!this.db) return null;

    const taskStats = await this.db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(eq(tasks.assigneeId, userId))
      .groupBy(tasks.status);

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedTasks = taskStats.find((s: any) => s.status === 'completed')?.count || 0;

    return {
      totalTasks,
      completedTasks,
      tasksByStatus: taskStats,
      completionRate: totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0,
    };
  }

  /**
   * Get user task statistics for a specific project
   */
  async getUserTaskStatsForProject(userId: number, projectId: number) {
    if (!this.db) return null;

    const taskStats = await this.db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.assigneeId, userId),
          eq(tasks.projectId, projectId)
        )
      )
      .groupBy(tasks.status);

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedTasks = taskStats.find((s: any) => s.status === 'completed')?.count || 0;

    return {
      totalTasks,
      completedTasks,
      tasksByStatus: taskStats,
      completionRate: totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0,
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId?: number) {
    if (!this.db) return null;

    // Total counts
    const projectCount = await this.db.select({ count: count() }).from(projects);
    const taskCount = await this.db.select({ count: count() }).from(tasks);
    const defectCount = await this.db.select({ count: count() }).from(defects);
    const inspectionCount = await this.db.select({ count: count() }).from(taskChecklists);

    // If userId provided, get user-specific stats
    let userTasks = 0;
    let userDefects = 0;
    if (userId) {
      const userTaskCount = await this.db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.assigneeId, userId));
      userTasks = userTaskCount[0]?.count || 0;

      const userDefectCount = await this.db
        .select({ count: count() })
        .from(defects)
        .where(eq(defects.assignedTo, userId));
      userDefects = userDefectCount[0]?.count || 0;
    }

    return {
      totalProjects: projectCount[0]?.count || 0,
      totalTasks: taskCount[0]?.count || 0,
      totalDefects: defectCount[0]?.count || 0,
      totalInspections: inspectionCount[0]?.count || 0,
      userTasks,
      userDefects,
    };
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivitiesForDashboard(limit = 10) {
    if (!this.db) return [];

    return await this.db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        action: activityLog.action,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        userName: users.name,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  /**
   * Get project progress for dashboard
   */
  async getProjectProgressForDashboard() {
    if (!this.db) return [];

    const allProjects = await this.db.select().from(projects);
    
    const progressData = await Promise.all(
      allProjects.map(async (project: any) => {
        const stats = await this.getProjectStats(project.id);
        return {
          id: project.id,
          name: project.name,
          progress: stats?.progress || 0,
          totalTasks: stats?.totalTasks || 0,
          completedTasks: stats?.completedTasks || 0,
        };
      })
    );

    return progressData;
  }

  /**
   * Get inspection summary by task
   */
  async getInspectionSummaryByTask(taskId: number) {
    if (!this.db) return null;

    const checklists = await this.db
      .select()
      .from(taskChecklists)
      .where(eq(taskChecklists.taskId, taskId));

    const summary = {
      total: checklists.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      notStarted: 0,
    };

    checklists.forEach((checklist: any) => {
      switch (checklist.status) {
        case "completed":
          summary.completed++;
          break;
        case "failed":
          summary.failed++;
          break;
        case "in_progress":
        case "pending_inspection":
          summary.inProgress++;
          break;
        case "not_started":
          summary.notStarted++;
          break;
      }
    });

    return summary;
  }

  /**
   * Get CEO-level inspection statistics
   */
  async getCEOInspectionStats() {
    if (!this.db) return null;

    const total = await this.db.select({ count: count() }).from(taskChecklists);
    const completed = await this.db
      .select({ count: count() })
      .from(taskChecklists)
      .where(eq(taskChecklists.status, 'completed'));
    const failed = await this.db
      .select({ count: count() })
      .from(taskChecklists)
      .where(eq(taskChecklists.status, 'failed'));

    return {
      total: total[0]?.count || 0,
      completed: completed[0]?.count || 0,
      failed: failed[0]?.count || 0,
      passRate: total[0]?.count > 0 
        ? Math.round(((completed[0]?.count || 0) / total[0].count) * 100) 
        : 0,
    };
  }

  /**
   * Get CEO-level defect statistics
   */
  async getCEODefectStats() {
    if (!this.db) return null;

    const total = await this.db.select({ count: count() }).from(defects);
    const resolved = await this.db
      .select({ count: count() })
      .from(defects)
      .where(eq(defects.status, 'resolved'));
    const critical = await this.db
      .select({ count: count() })
      .from(defects)
      .where(eq(defects.severity, 'critical'));

    return {
      total: total[0]?.count || 0,
      resolved: resolved[0]?.count || 0,
      critical: critical[0]?.count || 0,
      resolutionRate: total[0]?.count > 0 
        ? Math.round(((resolved[0]?.count || 0) / total[0].count) * 100) 
        : 0,
    };
  }

  /**
   * Get QC status summary
   */
  async getQCStatusSummary() {
    if (!this.db) return null;

    const inspectionStats = await this.getCEOInspectionStats();
    const defectStats = await this.getCEODefectStats();

    return {
      inspections: inspectionStats,
      defects: defectStats,
    };
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformanceMetrics() {
    if (!this.db) return [];

    const teamMembers = await this.db.select().from(users);
    
    const metrics = await Promise.all(
      teamMembers.map(async (member: any) => {
        const stats = await this.getUserTaskStats(member.id);
        return {
          userId: member.id,
          userName: member.name,
          ...stats,
        };
      })
    );

    return metrics;
  }

  /**
   * Get performance KPIs for a project
   */
  async getPerformanceKPIs(projectId: number) {
    if (!this.db) return null;

    const projectStats = await this.getProjectStats(projectId);
    const defectStats = await this.getDefectMetrics();
    const inspectionStats = await this.getCEOInspectionStats();

    return {
      projectProgress: projectStats?.progress || 0,
      taskCompletionRate: projectStats?.progress || 0,
      defectResolutionRate: defectStats?.resolutionRate || 0,
      inspectionPassRate: inspectionStats?.passRate || 0,
      totalTasks: projectStats?.totalTasks || 0,
      totalDefects: defectStats?.total || 0,
      totalInspections: inspectionStats?.total || 0,
    };
  }
}
