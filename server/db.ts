import { eq, and, or, isNull, isNotNull, sql, desc, asc, count, inArray, notInArray, like, gte, lte, lt, ne } from "drizzle-orm";
import { bigIntToNumber } from "./utils/bigint";
import { boolToInt } from "./utils/typeHelpers.js";
import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";
import {
  InsertUser,
  users,
  projects,
  projectMembers,
  tasks,
  taskDependencies,
  checklistTemplates,
  checklistTemplateItems,
  taskChecklists,
  checklistItemResults,
  defects,
  defectAttachments,
  InsertDefectAttachment,
  defectInspections,
  InsertDefectInspection,
  taskComments,
  taskAttachments,
  taskFollowers,
  notifications,
  activityLog,
  categoryColors,
  signatures,
  queryLogs,
  dbStatistics,
  InsertQueryLog,
  InsertDbStatistic,
  memoryLogs,
  oomEvents,
  pushSubscriptions,
  InsertPushSubscription,
  scheduledNotifications,
  notificationSettings,
  taskAssignments,
  alertThresholds,
  InsertAlertThreshold,
  escalationRules,
  escalationLogs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createNotification as sendNotification } from "./notificationService";
import { logger } from "./logger";

// Use Pool type from mysql2/promise for proper typing
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance with connection pooling
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create connection pool with optimized settings
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10, // Maximum 10 concurrent connections
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        maxIdle: 5, // Maximum idle connections
        idleTimeout: 60000, // Close idle connections after 60s
      });
      console.log("[Database] Connection pool created with limit: 10");
      // Create drizzle instance
      _db = drizzle(_pool);
    } catch (error: unknown) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Close database connections gracefully
export async function closeDbConnection(): Promise<void> {
  if (_pool) {
    try {
      await _pool.end();
      console.log('[Database] Connection pool closed');
      _pool = null;
      _db = null;
    } catch (error: unknown) {
      console.error('[Database] Error closing connection pool:', error);
    }
  }
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
      values.role = "admin";
      updateSet.role = "admin";
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
  } catch (error: unknown) {
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

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

  const result = await db.select().from(users);
  return result;
}

export async function updateUserRole(userId: number, role: "owner" | "admin" | "project_manager" | "qc_inspector" | "worker") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name: string; email?: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Partial<typeof users.$inferInsert> = { name: data.name };
  if (data.email !== undefined) {
    updateData.email = data.email || null;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function updateUserNotificationSettings(
  userId: number,
  data: {
    notificationDaysAdvance?: number;
    enableInAppNotifications?: boolean;
    enableEmailNotifications?: boolean;
    enableDailySummaryEmail?: boolean;
    dailySummaryTime?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: any = {};
  if (data.notificationDaysAdvance !== undefined) {
    updateData.notificationDaysAdvance = data.notificationDaysAdvance;
  }
  if (data.enableInAppNotifications !== undefined) {
    updateData.enableInAppNotifications = data.enableInAppNotifications;
  }
  if (data.enableEmailNotifications !== undefined) {
    updateData.enableEmailNotifications = data.enableEmailNotifications;
  }
  if (data.enableDailySummaryEmail !== undefined) {
    updateData.enableDailySummaryEmail = data.enableDailySummaryEmail;
  }
  if (data.dailySummaryTime !== undefined) {
    updateData.dailySummaryTime = data.dailySummaryTime;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

/**
 * Project Management
 */

/**
 * Generate next available project code in format AO-YYYY-XXX
 */
export async function generateProjectCode(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentYear = new Date().getFullYear();
  const prefix = `AO-${currentYear}-`;

  // Get the latest project code for this year
  const latestProjects = await db
    .select({ code: projects.code })
    .from(projects)
    .where(like(projects.code, `${prefix}%`))
    .orderBy(desc(projects.code))
    .limit(1);

  if (latestProjects.length === 0) {
    // First project of the year
    return `${prefix}001`;
  }

  const latestCode = latestProjects[0].code;
  if (!latestCode) {
    return `${prefix}001`;
  }

  // Extract the number part and increment
  const match = latestCode.match(/AO-(\d{4})-(\d{3})/);
  if (!match) {
    return `${prefix}001`;
  }

  const number = parseInt(match[2], 10) + 1;
  return `${prefix}${number.toString().padStart(3, '0')}`;
}

export async function createProject(data: {
  name: string;
  code?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  ownerName?: string;
  startDate?: string;
  endDate?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert date strings to Date objects
  const values: typeof projects.$inferInsert = {
    name: data.name,
    createdBy: data.createdBy,
  };
  
  // Auto-generate code if not provided
  if (data.code) {
    values.code = data.code;
  } else {
    values.code = await generateProjectCode();
  }
  
  if (data.location) values.location = data.location;
  if (data.latitude) values.latitude = data.latitude;
  if (data.longitude) values.longitude = data.longitude;
  if (data.ownerName) values.ownerName = data.ownerName;
  if (data.startDate) values.startDate = data.startDate;
  if (data.endDate) values.endDate = data.endDate;

  const [result] = await db.insert(projects).values(values);
  
  const projectId = bigIntToNumber(result.insertId);
  
  if (projectId && !isNaN(projectId)) {
    await db.insert(projectMembers).values({
      projectId,
      userId: data.createdBy,
      role: 'project_manager',
    });
  }
  
  return { insertId: projectId, id: projectId };
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projects)
    .where(isNull(projects.archivedAt)); // Filter out archived projects
}

// Pagination: Get projects with pagination
export async function getProjectsPaginated(page: number, pageSize: number) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const offset = (page - 1) * pageSize;

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(projects)
    .where(isNull(projects.archivedAt));
  const total = countResult[0]?.count || 0;

  // Get paginated items
  const items = await db
    .select()
    .from(projects)
    .where(isNull(projects.archivedAt))
    .orderBy(desc(projects.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total };
}

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projects)
    .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .where(
      and(
        eq(projectMembers.userId, userId),
        isNull(projects.archivedAt) // Filter out archived projects
      )
    );
}

/**
 * Validate project completeness for opening (minimum 70%)
 * Returns completeness percentage and details
 */
export async function validateProjectCompleteness(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  const checks = {
    basicInfo: 0,
    timeline: 0,
    team: 0,
    tasks: 0,
    checklists: 0,
  };

  const details: Array<{ category: string; status: 'complete' | 'incomplete'; message: string }> = [];

  // 1. Basic Info (20%): name, code, location
  if (project.name && project.code && project.location) {
    checks.basicInfo = 20;
    details.push({ category: 'ข้อมูลพื้นฐาน', status: 'complete', message: 'ชื่อโครงการ, รหัส, และที่อยู่ครบถ้วน' });
  } else {
    details.push({ category: 'ข้อมูลพื้นฐาน', status: 'incomplete', message: 'ต้องระบุชื่อโครงการ, รหัส, และที่อยู่' });
  }

  // 2. Timeline (20%): startDate, endDate
  if (project.startDate && project.endDate) {
    checks.timeline = 20;
    details.push({ category: 'ระยะเวลาโครงการ', status: 'complete', message: 'มีวันเริ่มต้นและวันสิ้นสุด' });
  } else {
    details.push({ category: 'ระยะเวลาโครงการ', status: 'incomplete', message: 'ต้องระบุวันเริ่มต้นและวันสิ้นสุด' });
  }

  // 3. Team (15%): at least 1 member
  const members = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  
  if (members.length > 0) {
    checks.team = 15;
    details.push({ category: 'ทีมงาน', status: 'complete', message: `มีสมาชิก ${members.length} คน` });
  } else {
    details.push({ category: 'ทีมงาน', status: 'incomplete', message: 'ต้องมีสมาชิกอย่างน้อย 1 คน' });
  }

  // 4. Tasks (15%): at least 1 task
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));
  
  if (projectTasks.length > 0) {
    checks.tasks = 15;
    details.push({ category: 'งาน', status: 'complete', message: `มีงาน ${projectTasks.length} งาน` });
  } else {
    details.push({ category: 'งาน', status: 'incomplete', message: 'ต้องมีงานอย่างน้อย 1 งาน' });
  }

  // 5. Checklist Templates (10%): at least 1 template (optional but recommended)
  const templates = await db
    .select()
    .from(checklistTemplates);
  
  if (templates.length > 0) {
    checks.checklists = 10;
    details.push({ category: 'Checklist Templates', status: 'complete', message: `มี ${templates.length} templates` });
  } else {
    details.push({ category: 'Checklist Templates', status: 'incomplete', message: 'แนะนำให้มี checklist template อย่างน้อย 1 อัน' });
  }

  const totalPercentage = Object.values(checks).reduce((sum: any, val) => sum + val, 0);

  return {
    percentage: totalPercentage,
    isValid: totalPercentage >= 70,
    checks,
    details,
  };
}

/**
 * Open project - change status from draft to planning or active
 */
export async function openProject(projectId: number, newStatus: 'planning' | 'active') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate completeness first
  const validation = await validateProjectCompleteness(projectId);
  if (!validation.isValid) {
    throw new Error(`โครงการมีความสมบูรณ์เพียง ${validation.percentage}% (ต้องการอย่างน้อย 70%)`);
  }

  // Update project status
  await db
    .update(projects)
    .set({ status: newStatus })
    .where(eq(projects.id, projectId));

  return { success: true, newStatus };
}

export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get project info for endDate
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  const projectData = project[0];

  // Get all tasks for this project
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const totalTasks = projectTasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      overdueTasks: 0,
      progressPercentage: 0,
      projectStatus: 'on_track' as const,
    };
  }

  const now = new Date();
  const completedTasks = projectTasks.filter((t: any) => t.status === 'completed').length;
  const inProgressTasks = projectTasks.filter((t: any) => t.status === 'in_progress').length;
  const notStartedTasks = projectTasks.filter((t: any) => t.status === 'not_started').length;
  const overdueTasks = projectTasks.filter((t: any) => 
    t.endDate && new Date(t.endDate) < now && t.status !== 'completed'
  ).length;

  // Calculate overall progress (average of all task progress)
  const totalProgress = projectTasks.reduce((sum: any, t: any) => sum + (t.progress || 0), 0);
  const progress = Math.round(totalProgress / totalTasks);

  // Determine project status based on new logic:
  // 1. overdue = project endDate passed and not completed
  // 2. delayed = has at least one delayed task (overdue task)
  // 3. on_track = no delayed tasks
  let status: 'on_track' | 'delayed' | 'overdue' | 'completed';
  
  if (completedTasks === totalTasks || projectData?.status === 'completed') {
    status = 'completed';
  } else if (projectData?.endDate && new Date(projectData.endDate) < now) {
    // Project passed its end date and not completed = overdue
    status = 'overdue';
  } else if (overdueTasks > 0) {
    // Has at least one delayed task = delayed
    status = 'delayed';
  } else {
    // No delayed tasks = on track
    status = 'on_track';
  }

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    overdueTasks,
    progressPercentage: progress,
    projectStatus: status,
  };
}

/**
 * Batch get project stats for multiple projects - Optimized version to prevent N+1 queries
 * @param projectIds Array of project IDs to get stats for
 * @returns Map of projectId to stats
 */
export async function getBatchProjectStats(projectIds: number[]) {
  const db = await getDb();
  if (!db || projectIds.length === 0) return new Map();

  // Get all projects in one query
  const projectsData = await db
    .select()
    .from(projects)
    .where(inArray(projects.id, projectIds));

  // Get all tasks for these projects in one query
  const allTasks = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.projectId, projectIds));

  // Group tasks by project ID
  const tasksByProject = new Map<number, any[]>();
  for (const task of allTasks) {
    const projectTasks = tasksByProject.get(task.projectId) || [];
    projectTasks.push(task);
    tasksByProject.set(task.projectId, projectTasks);
  }

  // Calculate stats for each project
  const statsMap = new Map();
  const now = new Date();

  for (const projectData of projectsData) {
    const projectTasks = tasksByProject.get(projectData.id) || [];
    const totalTasks = projectTasks.length;

    if (totalTasks === 0) {
      statsMap.set(projectData.id, {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        notStartedTasks: 0,
        overdueTasks: 0,
        progressPercentage: 0,
        projectStatus: 'on_track' as const,
      });
      continue;
    }

    const completedTasks = projectTasks.filter((t: any) => t.status === 'completed').length;
    const inProgressTasks = projectTasks.filter((t: any) => t.status === 'in_progress').length;
    const notStartedTasks = projectTasks.filter((t: any) => t.status === 'not_started').length;
    const overdueTasks = projectTasks.filter((t: any) => 
      t.endDate && new Date(t.endDate) < now && t.status !== 'completed'
    ).length;

    const totalProgress = projectTasks.reduce((sum: any, t: any) => sum + (t.progress || 0), 0);
    const progress = Math.round(totalProgress / totalTasks);

    let status: 'on_track' | 'delayed' | 'overdue' | 'completed';
    
    if (completedTasks === totalTasks || projectData?.status === 'completed') {
      status = 'completed';
    } else if (projectData?.endDate && new Date(projectData.endDate) < now) {
      status = 'overdue';
    } else if (overdueTasks > 0) {
      status = 'delayed';
    } else {
      status = 'on_track';
    }

    statsMap.set(projectData.id, {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
      progressPercentage: progress,
      projectStatus: status,
    });
  }

  return statsMap;
}

export async function updateProject(
  id: number,
  data: Partial<{
    name: string;
    code: string;
    location: string;
    latitude: string;
    longitude: string;
    startDate: string;
    endDate: string;
    ownerName: string;
    status: "draft" | "planning" | "active" | "on_hold" | "completed" | "cancelled";
    completionPercentage: number;
    progress: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.latitude !== undefined) updateData.latitude = data.latitude || null;
  if (data.longitude !== undefined) updateData.longitude = data.longitude || null;
  if (data.ownerName !== undefined) updateData.ownerName = data.ownerName || null;
  if (data.completionPercentage !== undefined) updateData.completionPercentage = data.completionPercentage;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.progress !== undefined) updateData.progress = data.progress;

  return await db.update(projects).set(updateData).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete in order to respect foreign key constraints
  // 1. Delete activity logs
  await db.delete(activityLog).where(eq(activityLog.projectId, id));
  
  // 2. Delete task-related data
  const projectTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, id));
  const taskIds = projectTasks.map((t: any) => t.id);
  
  if (taskIds.length > 0) {
    // Delete task dependencies
    await db.delete(taskDependencies).where(inArray(taskDependencies.taskId, taskIds));
    await db.delete(taskDependencies).where(inArray(taskDependencies.dependsOnTaskId, taskIds));
    
    // Delete task followers
    await db.delete(taskFollowers).where(inArray(taskFollowers.taskId, taskIds));
    
    // Delete task attachments
    await db.delete(taskAttachments).where(inArray(taskAttachments.taskId, taskIds));
    
    // Delete task comments
    await db.delete(taskComments).where(inArray(taskComments.taskId, taskIds));
    
    // Delete checklist item results
    await db.delete(checklistItemResults).where(inArray(checklistItemResults.taskChecklistId, 
      (await db.select({ id: taskChecklists.id }).from(taskChecklists).where(inArray(taskChecklists.taskId, taskIds))).map((tc: any) => tc.id)
    ));
    
    // Delete task checklists
    await db.delete(taskChecklists).where(inArray(taskChecklists.taskId, taskIds));
    
    // Delete defects
    await db.delete(defects).where(inArray(defects.taskId, taskIds));
    
    // Delete tasks
    await db.delete(tasks).where(eq(tasks.projectId, id));
  }
  
  // 3. Delete notifications
  await db.delete(notifications).where(eq(notifications.relatedProjectId, id));
  
  // 4. Delete project members
  await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
  
  // 5. Finally delete the project
  await db.delete(projects).where(eq(projects.id, id));
}

export async function archiveProject(projectId: number, userId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({
    archivedAt: new Date(),
    archivedBy: userId,
    archivedReason: reason,
  }).where(eq(projects.id, projectId));

  // Log archive history
  await logArchiveHistory({
    projectId,
    action: "archived",
    performedBy: userId,
    reason,
  });
}

export async function unarchiveProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({
    archivedAt: null,
    archivedBy: null,
    archivedReason: null,
  }).where(eq(projects.id, projectId));

  // Log archive history
  await logArchiveHistory({
    projectId,
    action: "unarchived",
    performedBy: userId,
  });
}

export async function getArchivedProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get user to check role
  const user = await getUserById(userId);
  if (!user) return [];

  // Admin and owner can see all archived projects
  if (user.role === 'admin' || user.role === 'owner') {
    const result = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.archivedAt))
      .orderBy(desc(projects.archivedAt));
    return result;
  }

  // Other users only see projects they're members of
  const result = await db
    .select()
    .from(projects)
    .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .where(
      and(
        eq(projectMembers.userId, userId),
        isNotNull(projects.archivedAt)
      )
    )
    .orderBy(desc(projects.archivedAt));

  return result.map((r: any) => r.projects);
}

export async function addProjectMember(data: {
  projectId: number;
  userId: number;
  role: "project_manager" | "qc_inspector" | "worker";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(projectMembers).values({
    projectId: data.projectId,
    userId: data.userId,
    role: data.role,
  });
}

/**
 * Task Management
 */
export async function createTask(data: {
  projectId: number;
  parentTaskId?: number;
  name: string;
  description?: string;
  category?: string;
  status?: string;
  priority?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  assigneeId?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { createdBy, startDate, endDate, ...taskData } = data;
  
  // Convert Date to string if needed
  const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
  const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
  
  const [result] = await db.insert(tasks).values({
    ...taskData,
    status: (taskData.status as any) || "todo",
    priority: (taskData.priority as any) || "medium",
    progress: 0,
    // Keep dates as strings (YYYY-MM-DD format) - database schema uses varchar(10)
    startDate: startDateStr || null,
    endDate: endDateStr || null,
  });
  
  const taskId = bigIntToNumber(result.insertId);
  return { insertId: taskId, id: taskId };
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

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.order));
}

/**
 * Get tasks by multiple project IDs (optimized to avoid N+1 queries)
 * @param projectIds Array of project IDs
 * @returns Array of tasks
 */
export async function getTasksByProjectIds(projectIds: number[]) {
  const db = await getDb();
  if (!db) return [];

  if (projectIds.length === 0) return [];

  return await db
    .select()
    .from(tasks)
    .where(inArray(tasks.projectId, projectIds))
    .orderBy(asc(tasks.order));
}

export async function getTasksByAssignee(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.assigneeId, userId))
    .orderBy(desc(tasks.updatedAt));
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.updatedAt));
}

