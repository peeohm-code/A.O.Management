import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  InsertProject, 
  tasks, 
  InsertTask,
  qcChecklists,
  InsertQcChecklist,
  qcChecklistItems,
  InsertQcChecklistItem,
  defects,
  InsertDefect,
  documents,
  InsertDocument
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ==================== User Functions ====================

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

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// ==================== Project Functions ====================

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(project);
  return result;
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProjects(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return await db.select().from(projects)
      .where(eq(projects.ownerId, userId))
      .orderBy(desc(projects.createdAt));
  }
  
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(projects).where(eq(projects.id, id));
}

export async function getProjectsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects)
    .where(eq(projects.status, status as any))
    .orderBy(desc(projects.createdAt));
}

// ==================== Task Functions ====================

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(tasks).values(task);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.createdAt));
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getTasksByAssignee(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks)
    .where(eq(tasks.assignedToId, userId))
    .orderBy(desc(tasks.createdAt));
}

// ==================== QC Checklist Functions ====================

export async function createQcChecklist(checklist: InsertQcChecklist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(qcChecklists).values(checklist);
}

export async function getQcChecklistById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(qcChecklists).where(eq(qcChecklists.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getQcChecklistsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(qcChecklists)
    .where(eq(qcChecklists.projectId, projectId))
    .orderBy(desc(qcChecklists.createdAt));
}

export async function updateQcChecklist(id: number, data: Partial<InsertQcChecklist>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(qcChecklists).set(data).where(eq(qcChecklists.id, id));
}

export async function deleteQcChecklist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(qcChecklists).where(eq(qcChecklists.id, id));
}

// ==================== QC Checklist Item Functions ====================

export async function createQcChecklistItem(item: InsertQcChecklistItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(qcChecklistItems).values(item);
}

export async function getQcChecklistItemsByChecklist(checklistId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(qcChecklistItems)
    .where(eq(qcChecklistItems.checklistId, checklistId))
    .orderBy(desc(qcChecklistItems.createdAt));
}

export async function updateQcChecklistItem(id: number, data: Partial<InsertQcChecklistItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(qcChecklistItems).set(data).where(eq(qcChecklistItems.id, id));
}

export async function deleteQcChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(qcChecklistItems).where(eq(qcChecklistItems.id, id));
}

// ==================== Defect Functions ====================

export async function createDefect(defect: InsertDefect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(defects).values(defect);
}

export async function getDefectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(defects).where(eq(defects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDefectsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(defects)
    .where(eq(defects.projectId, projectId))
    .orderBy(desc(defects.createdAt));
}

export async function updateDefect(id: number, data: Partial<InsertDefect>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(defects).set(data).where(eq(defects.id, id));
}

export async function deleteDefect(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(defects).where(eq(defects.id, id));
}

export async function getDefectsByStatus(projectId: number, status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(defects)
    .where(and(
      eq(defects.projectId, projectId),
      eq(defects.status, status as any)
    ))
    .orderBy(desc(defects.createdAt));
}

// ==================== Document Functions ====================

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(documents).values(document);
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDocumentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents)
    .where(eq(documents.projectId, projectId))
    .orderBy(desc(documents.createdAt));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(documents).where(eq(documents.id, id));
}

export async function getDocumentsByCategory(projectId: number, category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents)
    .where(and(
      eq(documents.projectId, projectId),
      eq(documents.category, category)
    ))
    .orderBy(desc(documents.createdAt));
}

// ==================== Dashboard/Stats Functions ====================

export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  const [taskStats] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when status = 'in-progress' then 1 else 0 end)`,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const [defectStats] = await db
    .select({
      total: sql<number>`count(*)`,
      open: sql<number>`sum(case when status = 'open' then 1 else 0 end)`,
      resolved: sql<number>`sum(case when status = 'resolved' then 1 else 0 end)`,
    })
    .from(defects)
    .where(eq(defects.projectId, projectId));

  const [qcStats] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
    })
    .from(qcChecklists)
    .where(eq(qcChecklists.projectId, projectId));

  return {
    tasks: taskStats,
    defects: defectStats,
    qcChecklists: qcStats,
  };
}
