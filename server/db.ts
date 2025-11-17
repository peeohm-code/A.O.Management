import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  tasks, 
  qcChecklists, 
  qcChecklistItems, 
  issues, 
  attachments, 
  comments 
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ==================== Projects ====================

export async function createProject(data: {
  name: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  ownerId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(data);
  return result;
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function getProjectsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projects).where(eq(projects.ownerId, ownerId));
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projects);
}

export async function updateProject(id: number, data: Partial<typeof projects.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(projects).where(eq(projects.id, id));
}

// ==================== Tasks ====================

export async function createTask(data: {
  projectId: number;
  title: string;
  description?: string;
  assigneeId?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(tasks).values(data);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(tasks).where(eq(tasks.id, id));
}

// ==================== QC Checklists ====================

export async function createQCChecklist(data: {
  projectId: number;
  title: string;
  description?: string;
  category?: string;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(qcChecklists).values(data);
}

export async function getQCChecklistById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(qcChecklists).where(eq(qcChecklists.id, id)).limit(1);
  return result[0];
}

export async function getQCChecklistsByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(qcChecklists).where(eq(qcChecklists.projectId, projectId));
}

export async function updateQCChecklist(id: number, data: Partial<typeof qcChecklists.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(qcChecklists).set(data).where(eq(qcChecklists.id, id));
}

export async function deleteQCChecklist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(qcChecklists).where(eq(qcChecklists.id, id));
}

// ==================== QC Checklist Items ====================

export async function createQCChecklistItem(data: {
  checklistId: number;
  itemText: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(qcChecklistItems).values(data);
}

export async function getQCChecklistItemsByChecklist(checklistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(qcChecklistItems).where(eq(qcChecklistItems.checklistId, checklistId));
}

export async function updateQCChecklistItem(id: number, data: Partial<typeof qcChecklistItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(qcChecklistItems).set(data).where(eq(qcChecklistItems.id, id));
}

export async function deleteQCChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(qcChecklistItems).where(eq(qcChecklistItems.id, id));
}

// ==================== Issues ====================

export async function createIssue(data: {
  projectId: number;
  title: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  reportedById: number;
  assignedToId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(issues).values(data);
}

export async function getIssueById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  return result[0];
}

export async function getIssuesByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(issues).where(eq(issues.projectId, projectId));
}

export async function updateIssue(id: number, data: Partial<typeof issues.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(issues).set(data).where(eq(issues.id, id));
}

export async function deleteIssue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(issues).where(eq(issues.id, id));
}

// ==================== Attachments ====================

export async function createAttachment(data: {
  entityType: string;
  entityId: number;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  mimeType?: string;
  fileSize?: number;
  uploadedById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(attachments).values(data);
}

export async function getAttachmentsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(attachments)
    .where(and(
      eq(attachments.entityType, entityType),
      eq(attachments.entityId, entityId)
    ));
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(attachments).where(eq(attachments.id, id));
}

// ==================== Comments ====================

export async function createComment(data: {
  entityType: string;
  entityId: number;
  content: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(comments).values(data);
}

export async function getCommentsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(comments)
    .where(and(
      eq(comments.entityType, entityType),
      eq(comments.entityId, entityId)
    ));
}

export async function updateComment(id: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(comments).set({ content }).where(eq(comments.id, id));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(comments).where(eq(comments.id, id));
}