// Pagination: Get tasks with pagination
export async function getTasksPaginated(page: number, pageSize: number, filters?: {
  projectId?: number;
  assigneeId?: number;
  status?: string;
  priority?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [];
  if (filters?.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }
  if (filters?.assigneeId) {
    conditions.push(eq(tasks.assigneeId, filters.assigneeId));
  }
  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(tasks.priority, filters.priority as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(tasks)
    .where(whereClause);
  const total = countResult[0]?.count || 0;

  // Get paginated items
  const items = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(desc(tasks.updatedAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total };
}

export async function updateTask(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    status: "todo" | "pending_pre_inspection" | "ready_to_start" | "in_progress" | "pending_final_inspection" | "rectification_needed" | "completed";
    progress: number;
    assigneeId: number;
    startDate: Date;
    endDate: Date;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined && data.name !== null) updateData.name = data.name;
  // Only update description if it's not undefined and not null (allow empty string)
  if (data.description !== undefined && data.description !== null) {
    updateData.description = data.description;
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.progress !== undefined) updateData.progress = data.progress;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  
  // Convert Date to YYYY-MM-DD string format for varchar columns
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate instanceof Date 
      ? data.startDate.toISOString().split('T')[0] 
      : data.startDate;
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate instanceof Date 
      ? data.endDate.toISOString().split('T')[0] 
      : data.endDate;
  }

  return await db.update(tasks).set(updateData).where(eq(tasks.id, id));
}

export async function addTaskDependency(data: {
  taskId: number;
  dependsOnTaskId: number;
  type?: "finish_to_start" | "start_to_start" | "finish_to_finish";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if dependency already exists
  const existing = await db
    .select()
    .from(taskDependencies)
    .where(
      and(
        eq(taskDependencies.taskId, data.taskId),
        eq(taskDependencies.dependsOnTaskId, data.dependsOnTaskId)
      )
    );

  if (existing.length > 0) {
    throw new Error("Dependency already exists");
  }

  return await db.insert(taskDependencies).values({
    taskId: data.taskId,
    dependsOnTaskId: data.dependsOnTaskId,
    type: data.type || "finish_to_start",
  });
}

/**
 * Checklist Template Management
 */
export async function createChecklistTemplate(data: {
  name: string;
  category?: string;
  stage: "pre_execution" | "in_progress" | "post_execution";
  description?: string;
  allowGeneralComments?: boolean;
  allowPhotos?: boolean;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(checklistTemplates).values({
    name: data.name,
    category: data.category,
    stage: data.stage,
    description: data.description,
    allowGeneralComments: data.allowGeneralComments,
    allowPhotos: data.allowPhotos,
    createdBy: data.createdBy,
  });

  // Handle BigInt conversion properly - convert to string first, then parse
  const insertId = parseInt(String(result.insertId));
  
  if (isNaN(insertId) || insertId === 0) {
    throw new Error(`Invalid insertId: ${result.insertId}`);
  }
  
  return { insertId };
}

export async function updateChecklistTemplate(
  id: number,
  data: {
    name?: string;
    category?: string;
    stage?: "pre_execution" | "in_progress" | "post_execution";
    description?: string;
    allowGeneralComments?: boolean;
    allowPhotos?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { ...data };
  if (data.allowGeneralComments !== undefined) {
    updateData.allowGeneralComments = data.allowGeneralComments ? 1 : 0;
  }
  if (data.allowPhotos !== undefined) {
    updateData.allowPhotos = data.allowPhotos ? 1 : 0;
  }

  return await db.update(checklistTemplates).set(updateData).where(eq(checklistTemplates.id, id));
}

export async function deleteChecklistTemplateItems(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, templateId));
}

export async function deleteChecklistTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First delete all items associated with this template
  await deleteChecklistTemplateItems(id);
  
  // Then delete the template itself
  return await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id));
}

export async function getChecklistTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(checklistTemplates)
    .where(eq(checklistTemplates.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllChecklistTemplates() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(checklistTemplates).orderBy(checklistTemplates.name);
}

export async function getChecklistTemplatesByStage(stage: "pre_execution" | "in_progress" | "post_execution") {
  const db = await getDb();
  if (!db) return [];

  const templates = await db
    .select()
    .from(checklistTemplates)
    .where(eq(checklistTemplates.stage, stage));

  // Fetch items for each template
  const templatesWithItems = await Promise.all(
    templates.map(async (template: any) => {
      const items = await db
        .select()
        .from(checklistTemplateItems)
        .where(eq(checklistTemplateItems.templateId, template.id))
        .orderBy(checklistTemplateItems.order);
      return { ...template, items };
    })
  );

  return templatesWithItems;
}

export async function addChecklistTemplateItem(data: {
  templateId: number;
  itemText: string;
  order: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(checklistTemplateItems).values({
    templateId: data.templateId,
    itemText: data.itemText,
    order: data.order,
  });
}

export async function getChecklistTemplateItems(templateId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(checklistTemplateItems)
    .where(eq(checklistTemplateItems.templateId, templateId))
    .orderBy(asc(checklistTemplateItems.order));
}

/**
 * Batch get checklist template items for multiple templates - Optimized version
 * @param templateIds Array of template IDs
 * @returns Map of templateId to items array
 */
export async function getBatchChecklistTemplateItems(templateIds: number[]) {
  const db = await getDb();
  if (!db || templateIds.length === 0) return new Map();

  // Get all items for these templates in one query
  const allItems = await db
    .select()
    .from(checklistTemplateItems)
    .where(inArray(checklistTemplateItems.templateId, templateIds))
    .orderBy(asc(checklistTemplateItems.order));

  // Group items by template ID
  const itemsByTemplate = new Map<number, any[]>();
  for (const item of allItems) {
    const items = itemsByTemplate.get(item.templateId) || [];
    items.push(item);
    itemsByTemplate.set(item.templateId, items);
  }

  return itemsByTemplate;
}

/**
 * Task Checklist Management
 */
export async function createTaskChecklist(data: {
  taskId: number;
  templateId: number;
  stage: "pre_execution" | "in_progress" | "post_execution";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create the task checklist
  const result = await db.insert(taskChecklists).values({
    taskId: data.taskId,
    templateId: data.templateId,
    stage: data.stage,
    status: "not_started",
  });

  const checklistId = result[0].insertId;

  // Get all template items
  const templateItems = await db
    .select()
    .from(checklistTemplateItems)
    .where(eq(checklistTemplateItems.templateId, data.templateId))
    .orderBy(checklistTemplateItems.order);

  // Create checklist item results for each template item
  if (templateItems.length > 0) {
    const itemResults = templateItems.map((item) => ({
      taskChecklistId: checklistId,
      templateItemId: item.id,
      result: "na" as const, // Default to N/A, inspector will update
      photoUrls: null,
    }));

    await db.insert(checklistItemResults).values(itemResults);
  }

  return { insertId: checklistId };
}

export async function getTaskChecklistsByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  const checklists = await db
    .select({
      id: taskChecklists.id,
      taskId: taskChecklists.taskId,
      templateId: taskChecklists.templateId,
      stage: taskChecklists.stage,
      status: taskChecklists.status,
      templateName: checklistTemplates.name,
      allowGeneralComments: checklistTemplates.allowGeneralComments,
      allowPhotos: checklistTemplates.allowPhotos,
      taskName: tasks.name,
      projectName: projects.name,
    })
    .from(taskChecklists)
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(taskChecklists.taskId, taskId));

  // Get items for each checklist
  const result: any[] = [];
  for (const checklist of checklists) {
    const items = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, checklist.templateId));
    result.push({ ...checklist, items });
  }

  return result;
}

export async function getTaskChecklistsByTemplateId(templateId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.templateId, templateId));
}

export async function getTaskChecklistsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  const checklists = await db
    .select({
      id: taskChecklists.id,
      taskId: taskChecklists.taskId,
      templateId: taskChecklists.templateId,
      stage: taskChecklists.stage,
      status: taskChecklists.status,
      inspectedBy: taskChecklists.inspectedBy,
      inspectedAt: taskChecklists.inspectedAt,
      generalComments: taskChecklists.generalComments,
      photoUrls: taskChecklists.photoUrls,
      signature: taskChecklists.signature,
      createdAt: taskChecklists.createdAt,
      updatedAt: taskChecklists.updatedAt,
      projectId: tasks.projectId,
      taskName: tasks.name,
      templateName: checklistTemplates.name,
      allowGeneralComments: checklistTemplates.allowGeneralComments,
      allowPhotos: checklistTemplates.allowPhotos,
    })
    .from(taskChecklists)
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .where(eq(tasks.projectId, projectId));

  // Get items for each checklist
  const result: any[] = [];
  for (const checklist of checklists) {
    const items = await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, checklist.templateId));
    result.push({ ...checklist, items });
  }

  return result;
}

export async function getTaskChecklistById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTaskChecklists() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: taskChecklists.id,
      taskId: taskChecklists.taskId,
      templateId: taskChecklists.templateId,
      stage: taskChecklists.stage,
      status: taskChecklists.status,
      inspectedBy: taskChecklists.inspectedBy,
      inspectedAt: taskChecklists.inspectedAt,
      generalComments: taskChecklists.generalComments,
      photoUrls: taskChecklists.photoUrls,
      signature: taskChecklists.signature,
      createdAt: taskChecklists.createdAt,
      updatedAt: taskChecklists.updatedAt,
      taskName: tasks.name,
      templateName: checklistTemplates.name,
      projectId: tasks.projectId,
      projectName: projects.name,
      inspectorName: users.name,
    })
    .from(taskChecklists)
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .leftJoin(users, eq(taskChecklists.inspectedBy, users.id))
    .orderBy(desc(taskChecklists.createdAt));

  return result;
}

export async function updateTaskChecklist(
  id: number,
  data: Partial<{
    status: "not_started" | "pending_inspection" | "in_progress" | "completed" | "failed";
    inspectedBy: number;
    inspectedAt: Date;
    generalComments: string;
    photoUrls: string;
    signature: string;
    notificationSent: boolean;
    notifiedAt: Date;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.inspectedBy !== undefined) updateData.inspectedBy = data.inspectedBy;
  if (data.inspectedAt !== undefined) updateData.inspectedAt = data.inspectedAt;
  if (data.generalComments !== undefined) updateData.generalComments = data.generalComments;
  if (data.photoUrls !== undefined) updateData.photoUrls = data.photoUrls;
  if (data.signature !== undefined) updateData.signature = data.signature;
  if (data.notificationSent !== undefined) updateData.notificationSent = data.notificationSent;
  if (data.notifiedAt !== undefined) updateData.notifiedAt = data.notifiedAt;

  return await db.update(taskChecklists).set(updateData).where(eq(taskChecklists.id, id));
}

export async function updateTaskChecklistStatus(
  id: number,
  status: "not_started" | "pending_inspection" | "in_progress" | "completed" | "failed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(taskChecklists).set({ status }).where(eq(taskChecklists.id, id));
}

export async function deleteTaskChecklist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First delete related checklist item results
  await db.delete(checklistItemResults).where(eq(checklistItemResults.taskChecklistId, id));
  
  // Then delete the task checklist
  return await db.delete(taskChecklists).where(eq(taskChecklists.id, id));
}

export async function addChecklistItemResult(data: {
  taskChecklistId: number;
  templateItemId: number;
  result: "pass" | "fail" | "na";
  
  photoUrls?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(checklistItemResults).values({
    taskChecklistId: data.taskChecklistId,
    templateItemId: data.templateItemId,
    result: data.result,
    photoUrls: data.photoUrls,
  });
}

export async function getChecklistItemResults(taskChecklistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(checklistItemResults)
    .where(eq(checklistItemResults.taskChecklistId, taskChecklistId));
}

// Alias for consistency
export const saveChecklistItemResult = addChecklistItemResult;

export async function updateChecklistItemResult(
  id: number,
  data: {
    result?: "pass" | "fail" | "na";
    photoUrls?: string;
    comments?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(checklistItemResults)
    .set({
      result: data.result,
      photoUrls: data.photoUrls,
      comments: data.comments,
      updatedAt: new Date(),
    })
    .where(eq(checklistItemResults.id, id));
}

export async function getChecklistItemResultById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(checklistItemResults)
    .where(eq(checklistItemResults.id, id))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Defect Management
 */
export async function createDefect(data: {
  taskId: number;
  checklistItemResultId?: number;
  title: string;
  description?: string;
  photoUrls?: string;
  severity: "low" | "medium" | "high" | "critical";
  reportedBy: number;
  assignedTo?: number;
  // CAR/PAR/NCR specific fields
  type?: "CAR" | "PAR" | "NCR";
  checklistId?: number;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate?: Date;
  ncrLevel?: "major" | "minor";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(defects).values({
    taskId: data.taskId,
    checklistItemResultId: data.checklistItemResultId,
    title: data.title,
    description: data.description,
    photoUrls: data.photoUrls,
    severity: data.severity,
    reportedBy: data.reportedBy,
    assignedTo: data.assignedTo,
    status: "reported",
    // CAR/PAR/NCR fields
    type: data.type || "CAR",
    checklistId: data.checklistId,
    rootCause: data.rootCause,
    correctiveAction: data.correctiveAction,
    preventiveAction: data.preventiveAction,
    dueDate: data.dueDate,
    ncrLevel: data.ncrLevel,
  });
}

export async function getDefectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(defects)
    .where(eq(defects.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getDefectsByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(defects)
    .where(eq(defects.taskId, taskId))
    .orderBy(desc(defects.createdAt));
}

export async function getOpenDefects() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(defects)
    .where(eq(defects.status, "reported"))
    .orderBy(desc(defects.severity));
}

export async function getAllDefects() {
  const db = await getDb();
  if (!db) return [];

  const results = await db
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

// Pagination: Get defects with pagination
export async function getDefectsPaginated(page: number, pageSize: number, filters?: {
  projectId?: number;
  taskId?: number;
  status?: string;
  severity?: string;
  assignedTo?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

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
  // Note: projectId filter requires join with tasks table
  if (filters?.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countQuery = db
    .select({ count: count() })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id));
  
  if (whereClause) {
    countQuery.where(whereClause);
  }
  
  const countResult = await countQuery;
  const total = countResult[0]?.count || 0;

  // Get paginated items
  const itemsQuery = db
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

export async function updateDefect(
  id: number,
  data: Partial<{
    status: "reported" | "analysis" | "in_progress" | "resolved" | "pending_reinspection" | "closed";
    assignedTo: number;
    resolvedBy: number;
    resolvedAt: Date;
    resolutionPhotoUrls: string;
    resolutionComment: string;
    // CAR/PAR/NCR workflow fields
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
  if (data.resolvedBy !== undefined) updateData.resolvedBy = data.resolvedBy;
  if (data.resolvedAt !== undefined) updateData.resolvedAt = data.resolvedAt;
  if (data.resolutionPhotoUrls !== undefined) updateData.resolutionPhotoUrls = data.resolutionPhotoUrls;
  if (data.resolutionComment !== undefined) updateData.resolutionComment = data.resolutionComment;
  // CAR/PAR/NCR fields
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

  return await db.update(defects).set(updateData).where(eq(defects.id, id));
}

/**
 * Task Comments & Collaboration
 */
export async function addTaskComment(data: {
  taskId: number;
  userId: number;
  content: string;
  mentions?: string;
  attachmentUrls?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(taskComments).values({
    taskId: data.taskId,
    userId: data.userId,
    content: data.content,
    mentions: data.mentions,
    attachmentUrls: data.attachmentUrls,
  });
}

export async function getTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.taskId, taskId))
    .orderBy(desc(taskComments.createdAt));
}

export async function addTaskAttachment(data: {
  taskId: number;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(taskAttachments).values(data);
}

export async function getTaskAttachments(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(taskAttachments)
    .where(eq(taskAttachments.taskId, taskId))
    .orderBy(desc(taskAttachments.createdAt));
}

export async function getAttachmentById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(taskAttachments)
    .where(eq(taskAttachments.id, id))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

export async function deleteTaskAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(taskAttachments).where(eq(taskAttachments.id, id));
}

/**
 * Task Followers
 */
export async function followTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(taskFollowers).values({ taskId, userId });
}

export async function unfollowTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(taskFollowers)
    .where(and(eq(taskFollowers.taskId, taskId), eq(taskFollowers.userId, userId)));
}

export async function getTaskFollowers(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(taskFollowers)
    .where(eq(taskFollowers.taskId, taskId));
}

/**
 * Notifications
 */
export async function createNotification(data: {
  userId: number;
  type: "task_assigned" | "task_status_changed" | "task_deadline_approaching" | "task_overdue" | "task_progress_updated" | "task_comment_mention" | "inspection_requested" | "inspection_completed" | "inspection_passed" | "inspection_failed" | "checklist_assigned" | "checklist_reminder" | "reinspection_required" | "defect_assigned" | "defect_created" | "defect_status_changed" | "defect_resolved" | "defect_reinspected" | "defect_deadline_approaching" | "project_member_added" | "project_milestone_reached" | "project_status_changed" | "file_uploaded" | "comment_added" | "dependency_blocked" | "comment_mention" | "task_updated" | "deadline_reminder" | "system_health_warning" | "system_health_critical" | "system_health_info";
  title: string;
  content?: string;
  priority?: "urgent" | "high" | "normal" | "low";
  relatedTaskId?: number;
  relatedProjectId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content,
    priority: data.priority || 'normal',
    relatedTaskId: data.relatedTaskId,
    relatedProjectId: data.relatedProjectId,
    isRead: 0,
  });

  // Return the created notification with ID
  const insertId = (result as any).insertId;
  if (insertId) {
    const created = await db.select().from(notifications).where(eq(notifications.id, Number(insertId))).limit(1);
    return created[0];
  }
  
  return null;
}

export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    
    // Ensure we always return an array, even if result is null/undefined
    return Array.isArray(result) ? result : [];
  } catch (error: unknown) {
    console.error('[getUserNotifications] Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
    return result;
  } catch (error: unknown) {
    console.error('[markNotificationAsRead] Error updating notification:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId));
    return result;
  } catch (error: unknown) {
    console.error('[markAllNotificationsAsRead] Error updating notifications:', error);
    throw error;
  }
}

/**
 * Activity Log
 */
export async function logActivity(data: {
  userId: number;
  projectId?: number;
  taskId?: number;
  defectId?: number;
  action: string;
  details?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Filter out undefined values to avoid "default" keyword issues
  const values: any = {
    userId: data.userId,
    action: data.action,
  };
  
  if (data.projectId !== undefined) values.projectId = data.projectId;
  if (data.taskId !== undefined) values.taskId = data.taskId;
  if (data.defectId !== undefined) values.defectId = data.defectId;
  if (data.details !== undefined) values.details = data.details;

  return await db.insert(activityLog).values(values);
}

export async function getTaskActivityLog(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.taskId, taskId))
    .orderBy(desc(activityLog.createdAt));
}

export async function getDefectActivityLog(defectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.defectId, defectId))
    .orderBy(desc(activityLog.createdAt));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(tasks).where(eq(tasks.id, id));
}

/**
 * Submit Inspection - Complete workflow for QC inspection submission
 * This function:
 * 1. Saves all checklist item results
 * 2. Updates task checklist status
 * 3. Creates defects for failed items
 * 4. Updates task status if needed
 * 5. Sends notifications
 */
