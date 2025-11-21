import { desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  users,
  activityLog,
  type User,
  type InsertUser,
  type ActivityLog,
  type InsertActivityLog,
} from "../../drizzle/schema";

/**
 * User Service
 * Handles all user-related operations including authentication and activity logs
 */

// ============================================================================
// User CRUD Operations
// ============================================================================

export async function createUser(data: InsertUser): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  const [created] = await db.select().from(users).where(eq(users.id, insertId));

  if (!created) throw new Error("Failed to create user");
  return created;
}

export async function getUserById(userId: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.openId, openId));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function searchUsers(query: string): Promise<User[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searchPattern = `%${query}%`;
  return db
    .select()
    .from(users)
    .where(
      or(
        like(users.name, searchPattern),
        like(users.email, searchPattern)
      )
    )
    .orderBy(users.name);
}

export async function updateUser(
  userId: number,
  data: Partial<InsertUser>
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, userId));

  const [updated] = await db.select().from(users).where(eq(users.id, userId));
  if (!updated) throw new Error("User not found after update");

  return updated;
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete activity logs
  await db.delete(activityLog).where(eq(activityLog.userId, userId));

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}

// ============================================================================
// User Role Management
// ============================================================================

export async function updateUserRole(
  userId: number,
  role: User["role"]
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));

  const [updated] = await db.select().from(users).where(eq(users.id, userId));
  if (!updated) throw new Error("User not found after update");

  return updated;
}

export async function getUsersByRole(role: User["role"]): Promise<User[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(users).where(eq(users.role, role)).orderBy(users.name);
}

// ============================================================================
// Activity Logs
// ============================================================================

export async function createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(activityLog).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  const [created] = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.id, insertId));

  if (!created) throw new Error("Failed to create activity log");
  return created;
}

export async function getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt));
}

export async function getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.projectId, projectId))
    .orderBy(desc(activityLog.createdAt));
}

export async function getRecentActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

// ============================================================================
// User Statistics
// ============================================================================

export async function getUserStats(userId: number): Promise<{
  totalActivities: number;
  lastActivity: Date | null;
  projectsInvolved: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId));

  const uniqueProjects = new Set(logs.map((log) => log.projectId).filter(Boolean));

  return {
    totalActivities: logs.length,
    lastActivity: logs.length > 0 ? logs[0].createdAt : null,
    projectsInvolved: uniqueProjects.size,
  };
}

// ============================================================================
// Authentication Helpers
// ============================================================================

export async function updateLastSignIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

export async function upsertUserFromAuth(data: InsertUser): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!data.openId) {
    throw new Error("User openId is required for upsert");
  }

  // Check if user exists
  const existing = await getUserByOpenId(data.openId);

  if (existing) {
    // Update existing user
    return updateUser(existing.id, {
      name: data.name,
      email: data.email,
      loginMethod: data.loginMethod,
      lastSignedIn: new Date(),
    });
  } else {
    // Create new user
    return createUser({
      ...data,
      lastSignedIn: new Date(),
    });
  }
}
