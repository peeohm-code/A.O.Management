import { eq, and, or, desc, asc, isNull, isNotNull, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  taskComments,
  taskAttachments,
  taskFollowers,
  notifications,
  activityLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

/**
 * Project Management
 */
export async function createProject(data: {
  name: string;
  code?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  return result;
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

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projects)
    .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .where(eq(projectMembers.userId, userId));
}

export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) return null;

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

  // Determine project status
  let status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  if (completedTasks === totalTasks) {
    status = 'completed';
  } else if (overdueTasks > 0) {
    status = 'delayed';
  } else if (overdueTasks === 0 && inProgressTasks > 0) {
    status = 'on_track';
  } else {
    // Check if any tasks are approaching deadline (within 3 days)
    const approachingDeadline = projectTasks.some(t => {
      if (!t.endDate || t.status === 'completed') return false;
      const daysUntilDue = Math.ceil((new Date(t.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    });
    status = approachingDeadline ? 'at_risk' : 'on_track';
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
    status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
    progress: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
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

export async function addProjectMember(data: {
  projectId: number;
  userId: number;
  role: "owner" | "pm" | "engineer" | "qc" | "viewer";
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
  startDate?: Date;
  endDate?: Date;
  assigneeId?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(tasks).values({
    ...data,
    status: "todo",
    progress: 0,
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
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.progress !== undefined) updateData.progress = data.progress;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;

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

  return await db.insert(checklistTemplates).values({
    name: data.name,
    category: data.category,
    stage: data.stage,
    description: data.description,
    allowGeneralComments: data.allowGeneralComments,
    allowPhotos: data.allowPhotos,
    createdBy: data.createdBy,
  });
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
    status: "pending",
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
    })
    .from(taskChecklists)
    .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
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

  return await db
    .select()
    .from(taskChecklists)
    .orderBy(desc(taskChecklists.createdAt));
}

export async function updateTaskChecklist(
  id: number,
  data: Partial<{
    status: "pending" | "in_progress" | "passed" | "failed";
    inspectedBy: number;
    inspectedAt: Date;
    signature: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.inspectedBy !== undefined) updateData.inspectedBy = data.inspectedBy;
  if (data.inspectedAt !== undefined) updateData.inspectedAt = data.inspectedAt;
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
  comment?: string;
  photoUrls?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(checklistItemResults).values({
    taskChecklistId: data.taskChecklistId,
    templateItemId: data.templateItemId,
    result: data.result,
    comment: data.comment,
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
    status: "open",
  });
}

export async function getDefectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(defects).where(eq(defects.id, id)).limit(1);
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
    .where(eq(defects.status, "open"))
    .orderBy(desc(defects.severity));
}

export async function updateDefect(
  id: number,
  data: Partial<{
    status: "open" | "in_progress" | "resolved" | "verified";
    assignedTo: number;
    resolvedBy: number;
    resolvedAt: Date;
    resolutionPhotoUrls: string;
    resolutionComment: string;
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
  type: "task_assigned" | "inspection_requested" | "inspection_completed" | "defect_assigned" | "defect_resolved" | "comment_mention" | "task_updated" | "deadline_reminder";
  title: string;
  content?: string;
  relatedTaskId?: number;
  relatedProjectId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content,
    relatedTaskId: data.relatedTaskId,
    relatedProjectId: data.relatedProjectId,
    isRead: false,
  });
}

export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
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

  return await db.insert(activityLog).values(data);
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
    const overallStatus = failedCount > 0 ? "failed" : "passed";

    // 3. Update task checklist
    await db.update(taskChecklists).set({
      status: overallStatus,
      inspectedBy: data.inspectedBy,
      inspectedAt: new Date(),
      generalComments: data.generalComments || null,
      photoUrls: data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : null,
    }).where(eq(taskChecklists.id, data.taskChecklistId));

    // 4. Create defects for failed items
    const failedItems = data.itemResults.filter((r) => r.result === "fail");
    if (failedItems.length > 0) {
      // Get the corresponding result IDs
      const defectPromises = failedItems.map(async (item, index) => {
        // Find the result ID for this item
        const resultId = insertedResults[data.itemResults.indexOf(item)][0]?.insertId;
        
        return db.insert(defects).values({
          taskId: data.taskId,
          checklistItemResultId: resultId,
          title: `ไม่ผ่าน QC: ${item.itemText}`,
          description: `รายการตรวจสอบไม่ผ่าน: ${item.itemText}${data.generalComments ? `\n\nความเห็นเพิ่มเติม: ${data.generalComments}` : ''}`,
          photoUrls: data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : null,
          severity: "medium",
          reportedBy: data.inspectedBy,
          status: "open",
        });
      });
      await Promise.all(defectPromises);

      // 5. Update task status to rectification_needed if there are failed items
      await db.update(tasks).set({
        status: "rectification_needed",
      }).where(eq(tasks.id, data.taskId));
    } else {
      // All passed - update task status to completed
      await db.update(tasks).set({
        status: "completed",
        progress: 100,
      }).where(eq(tasks.id, data.taskId));
    }

    // 6. Get task details for notifications
    const task = await db.select().from(tasks).where(eq(tasks.id, data.taskId)).limit(1);
    if (task.length === 0) throw new Error("Task not found");

    // 7. Create notifications
    const notificationPromises = [];

    // Notify task assignee
    if (task[0].assigneeId) {
      notificationPromises.push(
        db.insert(notifications).values({
          userId: task[0].assigneeId,
          type: failedCount > 0 ? "inspection_failed" : "inspection_passed",
          title: failedCount > 0 ? "การตรวจสอบไม่ผ่าน" : "การตรวจสอบผ่าน",
          message: failedCount > 0
            ? `งาน "${task[0].name}" มีรายการตรวจสอบไม่ผ่าน ${failedCount} รายการ กรุณาแก้ไข`
            : `งาน "${task[0].name}" ผ่านการตรวจสอบคุณภาพแล้ว`,
          relatedTaskId: data.taskId,
          isRead: false,
        })
      );
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
          eq(pmMembersTable.role, "pm")
        ));

      for (const pm of pmMembers) {
        notificationPromises.push(
          db.insert(notifications).values({
            userId: pm.userId,
            type: "inspection_failed",
            title: "การตรวจสอบไม่ผ่าน",
            message: `งาน "${task[0].name}" มีรายการตรวจสอบไม่ผ่าน ${failedCount} รายการ`,
            relatedTaskId: data.taskId,
            isRead: false,
          })
        );
      }
    }

    await Promise.all(notificationPromises);

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
