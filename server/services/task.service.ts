import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  tasks,
  taskDependencies,
  taskComments,
  type Task,
  type InsertTask,
  type TaskDependency,
  type InsertTaskDependency,
  type TaskComment,
  type InsertTaskComment,
} from "../../drizzle/schema";

/**
 * Task Service
 * Handles all task-related operations including dependencies and comments
 */

// ============================================================================
// Task CRUD Operations
// ============================================================================

export async function createTask(data: InsertTask): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [task] = await db.insert(tasks).values(data).$returningId();
  const [created] = await db.select().from(tasks).where(eq(tasks.id, task.id));
  
  if (!created) throw new Error("Failed to create task");
  return created;
}

export async function getTaskById(taskId: number): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  return task;
}

export async function getTasksByProjectId(projectId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
}

export async function getTasksByAssignee(assigneeId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.assigneeId, assigneeId))
    .orderBy(desc(tasks.dueDate));
}

export async function updateTask(
  taskId: number,
  data: Partial<InsertTask>
): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set(data).where(eq(tasks.id, taskId));

  const [updated] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!updated) throw new Error("Task not found after update");

  return updated;
}

export async function deleteTask(taskId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete dependencies first
  await db.delete(taskDependencies).where(
    sql`${taskDependencies.taskId} = ${taskId} OR ${taskDependencies.dependsOnTaskId} = ${taskId}`
  );

  // Delete comments
  await db.delete(taskComments).where(eq(taskComments.taskId, taskId));

  // Delete task
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

// ============================================================================
// Task Dependencies
// ============================================================================

export async function createTaskDependency(
  data: InsertTaskDependency
): Promise<TaskDependency> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check for circular dependencies
  const hasCircular = await checkCircularDependency(data.taskId, data.dependsOnTaskId);
  if (hasCircular) {
    throw new Error("Circular dependency detected");
  }

  const [dep] = await db.insert(taskDependencies).values(data).$returningId();
  const [created] = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.id, dep.id));

  if (!created) throw new Error("Failed to create task dependency");
  return created;
}

export async function getTaskDependencies(taskId: number): Promise<TaskDependency[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
}

export async function getTaskDependents(taskId: number): Promise<TaskDependency[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.dependsOnTaskId, taskId));
}

export async function deleteTaskDependency(dependencyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(taskDependencies).where(eq(taskDependencies.id, dependencyId));
}

async function checkCircularDependency(
  taskId: number,
  dependsOnTaskId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // BFS to detect cycles
  const visited = new Set<number>();
  const queue: number[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === taskId) {
      return true; // Circular dependency found
    }

    if (visited.has(current)) continue;
    visited.add(current);

    const deps = await db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, current));

    for (const dep of deps) {
      queue.push(dep.dependsOnTaskId);
    }
  }

  return false;
}

// ============================================================================
// Task Comments
// ============================================================================

export async function createTaskComment(data: InsertTaskComment): Promise<TaskComment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [comment] = await db.insert(taskComments).values(data).$returningId();
  const [created] = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.id, comment.id));

  if (!created) throw new Error("Failed to create task comment");
  return created;
}

export async function getTaskComments(taskId: number): Promise<TaskComment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(taskComments)
    .where(eq(taskComments.taskId, taskId))
    .orderBy(desc(taskComments.createdAt));
}

export async function updateTaskComment(
  commentId: number,
  content: string
): Promise<TaskComment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(taskComments)
    .set({ content, updatedAt: new Date() })
    .where(eq(taskComments.id, commentId));

  const [updated] = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.id, commentId));

  if (!updated) throw new Error("Comment not found after update");
  return updated;
}

export async function deleteTaskComment(commentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(taskComments).where(eq(taskComments.id, commentId));
}

// ============================================================================
// Bulk Operations
// ============================================================================

export async function bulkUpdateTaskStatus(
  taskIds: number[],
  status: Task["status"]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set({ status }).where(inArray(tasks.id, taskIds));
}

export async function getOverdueTasks(): Promise<Task[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  return db
    .select()
    .from(tasks)
    .where(
      and(
        sql`${tasks.dueDate} < ${now}`,
        sql`${tasks.status} != 'completed'`
      )
    )
    .orderBy(tasks.dueDate);
}
