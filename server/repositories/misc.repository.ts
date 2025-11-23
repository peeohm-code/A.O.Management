import { eq, desc, and, sql } from "drizzle-orm";
import {
  activityLog,
  archiveRules,
  archiveHistory,
  escalationRules,
  escalationLogs,
  projects,
  tasks,
  defects,
  users,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";
import { bigIntToNumber } from "../utils/bigint";

/**
 * Miscellaneous Repository
 * 
 * Handles miscellaneous database operations including:
 * - Activity logging and audit trail
 * - Escalation rules and logs
 * - Archive rules and history
 */
export class MiscRepository extends BaseRepository {
  // ==================== Activity Log ====================

  /**
   * Log activity
   */
  async logActivity(data: {
    userId: number;
    projectId?: number;
    taskId?: number;
    defectId?: number;
    action: string;
    details?: string;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const result = await this.db.insert(activityLog).values(data);
    return { insertId: bigIntToNumber((result as any).insertId) };
  }

  /**
   * Get task activity log
   */
  async getTaskActivityLog(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.taskId, taskId))
      .orderBy(desc(activityLog.createdAt));
  }

  /**
   * Get defect activity log
   */
  async getDefectActivityLog(defectId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.defectId, defectId))
      .orderBy(desc(activityLog.createdAt));
  }

  /**
   * Get project activity
   */
  async getProjectActivity(projectId: number, limit: number = 50) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.projectId, projectId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  /**
   * Log user activity
   */
  async logUserActivity(data: {
    userId: number;
    action: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await this.logActivity({
      userId: data.userId,
      action: data.action,
      details: data.details,
    });
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId: number, limit = 100) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  /**
   * Get all activity logs with filters
   */
  async getAllActivityLogs(filters?: {
    userId?: number;
    projectId?: number;
    taskId?: number;
    defectId?: number;
    limit?: number;
  }) {
    if (!this.db) return [];

    const conditions = [];
    if (filters?.userId) conditions.push(eq(activityLog.userId, filters.userId));
    if (filters?.projectId) conditions.push(eq(activityLog.projectId, filters.projectId));
    if (filters?.taskId) conditions.push(eq(activityLog.taskId, filters.taskId));
    if (filters?.defectId) conditions.push(eq(activityLog.defectId, filters.defectId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = this.db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt));

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  // ==================== Archive ====================

  /**
   * Get archive rules
   */
  async getArchiveRules() {
    if (!this.db) return [];

    return await this.db.select().from(archiveRules);
  }

  /**
   * Create archive rule
   */
  async createArchiveRule(data: {
    name: string;
    description?: string;
    createdBy: number;
    projectStatus?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
    daysAfterCompletion?: number;
    daysAfterEndDate?: number;
    enabled?: boolean;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const result = await this.db.insert(archiveRules).values({
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      projectStatus: data.projectStatus,
      daysAfterCompletion: data.daysAfterCompletion,
      daysAfterEndDate: data.daysAfterEndDate,
      enabled: data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    });

    return { insertId: bigIntToNumber((result as any).insertId) };
  }

  /**
   * Update archive rule
   */
  async updateArchiveRule(
    id: number,
    data: {
      name?: string;
      description?: string;
      projectStatus?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
      daysAfterCompletion?: number;
      daysAfterEndDate?: number;
      enabled?: boolean;
    }
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.projectStatus !== undefined) updateData.projectStatus = data.projectStatus;
    if (data.daysAfterCompletion !== undefined) updateData.daysAfterCompletion = data.daysAfterCompletion;
    if (data.daysAfterEndDate !== undefined) updateData.daysAfterEndDate = data.daysAfterEndDate;
    if (data.enabled !== undefined) updateData.enabled = data.enabled ? 1 : 0;

    return await this.db.update(archiveRules).set(updateData).where(eq(archiveRules.id, id));
  }

  /**
   * Delete archive rule
   */
  async deleteArchiveRule(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.delete(archiveRules).where(eq(archiveRules.id, id));
  }

  /**
   * Log archive history
   */
  async logArchiveHistory(data: {
    projectId: number;
    action: "archived" | "unarchived";
    performedBy: number;
    reason?: string;
    ruleId?: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const result = await this.db.insert(archiveHistory).values(data);
    return { insertId: bigIntToNumber((result as any).insertId) };
  }

  /**
   * Get archive history
   */
  async getArchiveHistory(projectId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(archiveHistory)
      .where(eq(archiveHistory.projectId, projectId))
      .orderBy(desc(archiveHistory.performedAt));
  }

  /**
   * Get archived projects
   */
  async getArchivedProjects(userId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(projects)
      .where(sql`${projects.archivedAt} IS NOT NULL`)
      .orderBy(desc(projects.updatedAt));
  }

  // ==================== Escalation ====================

  /**
   * Get all escalation rules
   */
  async getAllEscalationRules() {
    if (!this.db) return [];

    return await this.db.select().from(escalationRules);
  }

  /**
   * Get escalation rule by ID
   */
  async getEscalationRuleById(id: number) {
    if (!this.db) return null;

    const result = await this.db
      .select()
      .from(escalationRules)
      .where(eq(escalationRules.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create escalation rule
   */
  async createEscalationRule(data: any) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const result = await this.db.insert(escalationRules).values({
      name: data.name,
      description: data.description,
      eventType: data.eventType || data.triggerType,
      thresholdValue: data.thresholdValue,
      thresholdUnit: data.thresholdUnit || 'hours',
      notifyRoles: data.notifyRoles || '[]',
      notifyUsers: data.notifyUsers,
      isActive: data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
      createdBy: data.createdBy,
    });

    return { insertId: bigIntToNumber((result as any).insertId) };
  }

  /**
   * Update escalation rule
   */
  async updateEscalationRule(id: number, data: any) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.thresholdValue !== undefined) updateData.thresholdValue = data.thresholdValue;
    if (data.notifyUserIds !== undefined) updateData.notifyUserIds = data.notifyUserIds;
    if (data.enabled !== undefined) updateData.enabled = data.enabled ? 1 : 0;

    return await this.db.update(escalationRules).set(updateData).where(eq(escalationRules.id, id));
  }

  /**
   * Delete escalation rule
   */
  async deleteEscalationRule(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.delete(escalationRules).where(eq(escalationRules.id, id));
  }

  /**
   * Get all escalation logs
   */
  async getAllEscalationLogs() {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(escalationLogs)
      .orderBy(desc(escalationLogs.escalatedAt));
  }

  /**
   * Get escalation logs by entity
   */
  async getEscalationLogsByEntity(entityType: string, entityId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(escalationLogs)
      .where(eq(escalationLogs.entityId, entityId))
      .orderBy(desc(escalationLogs.escalatedAt));
  }

  /**
   * Resolve escalation log
   */
  async resolveEscalationLog(id: number, resolvedBy: number, resolutionNotes?: string) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db
      .update(escalationLogs)
      .set({
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(escalationLogs.id, id));
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStatistics() {
    if (!this.db) return null;

    const total = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLogs);

    const pending = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLogs)
      .where(sql`${escalationLogs.resolvedAt} IS NULL`);

    const resolved = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLogs)
      .where(sql`${escalationLogs.resolvedAt} IS NOT NULL`);

    return {
      total: total[0]?.count || 0,
      pending: pending[0]?.count || 0,
      resolved: resolved[0]?.count || 0,
    };
  }
}
