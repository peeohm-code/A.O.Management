import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  tasks, 
  qcChecklists, 
  qcChecklistItems,
  qcInspections,
  qcInspectionResults,
  projectMembers,
  type Project,
  type Task,
  type QcChecklist,
  type QcInspection
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

// ==================== Projects ====================

export async function getAllProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get projects where user is owner or member
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.createdAt));

  return userProjects;
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return result[0] || null;
}

export async function createProject(data: Omit<typeof projects.$inferInsert, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  return result;
}

export async function updateProject(projectId: number, data: Partial<Project>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(data).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(eq(projects.id, projectId));
}

// ==================== Tasks ====================

export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(taskId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  return result[0] || null;
}

export async function createTask(data: Omit<typeof tasks.$inferInsert, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(data);
  return result;
}

export async function updateTask(taskId: number, data: Partial<Task>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set(data).where(eq(tasks.id, taskId));
}

export async function deleteTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tasks).where(eq(tasks.id, taskId));
}

// ==================== QC Checklists ====================

export async function getAllQcChecklists() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(qcChecklists)
    .orderBy(desc(qcChecklists.createdAt));
}

export async function getQcChecklistById(checklistId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(qcChecklists)
    .where(eq(qcChecklists.id, checklistId))
    .limit(1);

  return result[0] || null;
}

export async function getQcChecklistItems(checklistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(qcChecklistItems)
    .where(eq(qcChecklistItems.checklistId, checklistId))
    .orderBy(qcChecklistItems.orderIndex);
}

export async function createQcChecklist(data: Omit<typeof qcChecklists.$inferInsert, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(qcChecklists).values(data);
  return result;
}

export async function createQcChecklistItem(data: Omit<typeof qcChecklistItems.$inferInsert, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(qcChecklistItems).values(data);
  return result;
}

// ==================== QC Inspections ====================

export async function getQcInspectionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(qcInspections)
    .where(eq(qcInspections.projectId, projectId))
    .orderBy(desc(qcInspections.createdAt));
}

export async function getQcInspectionById(inspectionId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(qcInspections)
    .where(eq(qcInspections.id, inspectionId))
    .limit(1);

  return result[0] || null;
}

export async function getQcInspectionResults(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(qcInspectionResults)
    .where(eq(qcInspectionResults.inspectionId, inspectionId));
}

export async function createQcInspection(data: Omit<typeof qcInspections.$inferInsert, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(qcInspections).values(data);
  return result;
}

export async function createQcInspectionResult(data: Omit<typeof qcInspectionResults.$inferInsert, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(qcInspectionResults).values(data);
  return result;
}

export async function updateQcInspection(inspectionId: number, data: Partial<QcInspection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(qcInspections).set(data).where(eq(qcInspections.id, inspectionId));
}
