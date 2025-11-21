import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { bigIntToNumber } from "../utils/bigint";
import { withTransaction } from "../utils/transaction";
import { logger } from "../logger";
import {
  defects,
  defectAttachments,
  activityLog,
  tasks,
  type Defect,
  type InsertDefect,
  type DefectAttachment,
  type InsertDefectAttachment,
} from "../../drizzle/schema";

/**
 * Defect Service
 * Handles all defect-related operations including attachments
 */

// ============================================================================
// Defect CRUD Operations
// ============================================================================

export async function createDefect(data: InsertDefect): Promise<Defect> {
  return await withTransaction(async (tx) => {
    const [result] = await tx.insert(defects).values(data);
    const defectId = bigIntToNumber(result.insertId);
    
    // Create activity log entry
    await tx.insert(activityLog).values({
      userId: data.reportedBy,
      taskId: data.taskId,
      defectId: defectId,
      action: 'defect_created',
      details: `Defect created: ${data.title}`,
    });
    
    const [created] = await tx.select().from(defects).where(eq(defects.id, defectId));
    if (!created) throw new Error("Failed to create defect");
    
    logger.info(`[Defect Service] Created defect ${defectId}`);
    return created;
  });
}

export async function getDefectById(defectId: number): Promise<Defect | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [defect] = await db.select().from(defects).where(eq(defects.id, defectId));
  return defect;
}

export async function getDefectsByProjectId(projectId: number): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: defects.id,
      taskId: defects.taskId,
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
      actionMethod: defects.actionMethod,
      actionResponsible: defects.actionResponsible,
      actionDeadline: defects.actionDeadline,
      actionNotes: defects.actionNotes,
      ncrLevel: defects.ncrLevel,
      verifiedBy: defects.verifiedBy,
      verifiedAt: defects.verifiedAt,
      verificationComment: defects.verificationComment,
      resolutionNotes: defects.resolutionNotes,
      implementationMethod: defects.implementationMethod,
      beforePhotos: defects.beforePhotos,
      afterPhotos: defects.afterPhotos,
      closureNotes: defects.closureNotes,
      createdAt: defects.createdAt,
      updatedAt: defects.updatedAt,
      escalation: defects.escalation,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(defects.createdAt));
  
  return result as Defect[];
}

export async function getDefectsByStatus(
  projectId: number,
  status: Defect["status"]
): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: defects.id,
      taskId: defects.taskId,
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
      actionMethod: defects.actionMethod,
      actionResponsible: defects.actionResponsible,
      actionDeadline: defects.actionDeadline,
      actionNotes: defects.actionNotes,
      ncrLevel: defects.ncrLevel,
      verifiedBy: defects.verifiedBy,
      verifiedAt: defects.verifiedAt,
      verificationComment: defects.verificationComment,
      resolutionNotes: defects.resolutionNotes,
      implementationMethod: defects.implementationMethod,
      beforePhotos: defects.beforePhotos,
      afterPhotos: defects.afterPhotos,
      closureNotes: defects.closureNotes,
      createdAt: defects.createdAt,
      updatedAt: defects.updatedAt,
      escalation: defects.escalation,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .where(and(eq(tasks.projectId, projectId), eq(defects.status, status)))
    .orderBy(desc(defects.createdAt));
  
  return result as Defect[];
}

export async function getDefectsBySeverity(
  projectId: number,
  severity: Defect["severity"]
): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: defects.id,
      taskId: defects.taskId,
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
      actionMethod: defects.actionMethod,
      actionResponsible: defects.actionResponsible,
      actionDeadline: defects.actionDeadline,
      actionNotes: defects.actionNotes,
      ncrLevel: defects.ncrLevel,
      verifiedBy: defects.verifiedBy,
      verifiedAt: defects.verifiedAt,
      verificationComment: defects.verificationComment,
      resolutionNotes: defects.resolutionNotes,
      implementationMethod: defects.implementationMethod,
      beforePhotos: defects.beforePhotos,
      afterPhotos: defects.afterPhotos,
      closureNotes: defects.closureNotes,
      createdAt: defects.createdAt,
      updatedAt: defects.updatedAt,
      escalation: defects.escalation,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .where(and(eq(tasks.projectId, projectId), eq(defects.severity, severity)))
    .orderBy(desc(defects.createdAt));
  
  return result as Defect[];
}

