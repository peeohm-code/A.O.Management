import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  defects,
  defectAttachments,
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [defect] = await db.insert(defects).values(data).$returningId();
  const [created] = await db.select().from(defects).where(eq(defects.id, defect.id));

  if (!created) throw new Error("Failed to create defect");
  return created;
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

  return db
    .select()
    .from(defects)
    .where(eq(defects.projectId, projectId))
    .orderBy(desc(defects.createdAt));
}

export async function getDefectsByStatus(
  projectId: number,
  status: Defect["status"]
): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(defects)
    .where(and(eq(defects.projectId, projectId), eq(defects.status, status)))
    .orderBy(desc(defects.createdAt));
}

export async function getDefectsBySeverity(
  projectId: number,
  severity: Defect["severity"]
): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(defects)
    .where(and(eq(defects.projectId, projectId), eq(defects.severity, severity)))
    .orderBy(desc(defects.createdAt));
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
  data: Partial<InsertDefect>
): Promise<Defect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(defects).set(data).where(eq(defects.id, defectId));

  const [updated] = await db.select().from(defects).where(eq(defects.id, defectId));
  if (!updated) throw new Error("Defect not found after update");

  return updated;
}

export async function deleteDefect(defectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete attachments first
  await db.delete(defectAttachments).where(eq(defectAttachments.defectId, defectId));

  // Delete defect
  await db.delete(defects).where(eq(defects.id, defectId));
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

  const allDefects = await db
    .select()
    .from(defects)
    .where(eq(defects.projectId, projectId));

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const defect of allDefects) {
    byStatus[defect.status] = (byStatus[defect.status] || 0) + 1;
    bySeverity[defect.severity] = (bySeverity[defect.severity] || 0) + 1;
  }

  return {
    total: allDefects.length,
    byStatus,
    bySeverity,
  };
}

export async function getCriticalDefects(projectId: number): Promise<Defect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(defects)
    .where(
      and(
        eq(defects.projectId, projectId),
        eq(defects.severity, "critical"),
        sql`${defects.status} != 'resolved'`
      )
    )
    .orderBy(desc(defects.createdAt));
}
