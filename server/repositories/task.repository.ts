import { eq, and, desc, asc, count, inArray } from "drizzle-orm";
import {
  tasks,
  taskDependencies,
  taskComments,
  taskAttachments,
  taskFollowers,
  taskAssignments,
  activityLog,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";
import { bigIntToNumber } from "../utils/bigint";

/**
 * Task Repository
 * 
 * Handles all task-related database operations including:
 * - Task CRUD operations
 * - Task dependencies management
 * - Task comments and attachments
 * - Task followers and assignments
 * - Bulk operations
 */
export class TaskRepository extends BaseRepository {
  /**
   * Create new task
   */
  async createTask(data: {
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
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const { createdBy, startDate, endDate, ...taskData } = data;
    
    // Convert Date to string if needed
    const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
    
    const [result] = await this.db.insert(tasks).values({
      ...taskData,
      status: (taskData.status as any) || "todo",
      priority: (taskData.priority as any) || "medium",
      progress: 0,
      startDate: startDateStr || null,
      endDate: endDateStr || null,
    });
    
    const taskId = bigIntToNumber(result.insertId);
    return { insertId: taskId, id: taskId };
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: number) {
    if (!this.db) return undefined;

    const result = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get tasks by project ID
   */
  async getTasksByProject(projectId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.order));
  }

  /**
   * Get tasks by multiple project IDs (optimized to avoid N+1 queries)
   */
  async getTasksByProjectIds(projectIds: number[]) {
    if (!this.db) return [];
    if (projectIds.length === 0) return [];

    return await this.db
      .select()
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds))
      .orderBy(asc(tasks.order));
  }

  /**
   * Get tasks by assignee
   */
  async getTasksByAssignee(userId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.assigneeId, userId))
      .orderBy(desc(tasks.updatedAt));
  }

  /**
   * Get all tasks
   */
  async getAllTasks() {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(tasks)
      .orderBy(desc(tasks.updatedAt));
  }

  /**
   * Get tasks with pagination and filters
   */
  async getTasksPaginated(page: number, pageSize: number, filters?: {
    projectId?: number;
    assigneeId?: number;
    status?: string;
    priority?: string;
  }) {
    if (!this.db) return { items: [], total: 0 };

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
    const countResult = await this.db
      .select({ count: count() })
      .from(tasks)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // Get paginated items
    const items = await this.db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(desc(tasks.updatedAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total };
  }

  /**
   * Update task
   */
  async updateTask(
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
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: Record<string, any> = {};
    if (data.name !== undefined && data.name !== null) updateData.name = data.name;
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

    return await this.db.update(tasks).set(updateData).where(eq(tasks.id, id));
  }

  /**
   * Delete task
   */
  async deleteTask(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Delete related data first
    await this.db.delete(taskDependencies).where(eq(taskDependencies.taskId, id));
    await this.db.delete(taskComments).where(eq(taskComments.taskId, id));
    await this.db.delete(taskAttachments).where(eq(taskAttachments.taskId, id));
    await this.db.delete(taskFollowers).where(eq(taskFollowers.taskId, id));

    // Delete the task
    return await this.db.delete(tasks).where(eq(tasks.id, id));
  }

  /**
   * Add task dependency
   */
  async addTaskDependency(data: {
    taskId: number;
    dependsOnTaskId: number;
    type?: "finish_to_start" | "start_to_start" | "finish_to_finish";
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Check if dependency already exists
    const existing = await this.db
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

    return await this.db.insert(taskDependencies).values({
      taskId: data.taskId,
      dependsOnTaskId: data.dependsOnTaskId,
      type: data.type || "finish_to_start",
    });
  }

  /**
   * Get task dependencies
   */
  async getTaskDependencies(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, taskId));
  }

  /**
   * Get task dependents (tasks that depend on this task)
   */
  async getTaskDependents(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.dependsOnTaskId, taskId));
  }

  /**
   * Remove task dependency
   */
  async removeTaskDependency(taskId: number, dependsOnTaskId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db
      .delete(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
        )
      );
  }

  /**
   * Get all task dependencies for a project
   */
  async getAllTaskDependenciesForProject(projectId: number) {
    if (!this.db) return [];

    const projectTasks = await this.getTasksByProject(projectId);
    const taskIds = projectTasks.map((t: any) => t.id);

    if (taskIds.length === 0) return [];

    return await this.db
      .select()
      .from(taskDependencies)
      .where(inArray(taskDependencies.taskId, taskIds));
  }

  /**
   * Add task comment
   */
  async addTaskComment(data: {
    taskId: number;
    userId: number;
    comment: string;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const [result] = await this.db.insert(taskComments).values({
      taskId: data.taskId,
      userId: data.userId,
      content: data.comment,
    });
    return { insertId: bigIntToNumber(result.insertId) };
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));
  }

  /**
   * Add task attachment
   */
  async addTaskAttachment(data: {
    taskId: number;
    fileName: string;
    fileUrl: string;
    fileKey: string;
    fileType?: string;
    uploadedBy: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const [result] = await this.db.insert(taskAttachments).values({
      taskId: data.taskId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      mimeType: data.fileType,
      uploadedBy: data.uploadedBy,
    });
    return { insertId: bigIntToNumber(result.insertId) };
  }

  /**
   * Get task attachments
   */
  async getTaskAttachments(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt));
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id: number) {
    if (!this.db) return undefined;

    const result = await this.db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Delete task attachment
   */
  async deleteTaskAttachment(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.delete(taskAttachments).where(eq(taskAttachments.id, id));
  }

  /**
   * Follow task
   */
  async followTask(taskId: number, userId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.insert(taskFollowers).values({ taskId, userId });
  }

  /**
   * Unfollow task
   */
  async unfollowTask(taskId: number, userId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db
      .delete(taskFollowers)
      .where(and(eq(taskFollowers.taskId, taskId), eq(taskFollowers.userId, userId)));
  }

  /**
   * Get task followers
   */
  async getTaskFollowers(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskFollowers)
      .where(eq(taskFollowers.taskId, taskId));
  }

  /**
   * Get task activity log
   */
  async getTaskActivityLog(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.taskId, taskId))
      .orderBy(desc(activityLog.createdAt));
  }
}