export async function getDefectsByAssignee(assigneeId: number): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(defects)
    .where(eq(defects.assignedTo, assigneeId))
    .orderBy(desc(defects.createdAt));
}

export async function updateDefect(
  defectId: number,
  data: Partial<InsertDefect>,
  updatedBy?: number
): Promise<Defect> {
  return await withTransaction(async (tx) => {
    const safeDefectId = bigIntToNumber(defectId);
    
    await tx.update(defects).set(data).where(eq(defects.id, safeDefectId));
    
    // Create activity log entry if status changed
    if (data.status && updatedBy) {
      await tx.insert(activityLog).values({
        userId: updatedBy,
        defectId: safeDefectId,
        action: 'defect_status_changed',
        details: `Defect status changed to: ${data.status}`,
      });
    }
    
    const [updated] = await tx.select().from(defects).where(eq(defects.id, safeDefectId));
    if (!updated) throw new Error("Defect not found after update");
    
    logger.info(`[Defect Service] Updated defect ${safeDefectId}`);
    return updated;
  });
}

export async function deleteDefect(defectId: number): Promise<void> {
  const safeDefectId = bigIntToNumber(defectId);
  logger.info(`[Defect Service] Starting deletion of defect ${safeDefectId}`);
  
  await withTransaction(async (tx) => {
    // Delete attachments first
    await tx.delete(defectAttachments).where(eq(defectAttachments.defectId, safeDefectId));
    
    // Delete activity logs
    await tx.delete(activityLog).where(eq(activityLog.defectId, safeDefectId));

    // Delete defect
    await tx.delete(defects).where(eq(defects.id, safeDefectId));
    
    logger.info(`[Defect Service] Successfully deleted defect ${safeDefectId}`);
  });
}

// ============================================================================
// Defect Attachments
// ============================================================================

export async function createDefectAttachment(
  data: InsertDefectAttachment
): Promise<DefectAttachment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [attachment] = await db.insert(defectAttachments).values(data).$returningId();
  const [created] = await db
    .select()
    .from(defectAttachments)
    .where(eq(defectAttachments.id, attachment.id));

  if (!created) throw new Error("Failed to create defect attachment");
  return created;
}

export async function getDefectAttachments(defectId: number): Promise<DefectAttachment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(defectAttachments)
    .where(eq(defectAttachments.defectId, defectId))
    .orderBy(desc(defectAttachments.uploadedAt));
}

export async function deleteDefectAttachment(attachmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(defectAttachments).where(eq(defectAttachments.id, attachmentId));
}

// ============================================================================
// Bulk Operations
// ============================================================================

export async function bulkUpdateDefectStatus(
  defectIds: number[],
  status: Defect["status"]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(defects).set({ status }).where(inArray(defects.id, defectIds));
}

export async function bulkAssignDefects(
  defectIds: number[],
  assignedTo: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(defects).set({ assignedTo }).where(inArray(defects.id, defectIds));
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

export async function getDefectStatsByProject(projectId: number): Promise<{
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      status: defects.status,
      severity: defects.severity,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId));

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const defect of result) {
    byStatus[defect.status] = (byStatus[defect.status] || 0) + 1;
    bySeverity[defect.severity] = (bySeverity[defect.severity] || 0) + 1;
  }

  const allDefects = result;

  return {
    total: allDefects.length,
    byStatus,
    bySeverity,
  };
}

export async function getCriticalDefects(projectId: number): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: defects.id,
      taskId: defects.taskId,
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
      actionMethod: defects.actionMethod,
      actionResponsible: defects.actionResponsible,
      actionDeadline: defects.actionDeadline,
      actionNotes: defects.actionNotes,
      ncrLevel: defects.ncrLevel,
      verifiedBy: defects.verifiedBy,
      verifiedAt: defects.verifiedAt,
      verificationComment: defects.verificationComment,
      resolutionNotes: defects.resolutionNotes,
      implementationMethod: defects.implementationMethod,
      beforePhotos: defects.beforePhotos,
      afterPhotos: defects.afterPhotos,
      closureNotes: defects.closureNotes,
      createdAt: defects.createdAt,
      updatedAt: defects.updatedAt,
      escalation: defects.escalation,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(defects.severity, "critical"),
        sql`${defects.status} != 'resolved'`
      )
    )
    .orderBy(desc(defects.createdAt));
  
  return result as Defect[];
}