export async function submitInspection(data: {
  taskChecklistId: number;
  taskId: number;
  inspectedBy: number;
  itemResults: Array<{
    templateItemId: number;
    itemText: string;
    result: "pass" | "fail" | "na";
    photoUrls?: string; // JSON string of photo URLs for this item
  }>;
  generalComments?: string;
  photoUrls?: string[]; // Array of photo URLs for overall inspection
  signature?: string; // Base64 encoded signature image
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // 1. Save all checklist item results with photos
    const itemResultPromises = data.itemResults.map((item: any) =>
      db.insert(checklistItemResults).values({
        taskChecklistId: data.taskChecklistId,
        templateItemId: item.templateItemId,
        result: item.result,
        photoUrls: item.photoUrls || null,
      })
    );
    const insertedResults = await Promise.all(itemResultPromises);

    // 2. Calculate overall status
    const failedCount = data.itemResults.filter((r) => r.result === "fail").length;
    const passedCount = data.itemResults.filter((r) => r.result === "pass").length;
    const overallStatus = failedCount > 0 ? "failed" : "completed";

    // 3. Update task checklist
    await db.update(taskChecklists).set({
      status: overallStatus,
      inspectedBy: data.inspectedBy,
      inspectedAt: new Date(),
      generalComments: data.generalComments || null,
      photoUrls: data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : null,
      signature: data.signature || null,
    }).where(eq(taskChecklists.id, data.taskChecklistId));

    // 4. Create defects for failed items
    const failedItems = data.itemResults.filter((r) => r.result === "fail");
    if (failedItems.length > 0) {
      // Get the corresponding result IDs
      const defectPromises = failedItems.map(async (item, index: any) => {
        // Find the result ID for this item
        const resultId = insertedResults[data.itemResults.indexOf(item)][0]?.insertId;
        
        return db.insert(defects).values({
          taskId: data.taskId,
          checklistId: data.taskChecklistId, // Fix: Add checklistId for traceability
          checklistItemResultId: resultId,
          title: `ไม่ผ่าน QC: ${item.itemText}`,
          description: `รายการตรวจสอบไม่ผ่าน: ${item.itemText}${data.generalComments ? `\n\nความเห็นเพิ่มเติม: ${data.generalComments}` : ''}`,
          photoUrls: data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : null,
          severity: "medium",
          reportedBy: data.inspectedBy,
          status: "reported",
        });
      });
      await Promise.all(defectPromises);

      // 5. Update task status to rectification_needed if there are failed items
      await db.update(tasks).set({
        status: "rectification_needed",
      }).where(eq(tasks.id, data.taskId));
    }

    // Auto-update task progress based on checklist completion
    const { calculateAndUpdateTaskProgress } = await import("./taskProgressHelper");
    await calculateAndUpdateTaskProgress(data.taskId);

    // 6. Get task details for notifications
    const task = await db.select().from(tasks).where(eq(tasks.id, data.taskId)).limit(1);
    if (task.length === 0) throw new Error("Task not found");

    // 7. Create notifications using notification service
    // Notify task assignee
    if (task[0].assigneeId) {
      await createNotification({
        userId: task[0].assigneeId,
        type: "inspection_completed",
        title: failedCount > 0 ? "การตรวจสอบไม่ผ่าน" : "การตรวจสอบผ่าน",
        content: failedCount > 0
          ? `งาน "${task[0].name}" มีรายการตรวจสอบไม่ผ่าน ${failedCount} รายการ กรุณาแก้ไข`
          : `งาน "${task[0].name}" ผ่านการตรวจสอบคุณภาพแล้ว`,
        relatedTaskId: data.taskId,
        relatedProjectId: task[0].projectId,
      });
    }

    // Notify project manager if there are failed items
    if (failedCount > 0 && task[0].projectId) {
      // Get project members with PM role
      const pmMembersTable = projectMembers;
      const pmMembers = await db
        .select()
        .from(pmMembersTable)
        .where(and(
          eq(pmMembersTable.projectId, task[0].projectId),
          eq(pmMembersTable.role, "project_manager")
        ));

      for (const pm of pmMembers) {
        await createNotification({
          userId: pm.userId,
          type: "inspection_completed",
          title: "การตรวจสอบไม่ผ่าน",
          content: `งาน "${task[0].name}" มีรายการตรวจสอบไม่ผ่าน ${failedCount} รายการ`,
          relatedTaskId: data.taskId,
          relatedProjectId: task[0].projectId,
        });
      }
    }

    // 8. Log activity
    await logActivity({
      userId: data.inspectedBy,
      projectId: task[0].projectId,
      taskId: data.taskId,
      action: "inspection_completed",
      details: `ผลการตรวจสอบ: ผ่าน ${passedCount} รายการ, ไม่ผ่าน ${failedCount} รายการ`,
    });

    return {
      success: true,
      overallStatus,
      passedCount,
      failedCount,
      defectsCreated: failedItems.length,
    };
  } catch (error: unknown) {
    console.error("[Database] Failed to submit inspection:", error);
    throw error;
  }
}



/**
 * Task Dependencies Management (Additional Functions)
 */
export async function getTaskDependencies(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  const deps = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, taskId));

  return deps;
}

export async function getTaskDependents(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get tasks that depend on this task
  const deps = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.dependsOnTaskId, taskId));

  return deps;
}

export async function removeTaskDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(taskDependencies)
    .where(
      and(
        eq(taskDependencies.taskId, taskId),
        eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
      )
    );

  return { success: true };
}

export async function getAllTaskDependenciesForProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all tasks in project
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const taskIds = projectTasks.map(t => t.id);

  if (taskIds.length === 0) return [];

  // Get all dependencies for these tasks
  const deps = await db
    .select()
    .from(taskDependencies)
    .where(inArray(taskDependencies.taskId, taskIds));

  return deps;
}

/**
 * Category Colors Management
 */
export async function getCategoryColorsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  const colors = await db
    .select()
    .from(categoryColors)
    .where(eq(categoryColors.projectId, projectId));

  return colors;
}

export async function updateCategoryColor(
  projectId: number,
  category: "preparation" | "structure" | "architecture" | "mep" | "other",
  color: string
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(categoryColors)
    .set({ color, updatedAt: new Date() })
    .where(
      and(
        eq(categoryColors.projectId, projectId),
        eq(categoryColors.category, category)
      )
    );
}

export async function initializeCategoryColors(projectId: number) {
  const db = await getDb();
  if (!db) return;

  const defaultColors = [
    { projectId, category: "preparation" as const, color: "#10B981" },
    { projectId, category: "structure" as const, color: "#3B82F6" },
    { projectId, category: "architecture" as const, color: "#8B5CF6" },
    { projectId, category: "mep" as const, color: "#F59E0B" },
    { projectId, category: "other" as const, color: "#6B7280" },
  ];

  await db.insert(categoryColors).values(defaultColors);
}

/**
 * Get defects by type (CAR/PAR/NCR)
 */
export async function getDefectsByType(type: "CAR" | "PAR" | "NCR") {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(defects)
    .where(eq(defects.type, type))
    .orderBy(desc(defects.createdAt));
}

/**
 * Get defects by checklist
 */
export async function getDefectsByChecklist(checklistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(defects)
    .where(eq(defects.checklistId, checklistId))
    .orderBy(desc(defects.createdAt));
}

/**
 * Get defects by status
 */
export async function getDefectsByStatus(
  status: "reported" | "analysis" | "in_progress" | "resolved" | "closed"
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(defects)
    .where(eq(defects.status, status))
    .orderBy(desc(defects.createdAt));
}

/**
 * Create checklist result (for individual inspection item)
 */
export async function createChecklistResult(data: {
  checklistId: number;
  itemId: number;
  result: "pass" | "fail" | "na";
  comment?: string;
  photoUrls?: string;
  inspectedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(checklistItemResults).values({
    taskChecklistId: data.checklistId,
    templateItemId: data.itemId,
    result: data.result,
    comments: data.comment,
    photoUrls: data.photoUrls,
    inspectedBy: data.inspectedBy,
  });
}

/**
 * Get checklist results by checklist ID
 */
export async function getChecklistResults(checklistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(checklistItemResults)
    .where(eq(checklistItemResults.taskChecklistId, checklistId))
    .orderBy(checklistItemResults.templateItemId);
}


// ===== Defect Attachments Functions =====

export async function createDefectAttachment(attachment: InsertDefectAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(defectAttachments).values(attachment);
  return result.insertId;
}

export async function getDefectAttachments(defectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(defectAttachments)
    .where(eq(defectAttachments.defectId, defectId))
    .orderBy(defectAttachments.uploadedAt);
}

export async function getDefectAttachmentsByType(defectId: number, type: "before" | "after" | "supporting") {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(defectAttachments)
    .where(
      and(
        eq(defectAttachments.defectId, defectId),
        eq(defectAttachments.attachmentType, type)
      )
    )
    .orderBy(defectAttachments.uploadedAt);
}

export async function deleteDefectAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(defectAttachments).where(eq(defectAttachments.id, id));
}

export async function deleteDefect(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related attachments first
  await db.delete(defectAttachments).where(eq(defectAttachments.defectId, id));
  
  // Delete the defect
  await db.delete(defects).where(eq(defects.id, id));
}

// ===== Defect Dashboard Statistics =====

/**
 * Get defect statistics by status
 */
export async function getDefectStatsByStatus() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db
      .select({
        status: defects.status,
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(defects)
      .groupBy(defects.status);
    
    return Array.isArray(result) ? result : [];
  } catch (error: unknown) {
    console.error('[getDefectStatsByStatus] Error:', error);
    return [];
  }
}

/**
 * Get defect statistics by type (CAR/NCR/PAR)
 */
export async function getDefectStatsByType() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db
      .select({
        type: defects.type,
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(defects)
      .groupBy(defects.type);
    
    return Array.isArray(result) ? result : [];
  } catch (error: unknown) {
    console.error('[getDefectStatsByType] Error:', error);
    return [];
  }
}

/**
 * Get defect statistics by priority
 */
export async function getDefectStatsByPriority() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[getDefectStatsByPriority] Database not available');
      return [];
    }
    
    const result = await db
      .select({
        priority: defects.severity,
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(defects)
      .groupBy(defects.severity);
    
    return Array.isArray(result) ? result : [];
  } catch (error: unknown) {
    console.error('[getDefectStatsByPriority] Error:', error);
    return [];
  }
}

/**
 * Get defect counts for key metrics
 */
export async function getDefectMetrics() {
  const db = await getDb();
  if (!db) return {
    total: 0,
    open: 0,
    closed: 0,
    pendingVerification: 0,
    overdue: 0
  };
  
  try {
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(defects);
    
    const [openResult] = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(defects)
      .where(sql`${defects.status} IN ('reported', 'analysis', 'in_progress')`);
    
    const [closedResult] = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(defects)
      .where(eq(defects.status, 'closed'));
    
    const [resolvedResult] = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(defects)
      .where(eq(defects.status, 'resolved'));
    
    const [overdueResult] = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(defects)
      .where(
        and(
          sql`${defects.dueDate} IS NOT NULL`,
          sql`${defects.dueDate} < NOW()`,
          sql`${defects.status} != 'closed'`
        )
      );
    
    return {
      total: totalResult?.count || 0,
      open: openResult?.count || 0,
      closed: closedResult?.count || 0,
      pendingVerification: resolvedResult?.count || 0,
      overdue: overdueResult?.count || 0
    };
  } catch (error: unknown) {
    console.error('[getDefectMetrics] Error:', error);
    return {
      total: 0,
      open: 0,
      closed: 0,
      pendingVerification: 0,
      overdue: 0
    };
  }
}

/**
 * Get recent defects (last 10)
 */
export async function getRecentDefects(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(defects)
    .orderBy(desc(defects.createdAt))
    .limit(limit);
}


/**
 * Archive Rules Management
 */
export async function getArchiveRules() {
  const db = await getDb();
  if (!db) return [];
  
  const { archiveRules } = await import("../drizzle/schema");
  return await db.select().from(archiveRules).orderBy(archiveRules.createdAt);
}

export async function createArchiveRule(data: {
  name: string;
  description?: string;
  projectStatus?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  daysAfterCompletion?: number;
  daysAfterEndDate?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archiveRules } = await import("../drizzle/schema");
  const result = await db.insert(archiveRules).values(data);
  return result;
}

export async function updateArchiveRule(
  id: number,
  data: {
    name?: string;
    description?: string;
    enabled?: boolean;
    projectStatus?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
    daysAfterCompletion?: number;
    daysAfterEndDate?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archiveRules } = await import("../drizzle/schema");
  const updateData: any = { ...data };
  if (data.enabled !== undefined) {
    updateData.enabled = data.enabled ? 1 : 0;
  }
  await db.update(archiveRules).set(updateData).where(eq(archiveRules.id, id));
}

export async function deleteArchiveRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archiveRules } = await import("../drizzle/schema");
  await db.delete(archiveRules).where(eq(archiveRules.id, id));
}

/**
 * Archive History Management
 */
export async function logArchiveHistory(data: {
  projectId: number;
  action: "archived" | "unarchived";
  performedBy: number;
  reason?: string;
  ruleId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archiveHistory } = await import("../drizzle/schema");
  await db.insert(archiveHistory).values({
    ...data,
    performedAt: new Date(),
  });
}

export async function getArchiveHistory(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { archiveHistory, users } = await import("../drizzle/schema");
  return await db
    .select({
      id: archiveHistory.id,
      action: archiveHistory.action,
      reason: archiveHistory.reason,
      performedAt: archiveHistory.performedAt,
      performedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(archiveHistory)
    .leftJoin(users, eq(archiveHistory.performedBy, users.id))
    .where(eq(archiveHistory.projectId, projectId))
    .orderBy(desc(archiveHistory.performedAt));
}

/**
 * Defect Inspections Management
 */
export async function createDefectInspection(data: InsertDefectInspection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(defectInspections).values(data);
  return result;
}

export async function getDefectInspections(defectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: defectInspections.id,
      defectId: defectInspections.defectId,
      inspectionType: defectInspections.inspectionType,
      result: defectInspections.result,
      comments: defectInspections.comments,
      photoUrls: defectInspections.photoUrls,
      inspectedAt: defectInspections.inspectedAt,
      inspector: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(defectInspections)
    .leftJoin(users, eq(defectInspections.inspectorId, users.id))
    .where(eq(defectInspections.defectId, defectId))
    .orderBy(desc(defectInspections.inspectedAt));
}

export async function getLatestInspection(defectId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      id: defectInspections.id,
      defectId: defectInspections.defectId,
      inspectionType: defectInspections.inspectionType,
      result: defectInspections.result,
      comments: defectInspections.comments,
      photoUrls: defectInspections.photoUrls,
      inspectedAt: defectInspections.inspectedAt,
      inspector: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(defectInspections)
    .leftJoin(users, eq(defectInspections.inspectorId, users.id))
    .where(eq(defectInspections.defectId, defectId))
    .orderBy(desc(defectInspections.inspectedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}



// ==================== Signature Functions ====================

export async function createSignature(data: {
  checklistId: number;
  signatureData: string;
  signedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(signatures).values({
    checklistId: data.checklistId,
    signatureData: data.signatureData,
    signedBy: data.signedBy,
    signedAt: new Date(),
  });

  const insertId = (result as any).insertId || (result as any)[0]?.insertId || 0;

  return {
    id: Number(insertId),
    ...data,
    signedAt: new Date(),
  };
}

export async function getSignaturesByChecklistId(checklistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: signatures.id,
      checklistId: signatures.checklistId,
      signatureData: signatures.signatureData,
      signedAt: signatures.signedAt,
      signer: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(signatures)
    .leftJoin(users, eq(signatures.signedBy, users.id))
    .where(eq(signatures.checklistId, checklistId));
}

/**
 * Inspection Requests Management
 */
export async function createInspectionRequest(data: {
  taskId: number;
  requestedBy: number;
  inspectorId?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    sql`INSERT INTO inspectionRequests (taskId, requestedBy, inspectorId, notes) 
        VALUES (${data.taskId}, ${data.requestedBy}, ${data.inspectorId || null}, ${data.notes || null})`
  );

  return { id: Number((result as any).insertId) };
}

export async function getInspectionRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.execute(
    sql`SELECT ir.*, 
        u1.name as requesterName, u1.email as requesterEmail,
        u2.name as inspectorName, u2.email as inspectorEmail,
        u3.name as approverName, u3.email as approverEmail,
        t.name as taskName, t.projectId
        FROM inspectionRequests ir
        LEFT JOIN users u1 ON ir.requestedBy = u1.id
        LEFT JOIN users u2 ON ir.inspectorId = u2.id
        LEFT JOIN users u3 ON ir.approvedBy = u3.id
        LEFT JOIN tasks t ON ir.taskId = t.id
        WHERE ir.id = ${id}`
  );

  return (results as any).rows[0] || null;
}

export async function getInspectionRequestsByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.execute(
    sql`SELECT ir.*, 
        u1.name as requesterName,
        u2.name as inspectorName,
        u3.name as approverName
        FROM inspectionRequests ir
        LEFT JOIN users u1 ON ir.requestedBy = u1.id
        LEFT JOIN users u2 ON ir.inspectorId = u2.id
        LEFT JOIN users u3 ON ir.approvedBy = u3.id
        WHERE ir.taskId = ${taskId}
        ORDER BY ir.createdAt DESC`
  );

  return (results as any).rows;
}

export async function getInspectionRequestsByInspector(inspectorId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.execute(
    sql`SELECT ir.*, 
        u1.name as requesterName,
        t.name as taskName, t.projectId,
        p.name as projectName
        FROM inspectionRequests ir
        LEFT JOIN users u1 ON ir.requestedBy = u1.id
        LEFT JOIN tasks t ON ir.taskId = t.id
        LEFT JOIN projects p ON t.projectId = p.id
        WHERE ir.inspectorId = ${inspectorId}
        ORDER BY ir.createdAt DESC`
  );

  return (results as any).rows;
}

export async function getAllInspectionRequests() {
  const db = await getDb();
  if (!db) return [];

  const results = await db.execute(
    sql`SELECT ir.*, 
        u1.name as requesterName,
        u2.name as inspectorName,
        t.name as taskName, t.projectId,
        p.name as projectName
        FROM inspectionRequests ir
        LEFT JOIN users u1 ON ir.requestedBy = u1.id
        LEFT JOIN users u2 ON ir.inspectorId = u2.id
        LEFT JOIN tasks t ON ir.taskId = t.id
        LEFT JOIN projects p ON t.projectId = p.id
        ORDER BY ir.createdAt DESC`
  );

  return (results as any).rows;
}

export async function approveInspectionRequest(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE inspectionRequests 
        SET status = 'approved', approvedBy = ${approvedBy}, approvedAt = NOW()
        WHERE id = ${id}`
  );

  return { success: true };
}

export async function rejectInspectionRequest(id: number, approvedBy: number, rejectedReason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE inspectionRequests 
        SET status = 'rejected', approvedBy = ${approvedBy}, approvedAt = NOW(), rejectedReason = ${rejectedReason}
        WHERE id = ${id}`
  );

  return { success: true };
}

export async function completeInspectionRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE inspectionRequests 
        SET status = 'completed'
        WHERE id = ${id}`
  );

  return { success: true };
}

/**
 * Database Monitoring Functions
 */

// Log query execution
export async function logQuery(log: InsertQueryLog) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(queryLogs).values(log);
  } catch (error: unknown) {
    console.error("[Database] Failed to log query:", error);
  }
}

// Get slow queries (execution time > threshold in ms)
export async function getSlowQueries(thresholdMs: number = 1000, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(queryLogs)
      .where(gte(queryLogs.executionTime, thresholdMs))
      .orderBy(desc(queryLogs.executionTime))
      .limit(limit);
  } catch (error: unknown) {
    console.error("[Database] Failed to get slow queries:", error);
    return [];
  }
}

// Get query statistics by table
export async function getQueryStatsByTable(tableName?: string, hours: number = 24) {
  const db = await getDb();
  if (!db) return [];

  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const conditions = [gte(queryLogs.createdAt, since)];
    if (tableName) {
      conditions.push(eq(queryLogs.tableName, tableName));
    }

    return await db
      .select({
        tableName: queryLogs.tableName,
        operationType: queryLogs.operationType,
        count: sql<number>`COUNT(*)`,
        avgTime: sql<number>`AVG(${queryLogs.executionTime})`,
        maxTime: sql<number>`MAX(${queryLogs.executionTime})`,
        minTime: sql<number>`MIN(${queryLogs.executionTime})`,
      })
      .from(queryLogs)
      .where(and(...conditions))
      .groupBy(queryLogs.tableName, queryLogs.operationType)
      .orderBy(desc(sql`COUNT(*)`));
  } catch (error: unknown) {
    console.error("[Database] Failed to get query stats:", error);
    return [];
  }
}

// Save database statistics snapshot
export async function saveDbStatistics(stats: InsertDbStatistic) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(dbStatistics).values(stats);
  } catch (error: unknown) {
    console.error("[Database] Failed to save statistics:", error);
  }
}

// Get latest database statistics for all tables
export async function getLatestDbStatistics() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get the latest snapshot for each table
    const latestStats = await db
      .select({
        tableName: dbStatistics.tableName,
        rowCount: dbStatistics.rowCount,
        dataSize: dbStatistics.dataSize,
        indexSize: dbStatistics.indexSize,
        avgQueryTime: dbStatistics.avgQueryTime,
        queryCount: dbStatistics.queryCount,
        createdAt: dbStatistics.createdAt,
      })
      .from(dbStatistics)
      .orderBy(desc(dbStatistics.createdAt));

    // Group by table name and get only the latest
    const grouped = new Map();
    for (const stat of latestStats) {
      if (!grouped.has(stat.tableName)) {
        grouped.set(stat.tableName, stat);
      }
    }

    return Array.from(grouped.values());
  } catch (error: unknown) {
    console.error("[Database] Failed to get latest statistics:", error);
    return [];
  }
}

// Get database statistics history for a specific table
export async function getDbStatisticsHistory(tableName: string, days: number = 7) {
  const db = await getDb();
  if (!db) return [];

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(dbStatistics)
      .where(and(
        eq(dbStatistics.tableName, tableName),
        gte(dbStatistics.createdAt, since)
      ))
      .orderBy(desc(dbStatistics.createdAt));
  } catch (error: unknown) {
    console.error("[Database] Failed to get statistics history:", error);
    return [];
  }
}

// Collect current database statistics from information_schema
export async function collectCurrentDbStatistics() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        table_name as tableName,
        table_rows as rowCount,
        data_length as dataSize,
        index_length as indexSize
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
      ORDER BY data_length DESC
    `);

    return result as unknown as Array<{
      tableName: string;
      rowCount: number;
      dataSize: number;
      indexSize: number;
    }>;
  } catch (error: unknown) {
    console.error("[Database] Failed to collect current statistics:", error);
    return [];
  }
}

