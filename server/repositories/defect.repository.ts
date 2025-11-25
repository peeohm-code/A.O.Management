import { eq, and, desc, count, sql, inArray } from "drizzle-orm";
import {
  defects,
  defectAttachments,
  defectInspections,
  tasks,
  taskChecklists,
  checklistTemplates,
  users,
  InsertDefectAttachment,
  InsertDefectInspection,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";

/**
 * Defect Repository
 * 
 * Handles all defect-related database operations including:
 * - Defect CRUD operations (CAR/PAR/NCR)
 * - Defect attachments management
 * - Defect inspections and reinspections
 * - Defect statistics and metrics
 */
export class DefectRepository extends BaseRepository {
  /**
   * Create new defect
   */
  async createDefect(data: {
    projectId: number;
    taskId: number;
    checklistItemResultId?: number;
    title: string;
    description?: string;
    photoUrls?: string;
    severity: "low" | "medium" | "high" | "critical";
    reportedBy: number;
    assignedTo?: number;
    type?: "CAR" | "PAR" | "NCR";
    checklistId?: number;
    rootCause?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    dueDate?: Date;
    ncrLevel?: "major" | "minor";
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.insert(defects).values({
      projectId: data.projectId,
      taskId: data.taskId,
      checklistItemResultId: data.checklistItemResultId,
      title: data.title,
      description: data.description,
      photoUrls: data.photoUrls,
      severity: data.severity,
      reportedBy: data.reportedBy,
      assignedTo: data.assignedTo,
      status: "reported",
      type: data.type || "CAR",
      checklistId: data.checklistId,
      rootCause: data.rootCause,
      correctiveAction: data.correctiveAction,
      preventiveAction: data.preventiveAction,
      dueDate: data.dueDate,
      ncrLevel: data.ncrLevel,
    });
  }

  /**
   * Get defect by ID
   */
  async getDefectById(id: number) {
    if (!this.db) return undefined;

    const result = await this.db
      .select()
      .from(defects)
      .where(eq(defects.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get defects by task
   */
  async getDefectsByTask(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defects)
      .where(eq(defects.taskId, taskId))
      .orderBy(desc(defects.createdAt));
  }

  /**
   * Get open defects
   */
  async getOpenDefects() {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defects)
      .where(eq(defects.status, "reported"))
      .orderBy(desc(defects.severity));
  }

  /**
   * Get all defects with joined data
   */
  async getAllDefects() {
    if (!this.db) return [];

    const results = await this.db
      .select({
        id: defects.id,
        taskId: defects.taskId,
        projectId: tasks.projectId,
        checklistItemResultId: defects.checklistItemResultId,
        title: defects.title,
        description: defects.description,
        photoUrls: defects.photoUrls,
        status: defects.status,
        severity: defects.severity,
        assignedTo: defects.assignedTo,
        reportedBy: defects.reportedBy,
        resolvedBy: defects.resolvedBy,
        resolvedAt: defects.resolvedAt,
        resolutionPhotoUrls: defects.resolutionPhotoUrls,
        resolutionComment: defects.resolutionComment,
        type: defects.type,
        checklistId: defects.checklistId,
        rootCause: defects.rootCause,
        correctiveAction: defects.correctiveAction,
        preventiveAction: defects.preventiveAction,
        dueDate: defects.dueDate,
        ncrLevel: defects.ncrLevel,
        verifiedBy: defects.verifiedBy,
        verifiedAt: defects.verifiedAt,
        verificationComment: defects.verificationComment,
        createdAt: defects.createdAt,
        updatedAt: defects.updatedAt,
        detectedAt: defects.createdAt,
        taskName: tasks.name,
        checklistTemplateName: checklistTemplates.name,
        assignedToName: sql<string | null>`(SELECT name FROM ${users} WHERE ${users.id} = ${defects.assignedTo})`,
        detectedByName: sql<string | null>`(SELECT name FROM ${users} WHERE ${users.id} = ${defects.reportedBy})`,
      })
      .from(defects)
      .leftJoin(tasks, eq(defects.taskId, tasks.id))
      .leftJoin(taskChecklists, eq(defects.checklistId, taskChecklists.id))
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
      .orderBy(desc(defects.createdAt));
    
    return results;
  }

  /**
   * Get defects with pagination and filters
   */
  async getDefectsPaginated(page: number, pageSize: number, filters?: {
    projectId?: number;
    taskId?: number;
    status?: string;
    severity?: string;
    assignedTo?: number;
  }) {
    if (!this.db) return { items: [], total: 0 };

    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [];
    if (filters?.taskId) {
      conditions.push(eq(defects.taskId, filters.taskId));
    }
    if (filters?.status) {
      conditions.push(eq(defects.status, filters.status as any));
    }
    if (filters?.severity) {
      conditions.push(eq(defects.severity, filters.severity as any));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(defects.assignedTo, filters.assignedTo));
    }
    if (filters?.projectId) {
      conditions.push(eq(tasks.projectId, filters.projectId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = this.db
      .select({ count: count() })
      .from(defects)
      .leftJoin(tasks, eq(defects.taskId, tasks.id));
    
    if (whereClause) {
      countQuery.where(whereClause);
    }
    
    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Get paginated items
    const itemsQuery = this.db
      .select({
        id: defects.id,
        taskId: defects.taskId,
        projectId: tasks.projectId,
        checklistItemResultId: defects.checklistItemResultId,
        title: defects.title,
        description: defects.description,
        photoUrls: defects.photoUrls,
        status: defects.status,
        severity: defects.severity,
        assignedTo: defects.assignedTo,
        reportedBy: defects.reportedBy,
        resolvedBy: defects.resolvedBy,
        resolvedAt: defects.resolvedAt,
        resolutionPhotoUrls: defects.resolutionPhotoUrls,
        resolutionComment: defects.resolutionComment,
        type: defects.type,
        checklistId: defects.checklistId,
        rootCause: defects.rootCause,
        correctiveAction: defects.correctiveAction,
        preventiveAction: defects.preventiveAction,
        dueDate: defects.dueDate,
        ncrLevel: defects.ncrLevel,
        verifiedBy: defects.verifiedBy,
        verifiedAt: defects.verifiedAt,
        verificationComment: defects.verificationComment,
        createdAt: defects.createdAt,
        updatedAt: defects.updatedAt,
        detectedAt: defects.createdAt,
        taskName: tasks.name,
        checklistTemplateName: checklistTemplates.name,
        assignedToName: sql<string | null>`(SELECT name FROM ${users} WHERE ${users.id} = ${defects.assignedTo})`,
        detectedByName: sql<string | null>`(SELECT name FROM ${users} WHERE ${users.id} = ${defects.reportedBy})`,
      })
      .from(defects)
      .leftJoin(tasks, eq(defects.taskId, tasks.id))
      .leftJoin(taskChecklists, eq(defects.checklistId, taskChecklists.id))
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id));
    
    if (whereClause) {
      itemsQuery.where(whereClause);
    }
    
    const items = await itemsQuery
      .orderBy(desc(defects.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total };
  }

  /**
   * Update defect
   */
  async updateDefect(
    id: number,
    data: Partial<{
      status: "reported" | "analysis" | "in_progress" | "resolved" | "pending_reinspection" | "closed";
      assignedTo: number;
      resolvedBy: number;
      resolvedAt: Date;
      resolutionPhotoUrls: string;
      resolutionComment: string;
      rootCause: string;
      correctiveAction: string;
      preventiveAction: string;
      dueDate: Date;
      ncrLevel: "major" | "minor";
      verifiedBy: number;
      verifiedAt: Date;
      verificationComment: string;
      resolutionNotes: string;
      implementationMethod: string;
      beforePhotos: string;
      afterPhotos: string;
      closureNotes: string;
    }>
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.resolvedBy !== undefined) updateData.resolvedBy = data.resolvedBy;
    if (data.resolvedAt !== undefined) updateData.resolvedAt = data.resolvedAt;
    if (data.resolutionPhotoUrls !== undefined) updateData.resolutionPhotoUrls = data.resolutionPhotoUrls;
    if (data.resolutionComment !== undefined) updateData.resolutionComment = data.resolutionComment;
    if (data.rootCause !== undefined) updateData.rootCause = data.rootCause;
    if (data.correctiveAction !== undefined) updateData.correctiveAction = data.correctiveAction;
    if (data.preventiveAction !== undefined) updateData.preventiveAction = data.preventiveAction;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.ncrLevel !== undefined) updateData.ncrLevel = data.ncrLevel;
    if (data.verifiedBy !== undefined) updateData.verifiedBy = data.verifiedBy;
    if (data.verifiedAt !== undefined) updateData.verifiedAt = data.verifiedAt;
    if (data.verificationComment !== undefined) updateData.verificationComment = data.verificationComment;
    if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;
    if (data.implementationMethod !== undefined) updateData.implementationMethod = data.implementationMethod;
    if (data.beforePhotos !== undefined) updateData.beforePhotos = data.beforePhotos;
    if (data.afterPhotos !== undefined) updateData.afterPhotos = data.afterPhotos;
    if (data.closureNotes !== undefined) updateData.closureNotes = data.closureNotes;

    return await this.db.update(defects).set(updateData).where(eq(defects.id, id));
  }

  /**
   * Delete defect
   */
  async deleteDefect(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Delete related attachments first
    await this.db.delete(defectAttachments).where(eq(defectAttachments.defectId, id));
    
    // Delete the defect
    return await this.db.delete(defects).where(eq(defects.id, id));
  }

  /**
   * Get defects by type (CAR/PAR/NCR)
   */
  async getDefectsByType(type: "CAR" | "PAR" | "NCR") {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defects)
      .where(eq(defects.type, type))
      .orderBy(desc(defects.createdAt));
  }

  /**
   * Get defects by checklist
   */
  async getDefectsByChecklist(checklistId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defects)
      .where(eq(defects.checklistId, checklistId))
      .orderBy(desc(defects.createdAt));
  }

  /**
   * Get defects by status
   */
  async getDefectsByStatus(
    status: "reported" | "analysis" | "in_progress" | "resolved" | "pending_reinspection" | "closed"
  ) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defects)
      .where(eq(defects.status, status))
      .orderBy(desc(defects.createdAt));
  }

  /**
   * Create defect attachment
   */
  async createDefectAttachment(attachment: InsertDefectAttachment) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.insert(defectAttachments).values(attachment);
  }

  /**
   * Get defect attachments
   */
  async getDefectAttachments(defectId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defectAttachments)
      .where(eq(defectAttachments.defectId, defectId))
      .orderBy(desc(defectAttachments.uploadedAt));
  }

  /**
   * Get defect attachments by category
   */
  async getDefectAttachmentsByCategory(defectId: number, category: string) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defectAttachments)
      .where(eq(defectAttachments.defectId, defectId))
      .orderBy(desc(defectAttachments.uploadedAt));
  }

  /**
   * Delete defect attachment
   */
  async deleteDefectAttachment(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.delete(defectAttachments).where(eq(defectAttachments.id, id));
  }

  /**
   * Create defect inspection
   */
  async createDefectInspection(data: InsertDefectInspection) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.insert(defectInspections).values(data);
  }

  /**
   * Get defect inspections
   */
  async getDefectInspections(defectId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defectInspections)
      .where(eq(defectInspections.defectId, defectId))
      .orderBy(desc(defectInspections.inspectedAt));
  }

  /**
   * Get latest inspection for a defect
   */
  async getLatestInspection(defectId: number) {
    if (!this.db) return undefined;

    const result = await this.db
      .select()
      .from(defectInspections)
      .where(eq(defectInspections.defectId, defectId))
      .orderBy(desc(defectInspections.inspectedAt))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
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
   * Get defect statistics by type
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
   * Get defect statistics by priority/severity
   */
  async getDefectStatsByPriority() {
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
   * Get recent defects
   */
  async getRecentDefects(limit: number = 10) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(defects)
      .orderBy(desc(defects.createdAt))
      .limit(limit);
  }
}
