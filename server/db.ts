import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  tasks, 
  qcChecklists, 
  qcInspections, 
  qcPhotos,
  projectMembers,
  InsertProject,
  InsertTask,
  InsertQcChecklist,
  InsertQcInspection,
  InsertQcPhoto,
  InsertProjectMember
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

// Projects
export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project);
  return result;
}

export async function getProjectsByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// Tasks
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(tasks).values(task);
}

export async function getTasksByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// QC Checklists
export async function createQcChecklist(checklist: InsertQcChecklist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(qcChecklists).values(checklist);
}

export async function getQcChecklistsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(qcChecklists).where(eq(qcChecklists.projectId, projectId)).orderBy(desc(qcChecklists.createdAt));
}

export async function getQcChecklistById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(qcChecklists).where(eq(qcChecklists.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// QC Inspections
export async function createQcInspection(inspection: InsertQcInspection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(qcInspections).values(inspection);
}

export async function getQcInspectionsByChecklistId(checklistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(qcInspections).where(eq(qcInspections.checklistId, checklistId)).orderBy(desc(qcInspections.inspectionDate));
}

export async function getQcInspectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(qcInspections).where(eq(qcInspections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateQcInspection(id: number, data: Partial<InsertQcInspection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(qcInspections).set(data).where(eq(qcInspections.id, id));
}

export async function deleteQcInspection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(qcInspections).where(eq(qcInspections.id, id));
}

// QC Photos
export async function createQcPhoto(photo: InsertQcPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(qcPhotos).values(photo);
}

export async function getQcPhotosByInspectionId(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(qcPhotos).where(eq(qcPhotos.inspectionId, inspectionId)).orderBy(desc(qcPhotos.createdAt));
}

export async function deleteQcPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(qcPhotos).where(eq(qcPhotos.id, id));
}

// Project Members
export async function addProjectMember(member: InsertProjectMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(projectMembers).values(member);
}

export async function getProjectMembersByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
}

export async function removeProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(projectMembers).where(
    and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    )
  );
}