// Get query error logs
export async function getQueryErrors(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(queryLogs)
      .where(isNotNull(queryLogs.errorMessage))
      .orderBy(desc(queryLogs.createdAt))
      .limit(limit);
  } catch (error: unknown) {
    console.error("[Database] Failed to get query errors:", error);
    return [];
  }
}

/**
 * Bulk Actions for Tasks
 */

// Bulk update task status
export async function bulkUpdateTaskStatus(taskIds: number[], status: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Update all tasks
    await db
      .update(tasks)
      .set({ 
        status: status as any,
        updatedAt: new Date()
      })
      .where(inArray(tasks.id, taskIds));

    // Create activity log for each task
    const activityPromises = taskIds.map(taskId => 
      logActivity({
        taskId,
        userId,
        action: "status_changed",
        details: `สถานะถูกเปลี่ยนเป็น ${status} (Bulk Action)`,
      })
    );

    await Promise.all(activityPromises);

    return { success: true, updatedCount: taskIds.length };
  } catch (error: unknown) {
    console.error("[Database] Failed to bulk update task status:", error);
    throw error;
  }
}

// Bulk update task assignee
export async function bulkUpdateTaskAssignee(taskIds: number[], assigneeId: number | null, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get assignee name if provided
    let assigneeName = "ไม่มีผู้รับผิดชอบ";
    if (assigneeId) {
      const assignee = await getUserById(assigneeId);
      assigneeName = assignee?.name || `User #${assigneeId}`;
    }

    // Update all tasks
    await db
      .update(tasks)
      .set({ 
        assigneeId: assigneeId,
        updatedAt: new Date()
      })
      .where(inArray(tasks.id, taskIds));

    // Create activity log for each task
    const activityPromises = taskIds.map(taskId => 
      logActivity({
        taskId,
        userId,
        action: "assignee_changed",
        details: `ผู้รับผิดชอบถูกเปลี่ยนเป็น ${assigneeName} (Bulk Action)`,
      })
    );

    await Promise.all(activityPromises);

    // Send notifications to new assignee
    if (assigneeId) {
      const notificationPromises = taskIds.map(async (taskId) => {
        const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
        if (task.length > 0) {
          await sendNotification({
            userId: assigneeId,
            type: "task_assigned",
            title: "งานใหม่ถูกมอบหมายให้คุณ",
            content: `คุณได้รับมอบหมายงาน: ${task[0].name}`,
            relatedTaskId: taskId,
            relatedProjectId: task[0].projectId,
          });
        }
      });

      await Promise.all(notificationPromises);
    }

    return { success: true, updatedCount: taskIds.length };
  } catch (error: unknown) {
    console.error("[Database] Failed to bulk update task assignee:", error);
    throw error;
  }
}

// Bulk delete tasks
export async function bulkDeleteTasks(taskIds: number[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Delete related data first
    await db.delete(taskDependencies).where(inArray(taskDependencies.taskId, taskIds));
    await db.delete(taskDependencies).where(inArray(taskDependencies.dependsOnTaskId, taskIds));
    await db.delete(taskChecklists).where(inArray(taskChecklists.taskId, taskIds));
    await db.delete(taskComments).where(inArray(taskComments.taskId, taskIds));
    await db.delete(taskAttachments).where(inArray(taskAttachments.taskId, taskIds));
    await db.delete(taskFollowers).where(inArray(taskFollowers.taskId, taskIds));
    await db.delete(activityLog).where(inArray(activityLog.taskId, taskIds));
    await db.delete(notifications).where(inArray(notifications.relatedTaskId, taskIds));
    await db.delete(defects).where(inArray(defects.taskId, taskIds));

    // Delete tasks
    await db.delete(tasks).where(inArray(tasks.id, taskIds));

    return { success: true, deletedCount: taskIds.length };
  } catch (error: unknown) {
    console.error("[Database] Failed to bulk delete tasks:", error);
    throw error;
  }
}

/**
 * Task Dependency Validation
 */

// Check if task has incomplete dependencies (blocking dependencies)
export async function getBlockingDependencies(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const dependencies = await db
      .select({
        id: taskDependencies.id,
        dependsOnTaskId: taskDependencies.dependsOnTaskId,
        type: taskDependencies.type,
        taskName: tasks.name,
        taskStatus: tasks.status,
        taskProgress: tasks.progress,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
      .where(eq(taskDependencies.taskId, taskId));

    // Filter only incomplete dependencies
    const blocking = dependencies.filter(dep => {
      if (dep.type === "finish_to_start" || dep.type === "finish_to_finish") {
        // Task must be completed (progress = 100)
        return dep.taskProgress !== 100;
      } else if (dep.type === "start_to_start") {
        // Task must be started (status not "not_started" or "todo")
        return dep.taskStatus === "not_started" || dep.taskStatus === "todo";
      }
      return false;
    });

    return blocking;
  } catch (error: unknown) {
    console.error("[Database] Failed to get blocking dependencies:", error);
    return [];
  }
}

// Validate if task can start based on dependencies
export async function validateTaskCanStart(taskId: number) {
  const blocking = await getBlockingDependencies(taskId);
  
  return {
    canStart: blocking.length === 0,
    blockingCount: blocking.length,
    blockingTasks: blocking,
  };
}

// Update task priority
export async function updateTaskPriority(taskId: number, priority: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(tasks)
      .set({ 
        priority: priority as any,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    // Create activity log
    const priorityLabels: Record<string, string> = {
      low: "ต่ำ",
      medium: "ปานกลาง",
      high: "สูง",
      urgent: "เร่งด่วน"
    };

    await logActivity({
      taskId,
      userId,
      action: "updated",
      details: `เปลี่ยนระดับความสำคัญเป็น: ${priorityLabels[priority] || priority}`,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("[Database] Failed to update task priority:", error);
    throw error;
  }
}

// Update task category
export async function updateTaskCategory(taskId: number, category: string | null, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(tasks)
      .set({ 
        category: category,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    // Create activity log
    await logActivity({
      taskId,
      userId,
      action: "updated",
      details: `เปลี่ยนหมวดหมู่เป็น: ${category || "ไม่มีหมวดหมู่"}`,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("[Database] Failed to update task category:", error);
    throw error;
  }
}

// Get tasks that depend on a specific task (for notifications)
export async function getTasksDependingOn(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const dependentTasks = await db
      .select({
        taskId: taskDependencies.taskId,
        taskName: tasks.name,
        assigneeId: tasks.assigneeId,
        projectId: tasks.projectId,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(taskDependencies.taskId, tasks.id))
      .where(eq(taskDependencies.dependsOnTaskId, taskId));

    return dependentTasks;
  } catch (error: unknown) {
    console.error("[Database] Failed to get dependent tasks:", error);
    return [];
  }
}

// ============================================
// Memory Monitoring Functions
// ============================================

/**
 * บันทึก memory usage log
 */
export async function createMemoryLog(data: {
  totalMemoryMB: number;
  usedMemoryMB: number;
  freeMemoryMB: number;
  usagePercentage: number;
  buffersCacheMB?: number;
  availableMemoryMB?: number;
  swapTotalMB?: number;
  swapUsedMB?: number;
  swapFreePercentage?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db
      .insert(memoryLogs)
      .values({
        totalMemoryMb: data.totalMemoryMB,
        usedMemoryMb: data.usedMemoryMB,
        freeMemoryMb: data.freeMemoryMB,
        usagePercentage: data.usagePercentage,
        buffersCacheMb: data.buffersCacheMB,
        availableMemoryMb: data.availableMemoryMB,
        swapTotalMb: data.swapTotalMB,
        swapUsedMb: data.swapUsedMB,
        swapFreePercentage: data.swapFreePercentage,
        timestamp: new Date(),
        createdAt: new Date(),
      });

    return { success: true, id: result.insertId };
  } catch (error: unknown) {
    console.error("[Database] Failed to create memory log:", error);
    throw error;
  }
}

/**
 * ดึงข้อมูล memory logs ตามช่วงเวลา
 */
export async function getMemoryLogs(params: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(memoryLogs);

    if (params.startDate) {
      query = query.where(gte(memoryLogs.timestamp, params.startDate)) as any;
    }
    if (params.endDate) {
      query = query.where(lte(memoryLogs.timestamp, params.endDate)) as any;
    }

    query = query.orderBy(desc(memoryLogs.timestamp)) as any;

    if (params.limit) {
      query = query.limit(params.limit) as any;
    }

    const logs = await query;
    return logs;
  } catch (error: unknown) {
    console.error("[Database] Failed to get memory logs:", error);
    return [];
  }
}

/**
 * คำนวณ memory statistics
 */
export async function getMemoryStatistics(params: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const logs = await getMemoryLogs({
      startDate: params.startDate,
      endDate: params.endDate,
      limit: 1000, // จำกัดไม่เกิน 1000 records
    });

    if (logs.length === 0) return null;

    const usagePercentages = logs.map(log => log.usagePercentage);
    const avgUsage = Math.round(usagePercentages.reduce((a: any, b: any) => a + b, 0) / usagePercentages.length);
    const maxUsage = Math.max(...usagePercentages);
    const minUsage = Math.min(...usagePercentages);

    // หา peak times (ช่วงเวลาที่ใช้ memory สูง)
    const highUsageLogs = logs.filter(log => log.usagePercentage >= 70);
    const peakTimes = highUsageLogs.map(log => ({
      timestamp: log.timestamp,
      usage: log.usagePercentage,
    }));

    return {
      avgUsage,
      maxUsage,
      minUsage,
      totalLogs: logs.length,
      peakTimes: peakTimes.slice(0, 10), // แสดงแค่ 10 peak times แรก
      latestLog: logs[0],
    };
  } catch (error: unknown) {
    console.error("[Database] Failed to get memory statistics:", error);
    return null;
  }
}

/**
 * บันทึก OOM event
 */
export async function createOomEvent(data: {
  processName?: string;
  processId?: number;
  killedProcessName?: string;
  killedProcessId?: number;
  memoryUsedMB?: number;
  severity?: "low" | "medium" | "high" | "critical";
  logMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db
      .insert(oomEvents)
      .values({
        ...data,
        timestamp: new Date(),
        resolved: false,
        createdAt: new Date(),
      });

    return { success: true, id: result.insertId };
  } catch (error: unknown) {
    console.error("[Database] Failed to create OOM event:", error);
    throw error;
  }
}

/**
 * ดึงข้อมูล OOM events
 */
export async function getOomEvents(params: {
  resolved?: boolean;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(oomEvents);

    if (params.resolved !== undefined) {
      query = query.where(eq(oomEvents.resolved, params.resolved)) as any;
    }
    if (params.severity) {
      query = query.where(eq(oomEvents.severity, params.severity as any)) as any;
    }
    if (params.startDate) {
      query = query.where(gte(oomEvents.timestamp, params.startDate)) as any;
    }
    if (params.endDate) {
      query = query.where(lte(oomEvents.timestamp, params.endDate)) as any;
    }

    query = query.orderBy(desc(oomEvents.timestamp)) as any;

    if (params.limit) {
      query = query.limit(params.limit) as any;
    }

    const events = await query;
    return events;
  } catch (error: unknown) {
    console.error("[Database] Failed to get OOM events:", error);
    return [];
  }
}

/**
 * อัพเดทสถานะ OOM event เป็น resolved
 */
export async function resolveOomEvent(eventId: number, userId: number, resolutionNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(oomEvents)
      .set({
        resolved: 1,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes,
      })
      .where(eq(oomEvents.id, eventId));

    return { success: true };
  } catch (error: unknown) {
    console.error("[Database] Failed to resolve OOM event:", error);
    throw error;
  }
}

/**
 * นับจำนวน OOM events ตาม severity
 */
export async function getOomEventStatistics() {
  const db = await getDb();
  if (!db) return null;

  try {
    const allEvents = await db.select().from(oomEvents);
    const unresolvedEvents = allEvents.filter(e => !e.resolved);

    const bySeverity = {
      low: unresolvedEvents.filter(e => e.severity === "low").length,
      medium: unresolvedEvents.filter(e => e.severity === "medium").length,
      high: unresolvedEvents.filter(e => e.severity === "high").length,
      critical: unresolvedEvents.filter(e => e.severity === "critical").length,
    };

    return {
      total: allEvents.length,
      unresolved: unresolvedEvents.length,
      resolved: allEvents.length - unresolvedEvents.length,
      bySeverity,
    };
  } catch (error: unknown) {
    console.error("[Database] Failed to get OOM event statistics:", error);
    return null;
  }
}

// ============================================================================
// Push Subscriptions
// ============================================================================

/**
 * สร้าง push subscription ใหม่
 */
export async function createPushSubscription(subscription: InsertPushSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, subscription.userId),
          eq(pushSubscriptions.endpoint, subscription.endpoint)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256Dh: subscription.p256Dh,
          auth: subscription.auth,
          userAgent: subscription.userAgent,
          lastUsedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing[0].id));

      return existing[0];
    }

    // Create new subscription
    const result = await db.insert(pushSubscriptions).values(subscription);
    return { id: Number(result[0].insertId), ...subscription };
  } catch (error: unknown) {
    console.error("[Database] Failed to create push subscription:", error);
    throw error;
  }
}

/**
 * ดึง push subscriptions ของ user
 */
export async function getPushSubscriptionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  } catch (error: unknown) {
    console.error("[Database] Failed to get push subscriptions:", error);
    return [];
  }
}

/**
 * ลบ push subscription
 */
export async function deletePushSubscription(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
    return { success: true };
  } catch (error: unknown) {
    console.error("[Database] Failed to delete push subscription:", error);
    throw error;
  }
}

/**
 * ลบ push subscription โดย endpoint
 */
export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    return { success: true };
  } catch (error: unknown) {
    console.error("[Database] Failed to delete push subscription by endpoint:", error);
    throw error;
  }
}

/**
 * Re-inspection Management
 */

/**
 * Create a re-inspection from a failed inspection
 * Copies the checklist assignment and marks it as a re-inspection
 */
export async function createReinspection(originalChecklistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the original checklist
  const original = await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.id, originalChecklistId))
    .limit(1);

  if (original.length === 0) {
    throw new Error("Original checklist not found");
  }

  const originalChecklist = original[0];

  // Only allow re-inspection for failed checklists
  if (originalChecklist.status !== "failed") {
    throw new Error("Can only create re-inspection for failed checklists");
  }

  // Increment the re-inspection count of the original
  await db
    .update(taskChecklists)
    .set({
      reinspectionCount: (originalChecklist.reinspectionCount || 0) + 1,
    })
    .where(eq(taskChecklists.id, originalChecklistId));

  // Create new checklist entry for re-inspection
  const result = await db.insert(taskChecklists).values({
    taskId: originalChecklist.taskId,
    templateId: originalChecklist.templateId,
    stage: originalChecklist.stage,
    status: "not_started",
    originalInspectionId: originalChecklistId,
    reinspectionCount: 0,
  });

  return {
    success: true,
    reinspectionId: result[0].insertId,
  };
}

/**
 * Get re-inspection history for a checklist
 */
export async function getReinspectionHistory(checklistId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all re-inspections that reference this checklist
  const reinspections = await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.originalInspectionId, checklistId))
    .orderBy(taskChecklists.createdAt);

  return reinspections;
}

/**
 * Get the original inspection for a re-inspection
 */
export async function getOriginalInspection(reinspectionId: number) {
  const db = await getDb();
  if (!db) return null;

  const reinspection = await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.id, reinspectionId))
    .limit(1);

  if (reinspection.length === 0 || !reinspection[0].originalInspectionId) {
    return null;
  }

  const original = await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.id, reinspection[0].originalInspectionId))
    .limit(1);

  return original.length > 0 ? original[0] : null;
}

/**
 * Get inspection history for a task
 * Returns all inspections (checklists) for a specific task with template and inspector info
 */
export async function getInspectionHistoryByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  const inspections = await db
    .select({
      id: taskChecklists.id,
      taskId: taskChecklists.taskId,
      templateId: taskChecklists.templateId,
      templateName: checklistTemplates.name,
      stage: taskChecklists.stage,
      status: taskChecklists.status,
      inspectedBy: taskChecklists.inspectedBy,
      inspectorName: users.name,
      inspectedAt: taskChecklists.inspectedAt,
      generalComments: taskChecklists.generalComments,
      photoUrls: taskChecklists.photoUrls,
      originalInspectionId: taskChecklists.originalInspectionId,
      reinspectionCount: taskChecklists.reinspectionCount,
      createdAt: taskChecklists.createdAt,
    })
    .from(taskChecklists)
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .leftJoin(users, eq(taskChecklists.inspectedBy, users.id))
    .where(eq(taskChecklists.taskId, taskId))
    .orderBy(desc(taskChecklists.createdAt));

  return inspections;
}

/**
 * Get detailed inspection results
 * Returns inspection info with all item results, pass/fail counts, and defects
 */
export async function getInspectionDetail(inspectionId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get inspection basic info with task and project details
  const inspectionRows = await db
    .select()
    .from(taskChecklists)
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .leftJoin(users, eq(taskChecklists.inspectedBy, users.id))
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(taskChecklists.id, inspectionId))
    .limit(1);

  if (inspectionRows.length === 0) return null;

  const row = inspectionRows[0];
  const inspection = {
    id: row.taskChecklists.id,
    taskId: row.taskChecklists.taskId,
    taskName: row.tasks?.name || null,
    projectId: row.tasks?.projectId || null,
    projectName: row.projects?.name || null,
    templateId: row.taskChecklists.templateId,
    templateName: row.checklistTemplates?.name || null,
    stage: row.taskChecklists.stage,
    status: row.taskChecklists.status,
    inspectedBy: row.taskChecklists.inspectedBy,
    inspectorName: row.users?.name || null,
    inspectorEmail: row.users?.email || null,
    inspectedAt: row.taskChecklists.inspectedAt,
    generalComments: row.taskChecklists.generalComments,
    photoUrls: row.taskChecklists.photoUrls,
    signature: row.taskChecklists.signature,
    originalInspectionId: row.taskChecklists.originalInspectionId,
    reinspectionCount: row.taskChecklists.reinspectionCount,
    createdAt: row.taskChecklists.createdAt,
  };



  // Get all item results with template item details
  const itemResultRows = await db
    .select()
    .from(checklistItemResults)
    .leftJoin(
      checklistTemplateItems,
      eq(checklistItemResults.templateItemId, checklistTemplateItems.id)
    )
    .where(eq(checklistItemResults.taskChecklistId, inspectionId));

  // Map to simpler structure and sort by order
  const itemResults = itemResultRows
    .map((row) => ({
      id: row.checklistItemResults.id,
      templateItemId: row.checklistItemResults.templateItemId,
      itemName: row.checklistTemplateItems?.itemText || null,
      itemOrder: row.checklistTemplateItems?.order || 0,
      result: row.checklistItemResults.result,
      comments: row.checklistItemResults.comments || null,
      photoUrls: row.checklistItemResults.photoUrls,
      createdAt: row.checklistItemResults.createdAt,
    }))
    .sort((a, b) => a.itemOrder - b.itemOrder);

  // Debug logging
  console.log(`[getInspectionDetail] Inspection ${inspectionId}: Found ${itemResultRows.length} item results, mapped to ${itemResults.length} items`);

  // Get defects created from this inspection
  const relatedDefects = await db
    .select({
      id: defects.id,
      title: defects.title,
      description: defects.description,
      status: defects.status,
      severity: defects.severity,
      type: defects.type,
      photoUrls: defects.photoUrls,
      createdAt: defects.createdAt,
    })
    .from(defects)
    .where(eq(defects.checklistId, inspectionId))
    .orderBy(desc(defects.createdAt));

  // Calculate statistics
  const passCount = itemResults.filter((item: any) => item.result === "pass").length;
  const failCount = itemResults.filter((item: any) => item.result === "fail").length;
  const naCount = itemResults.filter((item: any) => item.result === "na").length;
  const totalItems = itemResults.length;
  const passRate = totalItems > 0 ? Math.round((passCount / totalItems) * 100) : 0;

  return {
    ...inspection,
    items: itemResults,
    defects: relatedDefects,
    statistics: {
      totalItems,
      passCount,
      failCount,
      naCount,
      passRate,
    },
  };
}

