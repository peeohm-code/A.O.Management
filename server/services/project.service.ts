/**
 * Project Service
 * 
 * Handles project-related business logic with proper data integrity:
 * - createProject: Creates project and automatically adds creator as project manager
 * - deleteProject: Deletes project and all related data (members, tasks, dependencies, etc.)
 * 
 * Uses toNumber() helper for safe ID conversions and constants from utils/constants.ts
 */

import { eq, inArray, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  projects,
  projectMembers,
  tasks,
  taskDependencies,
  taskFollowers,
  taskAttachments,
  taskComments,
  taskChecklists,
  checklistItemResults,
  defects,
  notifications,
  activityLog,
  taskAssignments,
} from "../../drizzle/schema";
import { bigIntToNumber } from "../utils/bigint";
import { withTransaction } from "../utils/transaction";
import { PROJECT_STATUS } from "../constants/statuses";
import { logger } from "../logger";

/**
 * Generate next available project code in format AO-YYYY-XXX
 */
async function generateProjectCode(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentYear = new Date().getFullYear();
  const prefix = `AO-${currentYear}-`;

  // Get the highest number for current year
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.code, prefix))
    .orderBy(projects.code)
    .limit(1);

  let nextNumber = 1;
  if (result.length > 0) {
    const lastCode = result[0].code;
    const lastNumber = parseInt(lastCode.split("-")[2] || "0");
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

/**
 * Create a new project with automatic member assignment
 * 
 * @param data Project creation data
 * @returns Object with insertId and id of created project
 * 
 * @throws Error if database is unavailable or operation fails
 * 
 * Business Logic:
 * 1. Auto-generates project code if not provided (format: AO-YYYY-XXX)
 * 2. Creates project record with status 'draft' by default
 * 3. Automatically adds creator as project manager in projectMembers table
 * 4. Returns safe numeric ID using toNumber() helper
 */
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
}): Promise<{ insertId: number; id: number }> {
  // Use transaction to ensure atomicity
  return await withTransaction(async (tx) => {
    // Prepare project values
    const values: typeof projects.$inferInsert = {
      name: data.name,
      createdBy: data.createdBy,
      status: PROJECT_STATUS.DRAFT,
    };

    // Auto-generate code if not provided
    if (data.code) {
      values.code = data.code;
    } else {
      values.code = await generateProjectCode();
    }

    // Optional fields
    if (data.location) values.location = data.location;
    if (data.latitude) values.latitude = data.latitude;
    if (data.longitude) values.longitude = data.longitude;
    if (data.ownerName) values.ownerName = data.ownerName;
    if (data.startDate) values.startDate = data.startDate;
    if (data.endDate) values.endDate = data.endDate;

    // Insert project within transaction
    const [result] = await tx.insert(projects).values(values);

    // Convert insertId to number safely
    const projectId = bigIntToNumber(result.insertId);

    // Add creator as project manager within same transaction
    await tx.insert(projectMembers).values({
      projectId,
      userId: data.createdBy,
      role: "project_manager",
    });

    logger.info(`[Project Service] Created project ${projectId} with code ${values.code}`);

    return { insertId: projectId, id: projectId };
  });
}

/**
 * Delete a project and all related data
 * 
 * @param id Project ID to delete
 * 
 * @throws Error if database is unavailable or operation fails
 * 
 * Business Logic:
 * Deletes data in correct order to respect foreign key constraints:
 * 1. Activity logs
 * 2. Task-related data:
 *    - Task dependencies (both directions)
 *    - Task followers
 *    - Task attachments
 *    - Task comments
 *    - Task assignments
 *    - Checklist item results
 *    - Task checklists
 *    - Defects
 *    - Tasks themselves
 * 3. Notifications
 * 4. Project members
 * 5. Project record
 * 
 * Uses toNumber() for safe ID conversions throughout the process
 */
export async function deleteProject(id: number): Promise<void> {
  const projectId = bigIntToNumber(id);
  logger.info(`[Project Service] Starting deletion of project ${projectId}`);

  // Use transaction to ensure all-or-nothing deletion
  await withTransaction(async (tx) => {
    // 1. Delete activity logs
    await tx.delete(activityLog).where(eq(activityLog.projectId, projectId));

    // 2. Get all tasks for this project
    const projectTasks = await tx
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const taskIds = projectTasks.map((t) => bigIntToNumber(t.id));

    if (taskIds.length > 0) {
      logger.info(`[Project Service] Deleting ${taskIds.length} tasks and related data`);

      // Delete task dependencies (both directions)
      await tx.delete(taskDependencies).where(inArray(taskDependencies.taskId, taskIds));
      await tx.delete(taskDependencies).where(inArray(taskDependencies.dependsOnTaskId, taskIds));

      // Delete task followers
      await tx.delete(taskFollowers).where(inArray(taskFollowers.taskId, taskIds));

      // Delete task attachments
      await tx.delete(taskAttachments).where(inArray(taskAttachments.taskId, taskIds));

      // Delete task comments
      await tx.delete(taskComments).where(inArray(taskComments.taskId, taskIds));

      // Delete task assignments
      await tx.delete(taskAssignments).where(inArray(taskAssignments.taskId, taskIds));

      // Get all task checklist IDs
      const taskChecklistRecords = await tx
        .select({ id: taskChecklists.id })
        .from(taskChecklists)
        .where(inArray(taskChecklists.taskId, taskIds));

      const checklistIds = taskChecklistRecords.map((tc) => bigIntToNumber(tc.id));

      if (checklistIds.length > 0) {
        // Delete checklist item results
        await tx
          .delete(checklistItemResults)
          .where(inArray(checklistItemResults.taskChecklistId, checklistIds));
      }

      // Delete task checklists
      await tx.delete(taskChecklists).where(inArray(taskChecklists.taskId, taskIds));

      // Delete defects
      await tx.delete(defects).where(inArray(defects.taskId, taskIds));

      // Delete tasks
      await tx.delete(tasks).where(eq(tasks.projectId, projectId));
    }

    // 3. Delete notifications
    await tx.delete(notifications).where(eq(notifications.relatedProjectId, projectId));

    // 4. Delete project members
    await tx.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

    // 5. Finally delete the project
    await tx.delete(projects).where(eq(projects.id, projectId));

    logger.info(`[Project Service] Successfully deleted project ${projectId}`);
  });
}
