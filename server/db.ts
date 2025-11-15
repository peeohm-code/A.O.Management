import { eq, and, or, isNull, isNotNull, sql, desc, asc, count, inArray, like, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
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
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createNotification as sendNotification } from "./notificationService";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance with connection pooling
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create connection pool with optimized settings
      const poolConnection = mysql.createPool({
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
      _db = drizzle(poolConnection);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */
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

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name: string; email?: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: any = { name: data.name };
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
  budget?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert date strings to Date objects
  const values: any = {
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
  if (data.budget !== undefined) values.budget = data.budget;

  const [result] = await db.insert(projects).values(values);
  
  // @ts-ignore - Handle BigInt conversion properly
  const projectId = parseInt(String(result.insertId));
  
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

  const totalPercentage = Object.values(checks).reduce((sum, val) => sum + val, 0);

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
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length;
  const notStartedTasks = projectTasks.filter(t => t.status === 'not_started').length;
  const overdueTasks = projectTasks.filter(t => 
    t.endDate && new Date(t.endDate) < now && t.status !== 'completed'
  ).length;

  // Calculate overall progress (average of all task progress)
  const totalProgress = projectTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
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
  const taskIds = projectTasks.map(t => t.id);
  
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
      (await db.select({ id: taskChecklists.id }).from(taskChecklists).where(inArray(taskChecklists.taskId, taskIds))).map(tc => tc.id)
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

  return result.map((r) => r.projects);
}

export async function addProjectMember(data: {
  projectId: number;
  userId: number;
  role: "project_manager" | "qc_inspector" | "field_engineer";
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
  startDate?: string;
  endDate?: string;
  assigneeId?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { createdBy, startDate, endDate, ...taskData } = data;
  return await db.insert(tasks).values({
    ...taskData,
    status: (taskData.status as any) || "todo",
    priority: (taskData.priority as any) || "medium",
    progress: 0,
    // Keep dates as strings (YYYY-MM-DD format) - database schema uses varchar(10)
    startDate: startDate || null,
    endDate: endDate || null,
  });
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

  return await db.update(checklistTemplates).set(data).where(eq(checklistTemplates.id, id));
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
    templates.map(async (template) => {
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
 * Task Checklist Management
 */
export async function createTaskChecklist(data: {
  taskId: number;
  templateId: number;
  stage: "pre_execution" | "in_progress" | "post_execution";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(taskChecklists).values({
    taskId: data.taskId,
    templateId: data.templateId,
    stage: data.stage,
    status: "not_started",
  });
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
  const result = [];
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
  const result = [];
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
    })
    .from(taskChecklists)
    .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
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
      taskName: tasks.name,
      checklistTemplateName: checklistTemplates.name,
    })
    .from(defects)
    .leftJoin(tasks, eq(defects.taskId, tasks.id))
    .leftJoin(taskChecklists, eq(defects.checklistId, taskChecklists.id))
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
    .orderBy(desc(defects.createdAt));
  
  return results;
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
    isRead: false,
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
  } catch (error) {
    console.error('[getUserNotifications] Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return result;
  } catch (error) {
    console.error('[markNotificationAsRead] Error updating notification:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    return result;
  } catch (error) {
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
  // @ts-ignore
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
  }>;
  generalComments?: string;
  photoUrls?: string[]; // Array of photo URLs
  signature?: string; // Base64 encoded signature image
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // 1. Save all checklist item results
    const itemResultPromises = data.itemResults.map((item) =>
      db.insert(checklistItemResults).values({
        taskChecklistId: data.taskChecklistId,
        templateItemId: item.templateItemId,
        result: item.result,
      })
    );
    const insertedResults = await Promise.all(itemResultPromises);

    // 2. Calculate overall status
    const failedCount = data.itemResults.filter((r) => r.result === "fail").length;
    const passedCount = data.itemResults.filter((r) => r.result === "pass").length;
    const overallStatus = failedCount > 0 ? "failed" : "completed";

  // @ts-ignore
    // 3. Update task checklist
    // @ts-ignore
    // @ts-ignore
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
      const defectPromises = failedItems.map(async (item, index) => {
  // @ts-ignore
        // Find the result ID for this item
    // @ts-ignore
        const resultId = insertedResults[data.itemResults.indexOf(item)][0]?.insertId;
        
        return db.insert(defects).values({
          taskId: data.taskId,
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
  } catch (error) {
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
  // @ts-ignore
  comment?: string;
  photoUrls?: string;
  inspectedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(checklistItemResults).values({
    // @ts-ignore
    checklistId: data.checklistId,
    itemId: data.itemId,
    result: data.result,
    comment: data.comment,
    photoUrls: data.photoUrls,
    inspectedBy: data.inspectedBy,
  });
}

/**
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
 * Get checklist results by checklist ID
 */
export async function getChecklistResults(checklistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    // @ts-ignore
    // @ts-ignore
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
  } catch (error) {
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
  } catch (error) {
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
  // @ts-ignore
      .select({
        priority: defects.severity,
        count: sql<number>`COUNT(*)`.as('count')
  // @ts-ignore
      })
      .from(defects)
      .groupBy(defects.severity);
    
    return Array.isArray(result) ? result : [];
  } catch (error) {
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
  } catch (error) {
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
  
  // @ts-ignore
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
  await db.update(archiveRules).set(data).where(eq(archiveRules.id, id));
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error("[Database] Failed to get dependent tasks:", error);
    return [];
  }
}