/**
 * Get inspection summary statistics for a task
 * Returns counts of inspections by stage and status
 */
export async function getInspectionSummaryByTask(taskId: number) {
  const db = await getDb();
  if (!db) return null;

  const inspections = await db
    .select()
    .from(taskChecklists)
    .where(eq(taskChecklists.taskId, taskId));

  const summary = {
    total: inspections.length,
    byStage: {
      pre_execution: inspections.filter((i: any) => i.stage === "pre_execution").length,
      in_progress: inspections.filter((i: any) => i.stage === "in_progress").length,
      post_execution: inspections.filter((i: any) => i.stage === "post_execution").length,
    },
    byStatus: {
      not_started: inspections.filter((i: any) => i.status === "not_started").length,
      pending_inspection: inspections.filter((i: any) => i.status === "pending_inspection").length,
      in_progress: inspections.filter((i: any) => i.status === "in_progress").length,
      completed: inspections.filter((i: any) => i.status === "completed").length,
      failed: inspections.filter((i: any) => i.status === "failed").length,
    },
    completedCount: inspections.filter((i: any) => i.status === "completed").length,
    failedCount: inspections.filter((i: any) => i.status === "failed").length,
  };

  return summary;
}

// ==================== Scheduled Notifications ====================

/**
 * สร้าง scheduled notification สำหรับแจ้งเตือนอัตโนมัติ
 */
export async function createScheduledNotification(data: {
  type: "task_deadline_reminder" | "defect_overdue_reminder" | "inspection_reminder" | "daily_summary";
  userId: number;
  relatedTaskId?: number;
  relatedDefectId?: number;
  relatedProjectId?: number;
  scheduledFor: Date;
  title: string;
  content?: string;
  priority?: "urgent" | "high" | "normal" | "low";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scheduledNotifications).values({
    type: data.type,
    userId: data.userId,
    relatedTaskId: data.relatedTaskId,
    relatedDefectId: data.relatedDefectId,
    relatedProjectId: data.relatedProjectId,
    scheduledFor: data.scheduledFor,
    title: data.title,
    content: data.content,
    priority: data.priority || "normal",
    status: "pending",
  });

  return result;
}

/**
 * ดึง scheduled notifications ที่ถึงเวลาส่งแล้ว
 */
export async function getPendingScheduledNotifications() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const result = await db
    .select()
    .from(scheduledNotifications)
    .where(
      and(
        eq(scheduledNotifications.status, "pending"),
        lte(scheduledNotifications.scheduledFor, now)
      )
    )
    .limit(100);

  return result;
}

/**
 * อัปเดตสถานะ scheduled notification
 */
export async function updateScheduledNotificationStatus(
  id: number,
  status: "sent" | "failed" | "cancelled",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(scheduledNotifications)
    .set({
      status,
      sentAt: status === "sent" ? new Date() : undefined,
      errorMessage,
    })
    .where(eq(scheduledNotifications.id, id));
}

/**
 * ดึงการตั้งค่าการแจ้งเตือนของ user
 */
export async function getNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * สร้างหรืออัปเดตการตั้งค่าการแจ้งเตือน
 */
export async function upsertNotificationSettings(data: {
  userId: number;
  enableTaskDeadlineReminders?: boolean;
  taskDeadlineDaysAdvance?: number;
  enableDefectOverdueReminders?: boolean;
  defectOverdueDaysThreshold?: number;
  enableDailySummary?: boolean;
  dailySummaryTime?: string;
  enableInAppNotifications?: boolean;
  enableEmailNotifications?: boolean;
  enablePushNotifications?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getNotificationSettings(data.userId);

  // Convert boolean fields to numbers for MySQL
  const convertedData: any = { ...data };
  if (data.enableTaskDeadlineReminders !== undefined) {
    convertedData.enableTaskDeadlineReminders = data.enableTaskDeadlineReminders ? 1 : 0;
  }
  if (data.enableDefectOverdueReminders !== undefined) {
    convertedData.enableDefectOverdueReminders = data.enableDefectOverdueReminders ? 1 : 0;
  }
  if (data.enableDailySummary !== undefined) {
    convertedData.enableDailySummary = data.enableDailySummary ? 1 : 0;
  }
  if (data.enableInAppNotifications !== undefined) {
    convertedData.enableInAppNotifications = data.enableInAppNotifications ? 1 : 0;
  }
  if (data.enableEmailNotifications !== undefined) {
    convertedData.enableEmailNotifications = data.enableEmailNotifications ? 1 : 0;
  }
  if (data.enablePushNotifications !== undefined) {
    convertedData.enablePushNotifications = data.enablePushNotifications ? 1 : 0;
  }

  if (existing) {
    // Update existing settings
    await db
      .update(notificationSettings)
      .set({
        ...convertedData,
        updatedAt: new Date(),
      })
      .where(eq(notificationSettings.userId, data.userId));
  } else {
    // Create new settings
    const { userId, ...settingsData } = convertedData;
    await db.insert(notificationSettings).values({
      userId,
      ...settingsData,
    });
  }
}

/**
 * ดึง tasks ที่ใกล้ครบกำหนด (สำหรับสร้าง scheduled notifications)
 */
export async function getUpcomingDeadlineTasks(daysAdvance: number) {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAdvance);

  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const result = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      endDate: tasks.endDate,
      assigneeId: tasks.assigneeId,
      projectId: tasks.projectId,
      status: tasks.status,
    })
    .from(tasks)
    .where(
      and(
        gte(tasks.endDate, todayStr),
        lte(tasks.endDate, futureDateStr),
        notInArray(tasks.status, ["completed", "cancelled"] as any)
      )
    );

  return result;
}

/**
 * ดึง defects ที่ค้างนาน (สำหรับสร้าง scheduled notifications)
 */
export async function getOverdueDefects(daysThreshold: number) {
  const db = await getDb();
  if (!db) return [];

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const result = await db
    .select({
      id: defects.id,
      title: defects.title,
      taskId: defects.taskId,
      assignedTo: defects.assignedTo,
      reportedBy: defects.reportedBy,
      status: defects.status,
      createdAt: defects.createdAt,
    })
    .from(defects)
    .where(
      and(
        lte(defects.createdAt, thresholdDate),
        notInArray(defects.status, ["closed", "resolved"] as any)
      )
    );

  return result;
}

/**
 * Team Management Functions
 */

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const members = await db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(projectMembers)
    .leftJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

  return members;
}

export async function removeProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    );

  return { success: true };
}

export async function updateProjectMemberRole(
  projectId: number,
  userId: number,
  role: "project_manager" | "qc_inspector" | "worker"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectMembers)
    .set({ role })
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    );

  return { success: true };
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      code: projects.code,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .leftJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId));

  return userProjects;
}

export async function getUserTasks(
  userId: number,
  status?: "all" | "todo" | "in_progress" | "completed",
  limit?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const whereConditions = status && status !== "all"
    ? and(
        eq(tasks.assigneeId, userId),
        eq(tasks.status, status as any)
      )
    : eq(tasks.assigneeId, userId);

  const query = db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      name: tasks.name,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      startDate: tasks.startDate,
      endDate: tasks.endDate,
      progress: tasks.progress,
      projectName: projects.name,
      projectCode: projects.code,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(whereConditions)
    .orderBy(tasks.endDate);

  const results = await query;
  return results;
}

export async function getProjectActivity(projectId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const activities = await db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      projectId: activityLog.projectId,
      taskId: activityLog.taskId,
      action: activityLog.action,
      details: activityLog.details,
      createdAt: activityLog.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .where(eq(activityLog.projectId, projectId))
    .orderBy(activityLog.createdAt)
    .limit(limit);

  return activities;
}

export async function getUserTaskStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.assigneeId, userId));

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = allTasks.filter(t => t.status === "in_progress").length;
  const todoTasks = allTasks.filter(t => t.status === "todo" || t.status === "not_started").length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

export async function getUserTaskStatsForProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const projectTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assigneeId, userId),
        eq(tasks.projectId, projectId)
      )
    );

  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = projectTasks.filter(t => t.status === "in_progress").length;
  const todoTasks = projectTasks.filter(t => t.status === "todo" || t.status === "not_started").length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

// ============================================================================
// Workload Statistics Functions
// ============================================================================

export async function getWorkloadStatistics(projectId?: number) {
  const db = await getDb();
  if (!db) return [];

  const query = db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      totalTasks: sql<number>`COUNT(DISTINCT ${tasks.id})`,
      todoTasks: sql<number>`SUM(CASE WHEN ${tasks.status} IN ('todo', 'not_started') THEN 1 ELSE 0 END)`,
      inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`,
      overdueTasks: sql<number>`SUM(CASE WHEN ${tasks.endDate} < NOW() AND ${tasks.status} != 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(users)
    .leftJoin(taskAssignments, eq(taskAssignments.userId, users.id))
    .leftJoin(tasks, eq(tasks.id, taskAssignments.taskId))
    .$dynamic();

  const finalQuery = projectId
    ? query.where(eq(tasks.projectId, projectId)).groupBy(users.id)
    : query.groupBy(users.id);

  return await finalQuery;
}

export async function getUserWorkload(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      totalTasks: sql<number>`COUNT(DISTINCT ${tasks.id})`,
      todoTasks: sql<number>`SUM(CASE WHEN ${tasks.status} IN ('todo', 'not_started') THEN 1 ELSE 0 END)`,
      inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`,
      overdueTasks: sql<number>`SUM(CASE WHEN ${tasks.endDate} < NOW() AND ${tasks.status} != 'completed' THEN 1 ELSE 0 END)`,
      urgentTasks: sql<number>`SUM(CASE WHEN ${tasks.priority} = 'urgent' AND ${tasks.status} != 'completed' THEN 1 ELSE 0 END)`,
      highPriorityTasks: sql<number>`SUM(CASE WHEN ${tasks.priority} = 'high' AND ${tasks.status} != 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(users)
    .leftJoin(taskAssignments, eq(taskAssignments.userId, users.id))
    .leftJoin(tasks, eq(tasks.id, taskAssignments.taskId))
    .where(eq(users.id, userId))
    .groupBy(users.id)
    .limit(1);

  return result[0] || null;
}

export async function getRoleDashboardData(userId: number, role: string) {
  const db = await getDb();
  if (!db) return null;

  // Common data for all roles
  const baseData = {
    userId,
    role,
  };

  // Role-specific data
  switch (role) {
    case "owner":
    case "admin":
      // Admin sees everything
      const [adminProjects, adminTasks, adminDefects, adminUsers] = await Promise.all([
        db.select().from(projects),
        db.select().from(tasks),
        db.select().from(defects),
        db.select().from(users),
      ]);
      return {
        ...baseData,
        projects: adminProjects,
        tasks: adminTasks,
        defects: adminDefects,
        users: adminUsers,
        totalProjects: adminProjects.length,
        totalTasks: adminTasks.length,
        totalDefects: adminDefects.length,
        totalUsers: adminUsers.length,
      };

    case "project_manager":
      // PM sees projects they manage
      const pmProjects = await db
        .select()
        .from(projects)
        .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
        .where(
          and(
            eq(projectMembers.userId, userId),
            eq(projectMembers.role, "project_manager")
          )
        );

      const pmProjectIds = pmProjects.map((p: any) => p.projects.id);
      const [pmTasks, pmDefects, pmTeamMembers] = await Promise.all([
        pmProjectIds.length > 0
          ? db.select().from(tasks).where(sql`${tasks.projectId} IN (${sql.join(pmProjectIds.map((id: any) => sql`${id}`), sql`, `)})`)
          : [],
        pmProjectIds.length > 0
          ? db.select().from(defects).leftJoin(tasks, eq(tasks.id, defects.taskId)).where(sql`${tasks.projectId} IN (${sql.join(pmProjectIds.map((id: any) => sql`${id}`), sql`, `)})`).then(results => results.map(r => r.defects))
          : [],
        pmProjectIds.length > 0
          ? db
              .select()
              .from(projectMembers)
              .leftJoin(users, eq(users.id, projectMembers.userId))
              .where(sql`${projectMembers.projectId} IN (${sql.join(pmProjectIds.map((id: any) => sql`${id}`), sql`, `)})`)
          : [],
      ]);

      return {
        ...baseData,
        projects: pmProjects.map((p: any) => p.projects),
        tasks: pmTasks,
        defects: pmDefects,
        teamMembers: pmTeamMembers,
        totalProjects: pmProjects.length,
        totalTasks: pmTasks.length,
        totalDefects: pmDefects.length,
      };

    case "qc_inspector":
      // QC Inspector sees inspection-related data
      const qcDefects = await db
        .select()
        .from(defects)
        .leftJoin(tasks, eq(tasks.id, defects.taskId))
        .leftJoin(projects, eq(projects.id, tasks.projectId));

      const qcInspections = await db
        .select()
        .from(taskChecklists)
        .leftJoin(tasks, eq(tasks.id, taskChecklists.taskId));

      return {
        ...baseData,
        defects: qcDefects.map((d: any) => d.defects),
        inspections: qcInspections.map((i: any) => i.taskChecklists),
        totalDefects: qcDefects.length,
        totalInspections: qcInspections.length,
        pendingInspections: qcInspections.filter(
          (i: any) => i.taskChecklists && i.taskChecklists.status === "pending_inspection"
        ).length,
      };

    case "worker":
      // Worker sees only their assigned tasks
      const workerTasks = await db
        .select()
        .from(tasks)
        .leftJoin(taskAssignments, eq(taskAssignments.taskId, tasks.id))
        .leftJoin(projects, eq(projects.id, tasks.projectId))
        .where(eq(taskAssignments.userId, userId));

      return {
        ...baseData,
        tasks: workerTasks.map((t: any) => ({ ...t.tasks, projectName: t.projects?.name })),
        totalTasks: workerTasks.length,
        todoTasks: workerTasks.filter(
          (t: any) => t.tasks.status === "todo" || t.tasks.status === "not_started"
        ).length,
        inProgressTasks: workerTasks.filter((t: any) => t.tasks.status === "in_progress")
          .length,
        completedTasks: workerTasks.filter((t: any) => t.tasks.status === "completed")
          .length,
      };

    default:
      return baseData;
  }
}

// ============================================
// Alert Thresholds Functions
// ============================================

export async function getAlertThresholds(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const thresholds = await db
    .select()
    .from(alertThresholds)
    .where(eq(alertThresholds.userId, userId));

  return thresholds;
}

export async function createAlertThreshold(data: InsertAlertThreshold) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if threshold already exists for this user and metric type
  const existing = await db
    .select()
    .from(alertThresholds)
    .where(
      and(
        eq(alertThresholds.userId, data.userId),
        eq(alertThresholds.metricType, data.metricType)
      )
    );

  if (existing.length > 0) {
    throw new Error(`Alert threshold for ${data.metricType} already exists`);
  }

  // Convert boolean to number for MySQL
  const convertedData: any = { ...data };
  if (data.isEnabled !== undefined && typeof data.isEnabled === 'boolean') {
    convertedData.isEnabled = data.isEnabled ? 1 : 0;
  }

  const result = await db.insert(alertThresholds).values(convertedData);
  return result;
}

export async function updateAlertThreshold(
  id: number,
  data: Partial<{
    threshold: number;
    isEnabled: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert boolean to number for MySQL
  const convertedData: any = { ...data };
  if (data.isEnabled !== undefined) {
    convertedData.isEnabled = data.isEnabled ? 1 : 0;
  }

  await db.update(alertThresholds).set(convertedData).where(eq(alertThresholds.id, id));
}

export async function deleteAlertThreshold(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(alertThresholds).where(eq(alertThresholds.id, id));
}

export async function checkAlertThresholds(userId: number, currentMetrics: { cpu: number; memory: number }) {
  const db = await getDb();
  if (!db) return [];

  const thresholds = await db
    .select()
    .from(alertThresholds)
    .where(
      and(
        eq(alertThresholds.userId, userId),
        eq(alertThresholds.isEnabled, 1)
      )
    );

  const exceededThresholds = [];

  for (const threshold of thresholds) {
    const currentValue = currentMetrics[threshold.metricType];
    if (currentValue >= threshold.threshold) {
      exceededThresholds.push({
        metricType: threshold.metricType,
        threshold: threshold.threshold,
        currentValue,
        exceeded: currentValue - threshold.threshold,
      });
    }
  }

  return exceededThresholds;
}


// ============================================
// Advanced Analytics Functions
// ============================================

/**
 * Predictive Analytics - คาดการณ์ความล่าช้าของโครงการ
 */
export async function getPredictiveAnalytics(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  // ดึงข้อมูลโครงการและงาน
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project.length === 0) return null;

  const projectData = project[0];
  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  // คำนวณสถิติ
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const delayedTasks = allTasks.filter(t => {
    if (!t.endDate) return false;
    const endDate = new Date(t.endDate);
    const today = new Date();
    return t.status !== 'completed' && endDate < today;
  }).length;

  // คำนวณ velocity (อัตราการทำงานเสร็จ)
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  // คำนวณวันที่เหลือ
  const today = new Date();
  const endDate = new Date(projectData.endDate || today);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  // คำนวณงานที่เหลือ
  const remainingTasks = totalTasks - completedTasks;
  
  // คาดการณ์วันที่จะเสร็จจริง (ถ้า velocity คงที่)
  const averageTasksPerDay = daysRemaining > 0 ? completionRate * totalTasks / Math.max(1, daysRemaining) : 0;
  const predictedDaysToComplete = averageTasksPerDay > 0 ? remainingTasks / averageTasksPerDay : daysRemaining;
  
  // คำนวณความเสี่ยงล่าช้า
  const delayRisk = delayedTasks / Math.max(1, totalTasks);
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (delayRisk > 0.3) riskLevel = 'critical';
  else if (delayRisk > 0.2) riskLevel = 'high';
  else if (delayRisk > 0.1) riskLevel = 'medium';

  // คาดการณ์วันที่เสร็จ
  const predictedEndDate = new Date(today);
  predictedEndDate.setDate(predictedEndDate.getDate() + Math.ceil(predictedDaysToComplete));

  return {
    projectId,
    projectName: projectData.name,
    totalTasks,
    completedTasks,
    inProgressTasks,
    delayedTasks,
    completionRate: Math.round(completionRate * 100),
    daysRemaining,
    remainingTasks,
    predictedDaysToComplete: Math.ceil(predictedDaysToComplete),
    predictedEndDate: predictedEndDate.toISOString(),
    plannedEndDate: projectData.endDate,
    delayRisk: Math.round(delayRisk * 100),
    riskLevel,
    isOnTrack: predictedEndDate <= endDate,
    delayDays: Math.max(0, Math.ceil((predictedEndDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))),
  };
}

/**
 * Cost Analysis - วิเคราะห์ต้นทุน (ถ้ามีข้อมูล budget)
 */
export async function getCostAnalysis(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project.length === 0) return null;

  const projectData = project[0];
  
  // ในอนาคตสามารถเพิ่ม budget tracking ได้
  // ตอนนี้ return placeholder data
  return {
    projectId,
    projectName: projectData.name,
    budgetPlanned: 0,
    budgetActual: 0,
    budgetRemaining: 0,
    costVariance: 0,
    costPerformanceIndex: 1.0,
    estimatedCostAtCompletion: 0,
  };
}

/**
 * Resource Utilization - วิเคราะห์การใช้ทรัพยากร
 */
