import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  projects, InsertProject,
  tasks, InsertTask,
  qcChecklists, InsertQcChecklist,
  qcInspections, InsertQcInspection,
  documents, InsertDocument,
  teamMembers, InsertTeamMember
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

// Project queries
export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(projects);
  return result;
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(project);
  return result;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

// Task queries
export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  return result;
}

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(task);
  return result;
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// QC Checklist queries
export async function getChecklistsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(qcChecklists).where(eq(qcChecklists.projectId, projectId));
  return result;
}

export async function createChecklist(checklist: InsertQcChecklist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(qcChecklists).values(checklist);
  return result;
}

// QC Inspection queries
export async function getInspectionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(qcInspections).where(eq(qcInspections.projectId, projectId));
  return result;
}

export async function createInspection(inspection: InsertQcInspection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(qcInspections).values(inspection);
  return result;
}

// Document queries
export async function getDocumentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(documents).where(eq(documents.projectId, projectId));
  return result;
}

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(document);
  return result;
}

// Team member queries
export async function getTeamMembersByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(teamMembers).where(eq(teamMembers.projectId, projectId));
  return result;
}

export async function addTeamMember(member: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamMembers).values(member);
  return result;
}