export async function getResourceUtilization(projectId?: number) {
  const db = await getDb();
  if (!db) return null;

  // ดึงข้อมูลการ assign งาน
  const baseQuery = db
    .select({
      userId: taskAssignments.userId,
      userName: users.name,
      taskId: tasks.id,
      taskName: tasks.name,
      taskStatus: tasks.status,
      projectId: tasks.projectId,
      projectName: projects.name,
    })
    .from(taskAssignments)
    .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
    .innerJoin(users, eq(taskAssignments.userId, users.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id));

  const assignments = projectId
    ? await baseQuery.where(eq(tasks.projectId, projectId))
    : await baseQuery;

  // จัดกลุ่มตาม user
  const userStats = new Map<number, {
    userId: number;
    userName: string;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    utilizationRate: number;
    projects: Set<number>;
  }>();

  for (const assignment of assignments) {
    if (!userStats.has(assignment.userId)) {
      userStats.set(assignment.userId, {
        userId: assignment.userId,
        userName: assignment.userName || 'Unknown',
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        utilizationRate: 0,
        projects: new Set(),
      });
    }

    const stats = userStats.get(assignment.userId)!;
    stats.totalTasks++;
    stats.projects.add(assignment.projectId);
    
    if (assignment.taskStatus === 'completed') {
      stats.completedTasks++;
    } else if (assignment.taskStatus === 'in_progress') {
      stats.activeTasks++;
    }
  }

  // คำนวณ utilization rate
  const result = Array.from(userStats.values()).map(stats => {
    const utilizationRate = stats.totalTasks > 0 
      ? (stats.activeTasks + stats.completedTasks) / stats.totalTasks * 100 
      : 0;
    
    return {
      ...stats,
      utilizationRate: Math.round(utilizationRate),
      projectCount: stats.projects.size,
      projects: undefined, // ลบ Set ออก
    };
  });

  return result;
}

/**
 * Quality Trend Analysis - วิเคราะห์แนวโน้ม QC Issues
 */
export async function getQualityTrendAnalysis(projectId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // ดึงข้อมูล defects ย้อนหลัง
  const defectsList = await db
    .select({
      id: defects.id,
      severity: defects.severity,
      status: defects.status,
      createdAt: defects.createdAt,
      taskId: defects.taskId,
    })
    .from(defects)
    .innerJoin(tasks, eq(defects.taskId, tasks.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        gte(defects.createdAt, startDate)
      )
    );

  // จัดกลุ่มตามวัน
  const dailyDefects = new Map<string, {
    date: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolved: number;
  }>();

  for (const defect of defectsList) {
    const dateKey = defect.createdAt.toISOString().split('T')[0];
    
    if (!dailyDefects.has(dateKey)) {
      dailyDefects.set(dateKey, {
        date: dateKey,
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        resolved: 0,
      });
    }

    const stats = dailyDefects.get(dateKey)!;
    stats.total++;
    
    if (defect.severity === 'critical') stats.critical++;
    else if (defect.severity === 'high') stats.high++;
    else if (defect.severity === 'medium') stats.medium++;
    else if (defect.severity === 'low') stats.low++;
    
    if (defect.status === 'resolved') stats.resolved++;
  }

  // เรียงตามวันที่
  const trend = Array.from(dailyDefects.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  // คำนวณสถิติรวม
  const totalDefects = defectsList.length;
  const resolvedDefects = defectsList.filter(d => d.status === 'resolved').length;
  const resolutionRate = totalDefects > 0 ? (resolvedDefects / totalDefects) * 100 : 0;

  return {
    projectId,
    days,
    totalDefects,
    resolvedDefects,
    resolutionRate: Math.round(resolutionRate),
    trend,
  };
}

/**
 * Risk Assessment - ประเมินความเสี่ยงโครงการ
 */
export async function getRiskAssessment(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project.length === 0) return null;

  const projectData = project[0];
  
  // ดึงข้อมูลที่เกี่ยวข้อง
  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const allDefects = await db
    .select()
    .from(defects)
    .innerJoin(tasks, eq(defects.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId));

  // คำนวณความเสี่ยงด้านต่างๆ
  const totalTasks = allTasks.length;
  const delayedTasks = allTasks.filter(t => {
    if (!t.endDate || t.status === 'completed') return false;
    return new Date(t.endDate) < new Date();
  }).length;

  const scheduleRisk = totalTasks > 0 ? (delayedTasks / totalTasks) * 100 : 0;

  const criticalDefects = allDefects.filter(d => d.defects.severity === 'critical').length;
  const unresolvedDefects = allDefects.filter(d => d.defects.status !== 'resolved').length;
  const qualityRisk = allDefects.length > 0 ? (unresolvedDefects / allDefects.length) * 100 : 0;

  // ความเสี่ยงด้านทรัพยากร (จำนวนงานที่ยังไม่ assign)
  const unassignedTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .leftJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
    .where(
      and(
        eq(tasks.projectId, projectId),

        isNull(taskAssignments.userId)
      )
    );

  const resourceRisk = totalTasks > 0 ? (unassignedTasks.length / totalTasks) * 100 : 0;

  // คำนวณความเสี่ยงรวม
  const overallRisk = (scheduleRisk + qualityRisk + resourceRisk) / 3;

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (overallRisk > 50) riskLevel = 'critical';
  else if (overallRisk > 30) riskLevel = 'high';
  else if (overallRisk > 15) riskLevel = 'medium';

  return {
    projectId,
    projectName: projectData.name,
    overallRisk: Math.round(overallRisk),
    riskLevel,
    scheduleRisk: Math.round(scheduleRisk),
    qualityRisk: Math.round(qualityRisk),
    resourceRisk: Math.round(resourceRisk),
    risks: [
      {
        category: 'schedule',
        level: scheduleRisk > 30 ? 'high' : scheduleRisk > 15 ? 'medium' : 'low',
        description: `${delayedTasks} งานล่าช้าจากทั้งหมด ${totalTasks} งาน`,
        impact: scheduleRisk,
      },
      {
        category: 'quality',
        level: qualityRisk > 30 ? 'high' : qualityRisk > 15 ? 'medium' : 'low',
        description: `${unresolvedDefects} ข้อบกพร่องที่ยังไม่แก้ไข (${criticalDefects} critical)`,
        impact: qualityRisk,
      },
      {
        category: 'resource',
        level: resourceRisk > 30 ? 'high' : resourceRisk > 15 ? 'medium' : 'low',
        description: `${unassignedTasks.length} งานที่ยังไม่ได้มอบหมาย`,
        impact: resourceRisk,
      },
    ],
  };
}

/**
 * Performance KPIs - ตัวชี้วัดประสิทธิภาพ
 */
export async function getPerformanceKPIs(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project.length === 0) return null;

  const projectData = project[0];
  
  // ดึงข้อมูลงานทั้งหมด
  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  
  // Schedule Performance Index (SPI)
  const today = new Date();
  const startDate = new Date(projectData.startDate || today);
  const endDate = new Date(projectData.endDate || today);
  const totalDuration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDuration = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const plannedProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);
  const actualProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

  // On-time Delivery Rate
  const tasksWithDeadline = allTasks.filter(t => t.endDate && t.status === 'completed');
  const onTimeTasks = tasksWithDeadline.filter(t => {
    const completedDate = t.updatedAt ? new Date(t.updatedAt) : new Date();
    const deadline = new Date(t.endDate!);
    return completedDate <= deadline;
  }).length;
  const onTimeRate = tasksWithDeadline.length > 0 ? (onTimeTasks / tasksWithDeadline.length) * 100 : 0;

  // Defect Density
  const allDefects = await db
    .select()
    .from(defects)
    .innerJoin(tasks, eq(defects.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId));
  
  const defectDensity = completedTasks > 0 ? allDefects.length / completedTasks : 0;

  // Quality Score (based on defects and resolution)
  const resolvedDefects = allDefects.filter(d => d.defects.status === 'resolved').length;
  const qualityScore = allDefects.length > 0 
    ? (resolvedDefects / allDefects.length) * 100 
    : 100;

  return {
    projectId,
    projectName: projectData.name,
    schedulePerformanceIndex: Math.round(spi * 100) / 100,
    onTimeDeliveryRate: Math.round(onTimeRate),
    defectDensity: Math.round(defectDensity * 100) / 100,
    qualityScore: Math.round(qualityScore),
    totalTasks,
    completedTasks,
    totalDefects: allDefects.length,
    resolvedDefects,
    plannedProgress: Math.round(plannedProgress),
    actualProgress: Math.round(actualProgress),
  };
}

/**
 * Comparative Analysis - เปรียบเทียบหลายโครงการ
 */
export async function getComparativeAnalysis(projectIds: number[]) {
  const db = await getDb();
  if (!db) return [];

  const results = await Promise.all(
    projectIds.map(async (projectId) => {
      const kpis = await getPerformanceKPIs(projectId);
      const risk = await getRiskAssessment(projectId);
      const predictive = await getPredictiveAnalytics(projectId);

      return {
        projectId,
        projectName: kpis?.projectName || '',
        kpis,
        risk,
        predictive,
      };
    })
  );

  return results.filter(r => r.kpis !== null);
}

/**
 * Dashboard Statistics Functions
 */
export async function getDashboardStats(userId?: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get total projects (not archived)
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(isNull(projects.archivedAt));
    
    const totalActiveProjects = activeProjectsResult[0]?.count || 0;

    // Get all tasks statistics
    const allTasksResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));
    
    const totalTasks = allTasksResult[0]?.count || 0;

    const completedTasksResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.status, "completed"), isNull(projects.archivedAt)));
    
    const completedTasks = completedTasksResult[0]?.count || 0;

    const inProgressTasksResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.status, "in_progress"), isNull(projects.archivedAt)));
    
    const inProgressTasks = inProgressTasksResult[0]?.count || 0;

    // Get overdue tasks (tasks with endDate < today and not completed)
    const today = new Date().toISOString().split('T')[0];
    const overdueTasksResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          ne(tasks.status, "completed"),
          lt(tasks.endDate, today),
          isNull(projects.archivedAt)
        )
      );
    
    const overdueTasks = overdueTasksResult[0]?.count || 0;

    // Get pending inspections
    const pendingInspectionsResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(taskChecklists.status, "pending_inspection"),
          isNull(projects.archivedAt)
        )
      );
    
    const pendingInspections = pendingInspectionsResult[0]?.count || 0;

    // Get open defects
    const openDefectsResult = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      );
    
    const openDefects = openDefectsResult[0]?.count || 0;

    // Get critical defects
    const criticalDefectsResult = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.severity, "critical"),
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      );
    
    const criticalDefects = criticalDefectsResult[0]?.count || 0;

    // Get team members count
    const teamMembersResult = await db
      .select({ count: count() })
      .from(users)
      .where(ne(users.role, "owner"));
    
    const teamMembers = teamMembersResult[0]?.count || 0;

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalActiveProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      pendingInspections,
      openDefects,
      criticalDefects,
      teamMembers,
      completionRate,
    };
  } catch (error: unknown) {
    logger.error('[getDashboardStats] Error:', (error as Error).message);
    return null;
  }
}

export async function getRecentActivitiesForDashboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const activities = await db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        userName: users.name,
        action: activityLog.action,
        details: activityLog.details,
        projectId: activityLog.projectId,
        taskId: activityLog.taskId,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    return activities;
  } catch (error: unknown) {
    logger.error('[getRecentActivitiesForDashboard] Error:', (error as Error).message);
    return [];
  }
}

export async function getTaskStatusDistribution() {
  const db = await getDb();
  if (!db) return [];

  try {
    const distribution = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt))
      .groupBy(tasks.status);

    return distribution;
  } catch (error: unknown) {
    logger.error('[getTaskStatusDistribution] Error:', (error as Error).message);
    return [];
  }
}

export async function getDefectSeverityDistribution() {
  const db = await getDb();
  if (!db) return [];

  try {
    const distribution = await db
      .select({
        severity: defects.severity,
        count: count(),
      })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      )
      .groupBy(defects.severity);

    return distribution;
  } catch (error: unknown) {
    logger.error('[getDefectSeverityDistribution] Error:', (error as Error).message);
    return [];
  }
}

export async function getProjectProgressForDashboard() {
  const db = await getDb();
  if (!db) return [];

  try {
    const projectsData = await db
      .select({
        id: projects.id,
        name: projects.name,
        completionPercentage: projects.completionPercentage,
        status: projects.status,
      })
      .from(projects)
      .where(isNull(projects.archivedAt))
      .limit(5);

    return projectsData;
  } catch (error: unknown) {
    logger.error('[getProjectProgressForDashboard] Error:', (error as Error).message);
    return [];
  }
}

// ============================================
// Permissions Management
// ============================================

export async function getAllPermissions() {
  const db = await getDb();
  if (!db) return [];
  
  const { permissions } = await import("../drizzle/schema");
  return await db.select().from(permissions);
}

export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { userPermissions, permissions } = await import("../drizzle/schema");
  return await db
    .select({
      id: userPermissions.id,
      permissionId: userPermissions.permissionId,
      granted: userPermissions.granted,
      grantedBy: userPermissions.grantedBy,
      grantedAt: userPermissions.grantedAt,
      module: permissions.module,
      action: permissions.action,
      name: permissions.name,
      description: permissions.description,
    })
    .from(userPermissions)
    .leftJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));
}

export async function setUserPermission(data: {
  userId: number;
  permissionId: number;
  granted: boolean;
  grantedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { userPermissions } = await import("../drizzle/schema");
  
  // Check if permission already exists
  const existing = await db
    .select()
    .from(userPermissions)
    .where(
      and(
        eq(userPermissions.userId, data.userId),
        eq(userPermissions.permissionId, data.permissionId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing permission
    await db
      .update(userPermissions)
      .set({
        granted: boolToInt(data.granted),
        grantedBy: data.grantedBy,
        grantedAt: new Date(),
      })
      .where(eq(userPermissions.id, existing[0].id));
  } else {
    // Insert new permission
    await db.insert(userPermissions).values({
      userId: data.userId,
      permissionId: data.permissionId,
      granted: boolToInt(data.granted),
      grantedBy: data.grantedBy,
      grantedAt: new Date(),
    });
  }
}

export async function bulkSetUserPermissions(data: {
  userId: number;
  permissions: Array<{ permissionId: number; granted: boolean }>;
  grantedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { userPermissions } = await import("../drizzle/schema");
  
  // Delete all existing permissions for this user
  await db.delete(userPermissions).where(eq(userPermissions.userId, data.userId));
  
  // Insert new permissions
  if (data.permissions.length > 0) {
    await db.insert(userPermissions).values(
      data.permissions.map(p => ({
        userId: data.userId,
        permissionId: p.permissionId,
        granted: boolToInt(p.granted),
        grantedBy: data.grantedBy,
        grantedAt: new Date(),
      }))
    );
  }
}

// ============================================
// User Activity Logs
// ============================================

export async function logUserActivity(data: {
  userId: number;
  action: string;
  module?: string;
  entityType?: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { userActivityLogs } = await import("../drizzle/schema");
  
  try {
    await db.insert(userActivityLogs).values({
      userId: data.userId,
      action: data.action,
      module: data.module,
      details: data.details ? JSON.stringify(data.details) : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error: unknown) {
    console.error("[Database] Failed to log user activity:", error);
  }
}

export async function getUserActivityLogs(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const { userActivityLogs } = await import("../drizzle/schema");
  return await db
    .select()
    .from(userActivityLogs)
    .where(eq(userActivityLogs.userId, userId))
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(limit);
}

export async function getAllActivityLogs(filters?: {
  userId?: number;
  action?: string;
  module?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { userActivityLogs } = await import("../drizzle/schema");
  
  let query = db.select().from(userActivityLogs);
  
  const conditions = [];
  if (filters?.userId) {
    conditions.push(eq(userActivityLogs.userId, filters.userId));
  }
  if (filters?.action) {
    conditions.push(eq(userActivityLogs.action, filters.action));
  }
  if (filters?.module) {
    conditions.push(eq(userActivityLogs.module, filters.module));
  }
  if (filters?.startDate) {
    conditions.push(gte(userActivityLogs.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(userActivityLogs.createdAt, filters.endDate));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(filters?.limit || 100);
}

// ============================================
// Bulk User Import
// ============================================

export async function createBulkImportLog(data: {
  importedBy: number;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  totalRows: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { bulkImportLogs } = await import("../drizzle/schema");
  
  const result = await db.insert(bulkImportLogs).values({
    importedBy: data.importedBy,
    fileName: data.fileName,
    fileSize: data.fileSize,
    totalRecords: data.totalRows || 0,
    status: "pending",
  });
  
  return result[0].insertId;
}

export async function updateBulkImportLog(
  id: number,
  data: {
    status?: "pending" | "processing" | "completed" | "failed";
    successCount?: number;
    failureCount?: number;
    errorDetails?: any;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { bulkImportLogs } = await import("../drizzle/schema");
  
  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.successCount !== undefined) updateData.successCount = data.successCount;
  if (data.failureCount !== undefined) updateData.failureCount = data.failureCount;
  if (data.errorDetails) updateData.errorDetails = JSON.stringify(data.errorDetails);
  if (data.status === "completed" || data.status === "failed") {
    updateData.completedAt = new Date();
  }
  
  await db.update(bulkImportLogs).set(updateData).where(eq(bulkImportLogs.id, id));
}

export async function getBulkImportLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { bulkImportLogs } = await import("../drizzle/schema");
  return await db
    .select()
    .from(bulkImportLogs)
    .orderBy(desc(bulkImportLogs.createdAt))
    .limit(limit);
}

export async function bulkCreateUsers(usersData: Array<{
  name: string;
  email: string;
  role: "owner" | "admin" | "project_manager" | "qc_inspector" | "worker";
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = {
    success: [] as any[],
    failed: [] as any[],
  };
  
  for (const userData of usersData) {
    try {
      // Generate a unique openId for bulk imported users
      const openId = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await db.insert(users).values({
        openId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        loginMethod: "bulk_import",
      });
      
      results.success.push(userData);
    } catch (error: any) {
      results.failed.push({
        ...userData,
        error: error.message,
      });
    }
  }
  
  return results;
}

// ============================================
// Role Templates Management

// ==================== CEO Dashboard Helpers ====================

/**
 * Get CEO Dashboard Overview - Project stats with trend indicators
 */
export async function getCEOProjectOverview() {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Total active projects (not archived)
    const totalResult = await db
      .select({ count: count() })
      .from(projects)
      .where(isNull(projects.archivedAt));
    
    // Active projects (status = active)
    const activeResult = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.status, "active"), isNull(projects.archivedAt)));
    
    // Delayed projects (endDate < today but not completed)
    const delayedResult = await db
      .select({ count: count() })
      .from(projects)
      .where(
        and(
          lt(projects.endDate, today),
          ne(projects.status, "completed"),
          ne(projects.status, "cancelled"),
          isNull(projects.archivedAt)
        )
      );
    
    // Overdue projects (endDate < today - 7 days and not completed)
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - 7);
    const overdueDate = overdueThreshold.toISOString().split('T')[0];
    
    const overdueResult = await db
      .select({ count: count() })
      .from(projects)
      .where(
        and(
          lt(projects.endDate, overdueDate),
          ne(projects.status, "completed"),
          ne(projects.status, "cancelled"),
          isNull(projects.archivedAt)
        )
      );

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      delayed: delayedResult[0]?.count || 0,
      overdue: overdueResult[0]?.count || 0,
    };
  } catch (error: unknown) {
    logger.error('[getCEOProjectOverview] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get Project Status Breakdown for Donut Chart
 * Categories: on_track, at_risk, critical
 */
export async function getCEOProjectStatusBreakdown() {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    const allProjects = await db
      .select({
        id: projects.id,
        status: projects.status,
        endDate: projects.endDate,
        completionPercentage: projects.completionPercentage,
      })
      .from(projects)
      .where(
        and(
          isNull(projects.archivedAt),
          ne(projects.status, "completed"),
          ne(projects.status, "cancelled")
        )
      );

    let onTrack = 0;
    let atRisk = 0;
    let critical = 0;

    for (const project of allProjects) {
      // Critical: overdue by 7+ days OR completion < 50% and < 30 days to deadline
      if (project.endDate) {
        const daysToDeadline = Math.ceil(
          (new Date(project.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
        );
        const completion = project.completionPercentage || 0;

        if (daysToDeadline < -7) {
          critical++;
        } else if (daysToDeadline < 0) {
          atRisk++;
        } else if (daysToDeadline < 30 && completion < 50) {
          atRisk++;
        } else {
          onTrack++;
        }
      } else {
        // No end date = on track
        onTrack++;
      }
    }

    return {
      onTrack,
      atRisk,
      critical,
      total: allProjects.length,
    };
  } catch (error: unknown) {
    logger.error('[getCEOProjectStatusBreakdown] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get Tasks Overview Stats
 */
export async function getCEOTasksOverview() {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Total tasks
    const totalResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));

    // Completed tasks
    const completedResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.status, "completed"), isNull(projects.archivedAt)));

    // In progress tasks
    const inProgressResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.status, "in_progress"), isNull(projects.archivedAt)));

    // Overdue tasks
    const overdueResult = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          ne(tasks.status, "completed"),
          lt(tasks.endDate, today),
          isNull(projects.archivedAt)
        )
      );

    const total = totalResult[0]?.count || 0;
    const completed = completedResult[0]?.count || 0;
    const inProgress = inProgressResult[0]?.count || 0;
    const overdue = overdueResult[0]?.count || 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  } catch (error: unknown) {
    logger.error('[getCEOTasksOverview] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get Inspection Stats
 */
export async function getCEOInspectionStats() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total inspections
    const totalResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));

    // Passed inspections
    const passedResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(taskChecklists.status, "completed"), isNull(projects.archivedAt)));

    // Failed inspections
    const failedResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(taskChecklists.status, "failed"), isNull(projects.archivedAt)));

    // Pending inspections
    const pendingResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(taskChecklists.status, "pending_inspection"), isNull(projects.archivedAt)));

    const total = totalResult[0]?.count || 0;
    const passed = passedResult[0]?.count || 0;
    const failed = failedResult[0]?.count || 0;
    const pending = pendingResult[0]?.count || 0;

    return {
      total,
      passed,
      failed,
      pending,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  } catch (error: unknown) {
    logger.error('[getCEOInspectionStats] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get Defect Stats by Severity
 */
export async function getCEODefectStats() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Critical defects (open)
    const criticalResult = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.severity, "critical"),
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      );

    // Major defects (open)
    const majorResult = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.severity, "high"),
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      );

    // Minor defects (open)
    const minorResult = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.severity, "medium"),
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      );

    // Total open defects
    const totalResult = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(ne(defects.status, "resolved"), isNull(projects.archivedAt)));

    return {
      critical: criticalResult[0]?.count || 0,
      major: majorResult[0]?.count || 0,
      minor: minorResult[0]?.count || 0,
      total: totalResult[0]?.count || 0,
    };
  } catch (error: unknown) {
    logger.error('[getCEODefectStats] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get Alerts - urgent items requiring action
 */
export async function getCEOAlerts() {
  const db = await getDb();
  if (!db) return [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const alerts: Array<{
      type: 'project_overdue' | 'task_overdue' | 'inspection_pending' | 'defect_critical';
      severity: 'high' | 'medium' | 'low';
      message: string;
      count?: number;
      projectId?: number;
      projectName?: string;
    }> = [];

    // 1. Overdue projects
    const overdueProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        endDate: projects.endDate,
      })
      .from(projects)
      .where(
        and(
          lt(projects.endDate, today),
          ne(projects.status, "completed"),
          ne(projects.status, "cancelled"),
          isNull(projects.archivedAt)
        )
      )
      .limit(5);

    for (const project of overdueProjects) {
      const daysOverdue = Math.ceil(
        (new Date(today).getTime() - new Date(project.endDate!).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        type: 'project_overdue',
        severity: daysOverdue > 30 ? 'high' : 'medium',
        message: `โครงการ "${project.name}" เลยกำหนด ${daysOverdue} วัน`,
        projectId: project.id,
        projectName: project.name,
      });
    }

    // 2. Critical defects
    const criticalDefectsCount = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.severity, "critical"),
          ne(defects.status, "resolved"),
          isNull(projects.archivedAt)
        )
      );

    const criticalCount = criticalDefectsCount[0]?.count || 0;
    if (criticalCount > 0) {
      alerts.push({
        type: 'defect_critical',
        severity: 'high',
        message: `มี ${criticalCount} ข้อบกพร่องร้ายแรงที่ต้องแก้ไขด่วน`,
        count: criticalCount,
      });
    }

    // 3. Pending inspections (more than 7 days)
    const oldPendingInspections = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(taskChecklists.status, "pending_inspection"),
          isNull(projects.archivedAt)
        )
      );

    const pendingCount = oldPendingInspections[0]?.count || 0;
    if (pendingCount > 0) {
      alerts.push({
        type: 'inspection_pending',
        severity: pendingCount > 10 ? 'high' : 'medium',
        message: `มี ${pendingCount} การตรวจสอบรออนุมัติ`,
        count: pendingCount,
      });
    }

    // 4. Overdue tasks
    const overdueTasksCount = await db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          ne(tasks.status, "completed"),
          lt(tasks.endDate, today),
          isNull(projects.archivedAt)
        )
      );

    const overdueCount = overdueTasksCount[0]?.count || 0;
    if (overdueCount > 0) {
      alerts.push({
        type: 'task_overdue',
        severity: overdueCount > 20 ? 'high' : 'medium',
        message: `มี ${overdueCount} งานที่เลยกำหนดเวลา`,
        count: overdueCount,
      });
    }

    // Sort by severity
    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  } catch (error: unknown) {
    logger.error('[getCEOAlerts] Error:', (error as Error).message);
    return [];
  }
}

// ============================================
// Dashboard Enhancement Functions
// ============================================

/**
 * Get project timeline overview for dashboard
 * Returns projects grouped by timeline status (on track, at risk, behind schedule)
 */
export async function getProjectTimelineOverview() {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get all active projects with their progress
    const activeProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
      })
      .from(projects)
      .where(
        and(
          isNull(projects.archivedAt),
          eq(projects.status, 'active')
        )
      );

    // Calculate timeline status for each project
    let onTrack = 0;
    let atRisk = 0;
    let behindSchedule = 0;
    const projectDetails = [];

    for (const project of activeProjects) {
      // Get project stats
      const stats = await getProjectStats(project.id);
      if (!stats) continue;

      const progress = stats.progressPercentage || 0;
      const endDate = project.endDate ? new Date(project.endDate) : new Date();
      const startDate = project.startDate ? new Date(project.startDate) : new Date();
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

      let timelineStatus: 'on_track' | 'at_risk' | 'behind_schedule';
      
      // Determine timeline status
      if (progress >= expectedProgress - 5) {
        timelineStatus = 'on_track';
        onTrack++;
      } else if (progress >= expectedProgress - 15) {
        timelineStatus = 'at_risk';
        atRisk++;
      } else {
        timelineStatus = 'behind_schedule';
        behindSchedule++;
      }

      projectDetails.push({
        id: project.id,
        name: project.name,
        progress,
        expectedProgress: Math.min(expectedProgress, 100),
        timelineStatus,
        daysRemaining: Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
      });
    }

    return {
      summary: {
        total: activeProjects.length,
        onTrack,
        atRisk,
        behindSchedule,
      },
      projects: projectDetails.sort((a, b) => {
        // Sort by status priority (behind > at risk > on track) then by progress
        const statusPriority = { behind_schedule: 0, at_risk: 1, on_track: 2 };
        if (statusPriority[a.timelineStatus] !== statusPriority[b.timelineStatus]) {
          return statusPriority[a.timelineStatus] - statusPriority[b.timelineStatus];
        }
        return a.progress - b.progress;
      }),
    };
  } catch (error: unknown) {
    logger.error('[getProjectTimelineOverview] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get team performance metrics for dashboard
 * Returns performance data grouped by team members
 */
export async function getTeamPerformanceMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get all team members (exclude owner)
    const teamMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(ne(users.role, 'owner'));

    const performanceData = [];

    for (const member of teamMembers) {
      // Get task statistics for this user
      const taskStats = await getUserTaskStats(member.id);
      
      // Get completed tasks in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCompletedTasks = await db
        .select({ count: count() })
        .from(taskAssignments)
        .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
        .where(
          and(
            eq(taskAssignments.userId, member.id),
            eq(tasks.status, 'completed'),
            gte(tasks.updatedAt, thirtyDaysAgo)
          )
        );

      const completedLast30Days = recentCompletedTasks[0]?.count || 0;

      // Calculate completion rate
      const totalAssigned = taskStats?.totalTasks || 0;
      const completed = taskStats?.completedTasks || 0;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

      // Calculate on-time completion rate (tasks completed before or on due date)
      const onTimeCompletedResult = await db
        .select({ count: count() })
        .from(taskAssignments)
        .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
        .where(
          and(
            eq(taskAssignments.userId, member.id),
            eq(tasks.status, 'completed'),
            sql`${tasks.updatedAt} <= ${tasks.endDate}`
          )
        );

      const onTimeCompleted = onTimeCompletedResult[0]?.count || 0;
      const onTimeRate = completed > 0 ? (onTimeCompleted / completed) * 100 : 0;

      performanceData.push({
        userId: member.id,
        userName: member.name || 'Unknown',
        role: member.role,
        totalTasks: totalAssigned,
        completedTasks: completed,
        inProgressTasks: taskStats?.inProgressTasks || 0,
        completionRate: Math.round(completionRate),
        onTimeRate: Math.round(onTimeRate),
        completedLast30Days,
      });
    }

    // Calculate team averages
    const teamSize = performanceData.length;
    const avgCompletionRate = teamSize > 0
      ? performanceData.reduce((sum, m) => sum + m.completionRate, 0) / teamSize
      : 0;
    const avgOnTimeRate = teamSize > 0
      ? performanceData.reduce((sum, m) => sum + m.onTimeRate, 0) / teamSize
      : 0;
    const totalTasksAssigned = performanceData.reduce((sum, m) => sum + m.totalTasks, 0);
    const totalCompleted = performanceData.reduce((sum, m) => sum + m.completedTasks, 0);

    return {
      summary: {
        teamSize,
        avgCompletionRate: Math.round(avgCompletionRate),
        avgOnTimeRate: Math.round(avgOnTimeRate),
        totalTasksAssigned,
        totalCompleted,
      },
      members: performanceData.sort((a, b) => b.completionRate - a.completionRate),
    };
  } catch (error: unknown) {
    logger.error('[getTeamPerformanceMetrics] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get QC status summary for dashboard
 * Returns inspection and defect statistics
 */
export async function getQCStatusSummary() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get inspection statistics
    const totalInspectionsResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(isNull(projects.archivedAt));

    const totalInspections = totalInspectionsResult[0]?.count || 0;

    const passedInspectionsResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(taskChecklists.status, 'completed'),
          isNull(projects.archivedAt)
        )
      );

    const passedInspections = passedInspectionsResult[0]?.count || 0;

    const failedInspectionsResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(taskChecklists.status, 'failed'),
          isNull(projects.archivedAt)
        )
      );

    const failedInspections = failedInspectionsResult[0]?.count || 0;

    const pendingInspectionsResult = await db
      .select({ count: count() })
      .from(taskChecklists)
      .innerJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(taskChecklists.status, 'pending_inspection'),
          isNull(projects.archivedAt)
        )
      );

    const pendingInspections = pendingInspectionsResult[0]?.count || 0;

    // Calculate pass rate
    const completedInspections = passedInspections + failedInspections;
    const passRate = completedInspections > 0 ? (passedInspections / completedInspections) * 100 : 0;

    // Get defect statistics by severity
    const defectsBySeverity = await db
      .select({
        severity: defects.severity,
        count: count(),
      })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          ne(defects.status, 'resolved'),
          isNull(projects.archivedAt)
        )
      )
      .groupBy(defects.severity);

    const criticalDefects = defectsBySeverity.find(d => d.severity === 'critical')?.count || 0;
    const highDefects = defectsBySeverity.find(d => d.severity === 'high')?.count || 0;
    const mediumDefects = defectsBySeverity.find(d => d.severity === 'medium')?.count || 0;
    const lowDefects = defectsBySeverity.find(d => d.severity === 'low')?.count || 0;
    const totalOpenDefects = criticalDefects + highDefects + mediumDefects + lowDefects;

    // Get defects resolved in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResolvedDefects = await db
      .select({ count: count() })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.status, 'resolved'),
          gte(defects.updatedAt, thirtyDaysAgo),
          isNull(projects.archivedAt)
        )
      );

    const resolvedLast30Days = recentResolvedDefects[0]?.count || 0;

    // Get average resolution time (in days) for defects resolved in last 30 days
    const resolvedDefectsWithTime = await db
      .select({
        createdAt: defects.createdAt,
        updatedAt: defects.updatedAt,
      })
      .from(defects)
      .innerJoin(tasks, eq(defects.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(defects.status, 'resolved'),
          gte(defects.updatedAt, thirtyDaysAgo),
          isNull(projects.archivedAt)
        )
      );

    let avgResolutionTime = 0;
    if (resolvedDefectsWithTime.length > 0) {
      const totalDays = resolvedDefectsWithTime.reduce((sum, d) => {
        const created = new Date(d.createdAt);
        const resolved = new Date(d.updatedAt);
        const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgResolutionTime = Math.round(totalDays / resolvedDefectsWithTime.length);
    }

    return {
      inspections: {
        total: totalInspections,
        passed: passedInspections,
        failed: failedInspections,
        pending: pendingInspections,
        passRate: Math.round(passRate),
      },
      defects: {
        total: totalOpenDefects,
        critical: criticalDefects,
        high: highDefects,
        medium: mediumDefects,
        low: lowDefects,
        resolvedLast30Days,
        avgResolutionTime,
      },
    };
  } catch (error: unknown) {
    logger.error('[getQCStatusSummary] Error:', (error as Error).message);
    return null;
  }
}

/**
 * Get recent activities with more details for dashboard
 * Enhanced version with project and task names
 */
export async function getRecentActivitiesEnhanced(limit = 15) {
  const db = await getDb();
  if (!db) return [];

  try {
    const activities = await db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        userName: users.name,
        userRole: users.role,
        action: activityLog.action,
        details: activityLog.details,
        projectId: activityLog.projectId,
        projectName: projects.name,
        taskId: activityLog.taskId,
        taskName: tasks.name,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .leftJoin(projects, eq(activityLog.projectId, projects.id))
      .leftJoin(tasks, eq(activityLog.taskId, tasks.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    return activities;
  } catch (error: unknown) {
    logger.error('[getRecentActivitiesEnhanced] Error:', (error as Error).message);
    return [];
  }
}

// ============================================
// Inspection Statistics Helpers
// ============================================

/**
 * Get inspection pass/fail rate statistics
 */
export async function getInspectionPassFailRate(params: {
  projectId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  passRate: number;
  failRate: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { projectId, startDate, endDate } = params;

  // Build WHERE conditions
  const conditions = [];
  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  if (startDate) {
    conditions.push(gte(taskChecklists.inspectedAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(taskChecklists.inspectedAt, new Date(endDate)));
  }

  // Get all completed inspections
  const inspections = await db
    .select({
      id: taskChecklists.id,
      status: taskChecklists.status,
      taskId: taskChecklists.taskId,
    })
    .from(taskChecklists)
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .where(
      and(
        eq(taskChecklists.status, "completed"),
        isNotNull(taskChecklists.inspectedAt),
        ...(conditions.length > 0 ? conditions : [])
      )
    );

  // Count pass/fail for each inspection
  let passedCount = 0;
  let failedCount = 0;

  for (const inspection of inspections) {
    // Get checklist item results
    const results = await db
      .select({ result: checklistItemResults.result })
      .from(checklistItemResults)
      .where(eq(checklistItemResults.taskChecklistId, inspection.id));

    // Check if any item failed
    const hasFailed = results.some((r) => r.result === "fail");
    if (hasFailed) {
      failedCount++;
    } else {
      passedCount++;
    }
  }

  const totalInspections = inspections.length;
  const passRate = totalInspections > 0 ? (passedCount / totalInspections) * 100 : 0;
  const failRate = totalInspections > 0 ? (failedCount / totalInspections) * 100 : 0;

  return {
    totalInspections,
    passedInspections: passedCount,
    failedInspections: failedCount,
    passRate: Math.round(passRate * 100) / 100,
    failRate: Math.round(failRate * 100) / 100,
  };
}

/**
 * Get defect trends over time
 */
export async function getDefectTrends(params: {
  projectId?: number;
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}): Promise<
  Array<{
    period: string;
    totalDefects: number;
    criticalDefects: number;
    highDefects: number;
    mediumDefects: number;
    lowDefects: number;
  }>
> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { projectId, startDate, endDate, groupBy = "week" } = params;

  // Build WHERE conditions
  const conditions = [];
  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  if (startDate) {
    conditions.push(gte(defects.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(defects.createdAt, new Date(endDate)));
  }

  // Get all defects
  const allDefects = await db
    .select({
      id: defects.id,
      severity: defects.severity,
      createdAt: defects.createdAt,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .where(and(...(conditions.length > 0 ? conditions : [sql`1=1`])));

  // Group by period
  const grouped = new Map<
    string,
    {
      period: string;
      totalDefects: number;
      criticalDefects: number;
      highDefects: number;
      mediumDefects: number;
      lowDefects: number;
    }
  >();

  for (const defect of allDefects) {
    const date = new Date(defect.createdAt);
    let period: string;

    if (groupBy === "day") {
      period = date.toISOString().split("T")[0];
    } else if (groupBy === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      period = weekStart.toISOString().split("T")[0];
    } else {
      // month
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!grouped.has(period)) {
      grouped.set(period, {
        period,
        totalDefects: 0,
        criticalDefects: 0,
        highDefects: 0,
        mediumDefects: 0,
        lowDefects: 0,
      });
    }

    const stats = grouped.get(period)!;
    stats.totalDefects++;

    if (defect.severity === "critical") stats.criticalDefects++;
    else if (defect.severity === "high") stats.highDefects++;
    else if (defect.severity === "medium") stats.mediumDefects++;
    else if (defect.severity === "low") stats.lowDefects++;
  }

  return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get inspector performance metrics
 */
export async function getInspectorPerformance(params: {
  projectId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<
  Array<{
    inspectorId: number;
    inspectorName: string;
    totalInspections: number;
    passedInspections: number;
    failedInspections: number;
    passRate: number;
    avgInspectionTime: number | null;
  }>
> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { projectId, startDate, endDate } = params;

  // Build WHERE conditions
  const conditions = [];
  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  if (startDate) {
    conditions.push(gte(taskChecklists.inspectedAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(taskChecklists.inspectedAt, new Date(endDate)));
  }

  // Get all completed inspections with inspector info
  const inspections = await db
    .select({
      checklistId: taskChecklists.id,
      inspectorId: taskChecklists.inspectedBy,
      inspectorName: users.name,
      inspectedAt: taskChecklists.inspectedAt,
      createdAt: taskChecklists.createdAt,
    })
    .from(taskChecklists)
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .leftJoin(users, eq(taskChecklists.inspectedBy, users.id))
    .where(
      and(
        eq(taskChecklists.status, "completed"),
        isNotNull(taskChecklists.inspectedBy),
        isNotNull(taskChecklists.inspectedAt),
        ...(conditions.length > 0 ? conditions : [])
      )
    );

  // Group by inspector
  const inspectorMap = new Map<
    number,
    {
      inspectorId: number;
      inspectorName: string;
      totalInspections: number;
      passedInspections: number;
      failedInspections: number;
      totalInspectionTime: number;
    }
  >();

  for (const inspection of inspections) {
    if (!inspection.inspectorId) continue;

    if (!inspectorMap.has(inspection.inspectorId)) {
      inspectorMap.set(inspection.inspectorId, {
        inspectorId: inspection.inspectorId,
        inspectorName: inspection.inspectorName || "Unknown",
        totalInspections: 0,
        passedInspections: 0,
        failedInspections: 0,
        totalInspectionTime: 0,
      });
    }

    const stats = inspectorMap.get(inspection.inspectorId)!;
    stats.totalInspections++;

    // Calculate inspection time (if available)
    if (inspection.inspectedAt && inspection.createdAt) {
      const timeSpent =
        new Date(inspection.inspectedAt).getTime() - new Date(inspection.createdAt).getTime();
      stats.totalInspectionTime += timeSpent;
    }

    // Check if inspection passed or failed
    const results = await db
      .select({ result: checklistItemResults.result })
      .from(checklistItemResults)
      .where(eq(checklistItemResults.taskChecklistId, inspection.checklistId));

    const hasFailed = results.some((r) => r.result === "fail");
    if (hasFailed) {
      stats.failedInspections++;
    } else {
      stats.passedInspections++;
    }
  }

  // Calculate metrics
  return Array.from(inspectorMap.values()).map((stats) => ({
    inspectorId: stats.inspectorId,
    inspectorName: stats.inspectorName,
    totalInspections: stats.totalInspections,
    passedInspections: stats.passedInspections,
    failedInspections: stats.failedInspections,
    passRate:
      stats.totalInspections > 0
        ? Math.round((stats.passedInspections / stats.totalInspections) * 10000) / 100
        : 0,
    avgInspectionTime:
      stats.totalInspections > 0
        ? Math.round(stats.totalInspectionTime / stats.totalInspections / 1000 / 60) // in minutes
        : null,
  }));
}

/**
 * Get checklist item statistics
 */
export async function getChecklistItemStatistics(params: {
  projectId?: number;
  templateId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<
  Array<{
    itemId: number;
    itemText: string;
    totalChecks: number;
    passCount: number;
    failCount: number;
    naCount: number;
    failRate: number;
  }>
> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { projectId, templateId, startDate, endDate } = params;

  // Build WHERE conditions
  const conditions = [];
  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  if (templateId) {
    conditions.push(eq(taskChecklists.templateId, templateId));
  }
  if (startDate) {
    conditions.push(gte(taskChecklists.inspectedAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(taskChecklists.inspectedAt, new Date(endDate)));
  }

  // Get all checklist item results
  const results = await db
    .select({
      itemId: checklistTemplateItems.id,
      itemText: checklistTemplateItems.itemText,
      result: checklistItemResults.result,
    })
    .from(checklistItemResults)
    .leftJoin(
      checklistTemplateItems,
      eq(checklistItemResults.templateItemId, checklistTemplateItems.id)
    )
    .leftJoin(taskChecklists, eq(checklistItemResults.taskChecklistId, taskChecklists.id))
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .where(and(...(conditions.length > 0 ? conditions : [sql`1=1`])));

  // Group by item
  const itemMap = new Map<
    number,
    {
      itemId: number;
      itemText: string;
      totalChecks: number;
      passCount: number;
      failCount: number;
      naCount: number;
    }
  >();

  for (const result of results) {
    if (!result.itemId) continue;

    if (!itemMap.has(result.itemId)) {
      itemMap.set(result.itemId, {
        itemId: result.itemId,
        itemText: result.itemText || "Unknown",
        totalChecks: 0,
        passCount: 0,
        failCount: 0,
        naCount: 0,
      });
    }

    const stats = itemMap.get(result.itemId)!;
    stats.totalChecks++;

    if (result.result === "pass") stats.passCount++;
    else if (result.result === "fail") stats.failCount++;
    else if (result.result === "na") stats.naCount++;
  }

  // Calculate fail rate
  return Array.from(itemMap.values())
    .map((stats) => ({
      ...stats,
      failRate:
        stats.totalChecks > 0
          ? Math.round((stats.failCount / stats.totalChecks) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.failRate - a.failRate); // Sort by fail rate descending
}

/**
 * Get project quality score
 */
export async function getProjectQualityScore(projectId: number): Promise<{
  projectId: number;
  qualityScore: number;
  totalInspections: number;
  passedInspections: number;
  totalDefects: number;
  criticalDefects: number;
  resolvedDefects: number;
  grade: "A" | "B" | "C" | "D" | "F";
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get inspection stats
  const inspectionStats = await getInspectionPassFailRate({ projectId });

  // Get defect stats
  const allDefects = await db
    .select({
      id: defects.id,
      severity: defects.severity,
      status: defects.status,
    })
    .from(defects)
    .where(eq(defects.projectId, projectId));

  const totalDefects = allDefects.length;
  const criticalDefects = allDefects.filter((d) => d.severity === "critical").length;
  const resolvedDefects = allDefects.filter((d) => d.status === "closed").length;

  // Calculate quality score (0-100)
  let score = 100;

  // Deduct points for failed inspections
  score -= inspectionStats.failRate * 0.5;

  // Deduct points for defects
  const defectPenalty = Math.min(totalDefects * 2, 30); // Max 30 points
  score -= defectPenalty;

  // Deduct extra points for critical defects
  const criticalPenalty = Math.min(criticalDefects * 5, 20); // Max 20 points
  score -= criticalPenalty;

  // Add bonus for resolved defects
  if (totalDefects > 0) {
    const resolutionBonus = (resolvedDefects / totalDefects) * 10;
    score += resolutionBonus;
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  return {
    projectId,
    qualityScore: Math.round(score * 100) / 100,
    totalInspections: inspectionStats.totalInspections,
    passedInspections: inspectionStats.passedInspections,
    totalDefects,
    criticalDefects,
    resolvedDefects,
    grade,
  };
}


// ============================================================================
// Escalation Functions (Stub implementations)
// ============================================================================

// Type for transformed escalation rule (with parsed JSON fields)
type TransformedEscalationRule = typeof escalationRules.$inferSelect & {
  triggerType: string;
  hoursUntilEscalation: number;
  escalateToRoles: string[];
  escalateToUserIds: number[];
  enabled: boolean;
};

export async function getAllEscalationRules(): Promise<TransformedEscalationRule[]> {
  const db = await getDb();
  if (!db) return [];
  const rules = await db.select().from(escalationRules);
  return rules.map(r => ({
    ...r,
    triggerType: r.eventType,
    hoursUntilEscalation: r.thresholdUnit === 'hours' ? r.thresholdValue : r.thresholdValue * 24,
    escalateToRoles: r.notifyRoles ? JSON.parse(r.notifyRoles) : [],
    escalateToUserIds: r.notifyUsers ? JSON.parse(r.notifyUsers) : [],
    enabled: Boolean(r.isActive),
  }));
}

export async function getEscalationRuleById(id: number): Promise<TransformedEscalationRule | null> {
  const db = await getDb();
  if (!db) return null;
  const [rule] = await db.select().from(escalationRules).where(eq(escalationRules.id, id)).limit(1);
  if (!rule) return null;
  return {
    ...rule,
    triggerType: rule.eventType,
    hoursUntilEscalation: rule.thresholdUnit === 'hours' ? rule.thresholdValue : rule.thresholdValue * 24,
    escalateToRoles: rule.notifyRoles ? JSON.parse(rule.notifyRoles) : [],
    escalateToUserIds: rule.notifyUsers ? JSON.parse(rule.notifyUsers) : [],
    enabled: Boolean(rule.isActive),
  };
}

export async function createEscalationRule(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const hours = data.hoursUntilEscalation || 24;
  const thresholdUnit = hours < 24 ? 'hours' : 'days';
  const thresholdValue = hours < 24 ? hours : Math.ceil(hours / 24);
  
  const result = await db.insert(escalationRules).values({
    name: data.name,
    description: data.description || null,
    eventType: data.triggerType,
    thresholdValue,
    thresholdUnit,
    notifyRoles: JSON.stringify(data.escalateToRoles || []),
    notifyUsers: data.escalateToUserIds ? JSON.stringify(data.escalateToUserIds) : null,
    isActive: data.enabled !== false ? 1 : 0,
    createdBy: data.createdBy,
  });
  
  return { id: Number(result.insertId), ...data };
}

export async function updateEscalationRule(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.triggerType !== undefined) updateData.eventType = data.triggerType;
  if (data.hoursUntilEscalation !== undefined) {
    const hours = data.hoursUntilEscalation;
    updateData.thresholdUnit = hours < 24 ? 'hours' : 'days';
    updateData.thresholdValue = hours < 24 ? hours : Math.ceil(hours / 24);
  }
  if (data.escalateToRoles !== undefined) updateData.notifyRoles = JSON.stringify(data.escalateToRoles);
  if (data.escalateToUserIds !== undefined) updateData.notifyUsers = JSON.stringify(data.escalateToUserIds);
  if (data.enabled !== undefined) updateData.isActive = data.enabled ? 1 : 0;
  
  await db.update(escalationRules).set(updateData).where(eq(escalationRules.id, id));
  return { id, ...data };
}

export async function deleteEscalationRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(escalationRules).where(eq(escalationRules.id, id));
  return true;
}

export async function getAllEscalationLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(escalationLogs);
}

export async function getEscalationLogsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(escalationLogs)
    .where(and(
      eq(escalationLogs.eventType, entityType as any),
      eq(escalationLogs.entityId, entityId)
    ));
}

export async function resolveEscalationLog(id: number, resolvedBy: number, resolutionNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(escalationLogs)
    .set({
      resolvedAt: new Date(),
      resolvedBy: resolvedBy,
    })
    .where(eq(escalationLogs.id, id));
  
  return true;
}

export async function getEscalationStatistics() {
  const db = await getDb();
  if (!db) return {
    totalEscalations: 0,
    resolvedEscalations: 0,
    pendingEscalations: 0,
    averageResolutionTime: 0,
  };
  
  const logs = await db.select().from(escalationLogs);
  const resolvedLogs = logs.filter(log => log.resolvedAt !== null);
  const pendingLogs = logs.filter(log => log.resolvedAt === null);
  
  // คำนวณเวลาเฉลี่ยในการแก้ไข (ในหน่วยชั่วโมง)
  let averageResolutionTime = 0;
  if (resolvedLogs.length > 0) {
    const totalResolutionTime = resolvedLogs.reduce((sum, log) => {
      if (log.resolvedAt && log.escalatedAt) {
        const diff = log.resolvedAt.getTime() - log.escalatedAt.getTime();
        return sum + (diff / (1000 * 60 * 60)); // แปลงเป็นชั่วโมง
      }
      return sum;
    }, 0);
    averageResolutionTime = Math.round(totalResolutionTime / resolvedLogs.length);
  }
  
  return {
    totalEscalations: logs.length,
    resolvedEscalations: resolvedLogs.length,
    pendingEscalations: pendingLogs.length,
    averageResolutionTime,
  };
}

export async function checkAndTriggerEscalations() {
  const db = await getDb();
  if (!db) {
    logger.warn('[Escalation] Database not available');
    return [];
  }

  try {
    // ดึงกฎ escalation ที่เปิดใช้งานทั้งหมด
    const rules = await db.select().from(escalationRules).where(eq(escalationRules.isActive, true));
    
    if (rules.length === 0) {
      logger.info('[Escalation] No active escalation rules found');
      return [];
    }

    const triggeredEscalations = [];
    const now = new Date();

    for (const rule of rules) {
      const thresholdHours = rule.thresholdValue || 24;
      const thresholdDate = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);

      // ตรวจสอบตาม event type
      if (rule.eventType === 'failed_inspection') {
        // ค้นหา inspections ที่ fail และยังไม่ได้แก้ไข
        const failedInspections = await db.select({
          id: taskChecklists.id,
          taskId: taskChecklists.taskId,
          inspectedAt: taskChecklists.inspectedAt,
        })
          .from(taskChecklists)
          .where(
            and(
              eq(taskChecklists.status, 'fail'),
              lt(taskChecklists.inspectedAt, thresholdDate)
            )
          );

        // สร้าง escalation log สำหรับแต่ละ failed inspection
        for (const inspection of failedInspections) {
          // ตรวจสอบว่ามี escalation log อยู่แล้วหรือไม่
          const existingLog = await db.select()
            .from(escalationLogs)
            .where(
              and(
                eq(escalationLogs.ruleId, rule.id),
                eq(escalationLogs.eventType, 'failed_inspection'),
                eq(escalationLogs.entityId, inspection.id),
                isNull(escalationLogs.resolvedAt)
              )
            )
            .limit(1);

          if (existingLog.length === 0) {
            // สร้าง escalation log ใหม่
            const notifiedUsers = rule.notifyUsers || '[]';
            await db.insert(escalationLogs).values({
              ruleId: rule.id,
              eventType: 'failed_inspection',
              entityId: inspection.id,
              notifiedUsers,
            });

            triggeredEscalations.push({
              ruleId: rule.id,
              eventType: 'failed_inspection',
              entityId: inspection.id,
            });

            // ส่ง notification ถึงผู้ที่เกี่ยวข้อง
            await sendEscalationNotifications(rule, 'failed_inspection', inspection.id, inspection.taskId);
          }
        }
      }

      if (rule.eventType === 'unresolved_defect') {
        // ค้นหา defects ที่ยังไม่ได้แก้ไข
        const unresolvedDefects = await db.select({
          id: defects.id,
          taskId: defects.taskId,
          projectId: defects.projectId,
          createdAt: defects.createdAt,
        })
          .from(defects)
          .where(
            and(
              ne(defects.status, 'resolved'),
              lt(defects.createdAt, thresholdDate)
            )
          );

        for (const defect of unresolvedDefects) {
          const existingLog = await db.select()
            .from(escalationLogs)
            .where(
              and(
                eq(escalationLogs.ruleId, rule.id),
                eq(escalationLogs.eventType, 'unresolved_defect'),
                eq(escalationLogs.entityId, defect.id),
                isNull(escalationLogs.resolvedAt)
              )
            )
            .limit(1);

          if (existingLog.length === 0) {
            const notifiedUsers = rule.notifyUsers || '[]';
            await db.insert(escalationLogs).values({
              ruleId: rule.id,
              eventType: 'unresolved_defect',
              entityId: defect.id,
              notifiedUsers,
            });

            triggeredEscalations.push({
              ruleId: rule.id,
              eventType: 'unresolved_defect',
              entityId: defect.id,
            });

            await sendEscalationNotifications(rule, 'unresolved_defect', defect.id, defect.taskId, defect.projectId);
          }
        }
      }

      if (rule.eventType === 'overdue_task') {
        // ค้นหา tasks ที่เลยกำหนด
        const overdueTasks = await db.select({
          id: tasks.id,
          projectId: tasks.projectId,
          dueDate: tasks.endDate,
        })
          .from(tasks)
          .where(
            and(
              ne(tasks.status, 'completed'),
              lt(tasks.endDate, thresholdDate)
            )
          );

        for (const task of overdueTasks) {
          const existingLog = await db.select()
            .from(escalationLogs)
            .where(
              and(
                eq(escalationLogs.ruleId, rule.id),
                eq(escalationLogs.eventType, 'overdue_task'),
                eq(escalationLogs.entityId, task.id),
                isNull(escalationLogs.resolvedAt)
              )
            )
            .limit(1);

          if (existingLog.length === 0) {
            const notifiedUsers = rule.notifyUsers || '[]';
            await db.insert(escalationLogs).values({
              ruleId: rule.id,
              eventType: 'overdue_task',
              entityId: task.id,
              notifiedUsers,
            });

            triggeredEscalations.push({
              ruleId: rule.id,
              eventType: 'overdue_task',
              entityId: task.id,
            });

            await sendEscalationNotifications(rule, 'overdue_task', task.id, task.id, task.projectId);
          }
        }
      }
    }

    logger.info(`[Escalation] Triggered ${triggeredEscalations.length} escalations`);
    return triggeredEscalations;
  } catch (error) {
    logger.error('[Escalation] Error during escalation check:', error);
    throw error;
  }
}

// Helper function สำหรับส่ง notifications
async function sendEscalationNotifications(
  rule: any,
  eventType: string,
  entityId: number,
  taskId?: number,
  projectId?: number
) {
  try {
    const userIds = rule.notifyUsers ? JSON.parse(rule.notifyUsers) : [];
    
    // ส่ง notification ให้แต่ละ user
    for (const userId of userIds) {
      await sendNotification({
        userId,
        type: 'escalation',
        priority: 'high',
        title: `Escalation: ${rule.name}`,
        content: rule.notificationTemplate || `Escalation triggered for ${eventType}`,
        relatedTaskId: taskId,
        relatedProjectId: projectId,
      });
    }
  } catch (error) {
    logger.error('[Escalation] Error sending notifications:', error);
  }
}

// ============================================
// Role Templates
// ============================================

export async function getAllRoleTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const { roleTemplates } = await import("../drizzle/schema");
  return await db.select().from(roleTemplates).orderBy(desc(roleTemplates.createdAt));
}

export async function getRoleTemplatesByType(roleType: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { roleTemplates } = await import("../drizzle/schema");
  // Note: roleType field doesn't exist in schema, returning all templates
  return await db
    .select()
    .from(roleTemplates)
    .orderBy(desc(roleTemplates.isDefault), desc(roleTemplates.createdAt));
}

export async function getDefaultRoleTemplate(roleType: string) {
  const db = await getDb();
  if (!db) return null;
  
  const { roleTemplates } = await import("../drizzle/schema");
  // Note: roleType field doesn't exist in schema, returning first default template
  const results = await db
    .select()
    .from(roleTemplates)
    .where(eq(roleTemplates.isDefault, 1))
    .limit(1);
  
  return results[0] || null;
}

export async function getRoleTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { roleTemplates } = await import("../drizzle/schema");
  const results = await db
    .select()
    .from(roleTemplates)
    .where(eq(roleTemplates.id, id))
    .limit(1);
  
  return results[0] || null;
}

export async function getRoleTemplatePermissions(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { roleTemplates, permissions } = await import("../drizzle/schema");
  
  // Get the template
  const template = await getRoleTemplateById(templateId);
  if (!template) return [];
  
  // Parse permissions JSON
  try {
    const permissionIds = JSON.parse(template.permissions as string);
    if (!Array.isArray(permissionIds)) return [];
    
    // Get permission details
    return await db
      .select()
      .from(permissions)
      .where(inArray(permissions.id, permissionIds));
  } catch (error) {
    console.error("Error parsing role template permissions:", error);
    return [];
  }
}

export async function createRoleTemplate(data: {
  name: string;
  roleType?: string;
  description?: string;
  isDefault?: boolean;
  permissionIds: number[];
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { roleTemplates } = await import("../drizzle/schema");
  
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(roleTemplates)
      .set({ isDefault: 0 });
  }
  
  const result = await db.insert(roleTemplates).values({
    name: data.name,
    description: data.description || null,
    permissions: JSON.stringify(data.permissionIds),
    isDefault: data.isDefault ? 1 : 0,
    createdBy: data.createdBy,
  });
  
  return result[0].insertId;
}

export async function updateRoleTemplate(
  id: number,
  data: {
    name?: string;
    description?: string;
    isDefault?: boolean;
    isActive?: boolean;
    permissionIds?: number[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { roleTemplates } = await import("../drizzle/schema");
  
  // Get current template
  const currentTemplate = await getRoleTemplateById(id);
  if (!currentTemplate) {
    throw new Error("Template not found");
  }
  
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(roleTemplates)
      .set({ isDefault: 0 });
  }
  
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault ? 1 : 0;
  if (data.permissionIds) updateData.permissions = JSON.stringify(data.permissionIds);
  
  await db.update(roleTemplates).set(updateData).where(eq(roleTemplates.id, id));
}

export async function deleteRoleTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { roleTemplates } = await import("../drizzle/schema");
  
  // Check if this is a default template
  const template = await getRoleTemplateById(id);
  if (template?.isDefault) {
    throw new Error("Cannot delete default template");
  }
  
  await db.delete(roleTemplates).where(eq(roleTemplates.id, id));
}

export async function applyRoleTemplateToUser(data: {
  userId: number;
  templateId: number;
  grantedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { userPermissions } = await import("../drizzle/schema");
  
  // Get template permissions
  const permissions = await getRoleTemplatePermissions(data.templateId);
  if (permissions.length === 0) {
    throw new Error("Template has no permissions");
  }
  
  // Delete existing permissions for this user
  await db.delete(userPermissions).where(eq(userPermissions.userId, data.userId));
  
  // Insert new permissions
  const permissionValues = permissions.map((perm) => ({
    userId: data.userId,
    permissionId: perm.id,
    grantedBy: data.grantedBy,
    grantedAt: new Date(),
  }));
  
  await db.insert(userPermissions).values(permissionValues);
}
