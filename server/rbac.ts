/**
 * RBAC (Role-Based Access Control) Authorization Helpers
 * 
 * This module provides authorization helper functions to check user permissions
 * for various operations in the Construction Management system.
 * 
 * Security Principles:
 * - Fail-safe: Return false by default if checks fail
 * - Explicit: Clear function names that describe what they check
 * - Consistent: All functions follow the same pattern
 * - Auditable: Log authorization failures for security monitoring
 */

import { eq, and } from "drizzle-orm";
import { projects, projectMembers, tasks, defects, taskChecklists } from "../drizzle/schema";
import { getDb } from "./db";
import { logger } from "./logger";

/**
 * User roles in the system
 */
export type UserRole = "admin" | "user" | "project_manager" | "qc_inspector" | "worker";

/**
 * Project member roles
 */
export type ProjectMemberRole = "project_manager" | "qc_inspector" | "worker";

/**
 * Check if user has access to a project (owner or member)
 */
export async function hasProjectAccess(userId: number, projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Check if user is a project member
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .limit(1);

    return membership.length > 0;
  } catch (error) {
    logger.error('[RBAC] hasProjectAccess failed', { userId, projectId }, error);
    return false;
  }
}

/**
 * Check if user is a project manager for a specific project
 */
export async function isProjectManager(userId: number, projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.role, "project_manager")
        )
      )
      .limit(1);

    return membership.length > 0;
  } catch (error) {
    logger.error('[RBAC] isProjectManager failed', { userId, projectId }, error);
    return false;
  }
}

/**
 * Check if user is a QC inspector for a specific project
 */
export async function isQCInspector(userId: number, projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.role, "qc_inspector")
        )
      )
      .limit(1);

    return membership.length > 0;
  } catch (error) {
    logger.error('[RBAC] isQCInspector failed', { userId, projectId }, error);
    return false;
  }
}

/**
 * Check if user can edit a task
 * Rules: Project manager, task assignee, or task creator
 */
export async function canEditTask(userId: number, taskId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get task details
    const taskResult = await db
      .select({
        projectId: tasks.projectId,
        assigneeId: tasks.assigneeId,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const task = taskResult[0];

    // Check if user is task assignee
    if (task.assigneeId === userId) {
      return true;
    }

    // Check if user is project manager
    return await isProjectManager(userId, task.projectId);
  } catch (error) {
    logger.error('[RBAC] canEditTask failed', { userId, taskId }, error);
    return false;
  }
}

/**
 * Check if user can delete a task
 * Rules: Project manager or task creator only
 */
export async function canDeleteTask(userId: number, taskId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const taskResult = await db
      .select({
        projectId: tasks.projectId,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const task = taskResult[0];

    // Check if user is project manager
    return await isProjectManager(userId, task.projectId);
  } catch (error) {
    logger.error('[RBAC] canDeleteTask failed', { userId, taskId }, error);
    return false;
  }
}

/**
 * Check if user can approve an inspection
 * Rules: QC inspector or project manager only
 */
export async function canApproveInspection(userId: number, checklistId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get checklist and task details
    const checklistResult = await db
      .select({
        taskId: taskChecklists.taskId,
      })
      .from(taskChecklists)
      .where(eq(taskChecklists.id, checklistId))
      .limit(1);

    if (checklistResult.length === 0) return false;

    const taskResult = await db
      .select({
        projectId: tasks.projectId,
      })
      .from(tasks)
      .where(eq(tasks.id, checklistResult[0].taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const projectId = taskResult[0].projectId;

    // Check if user is QC inspector or project manager
    const isQC = await isQCInspector(userId, projectId);
    const isPM = await isProjectManager(userId, projectId);

    return isQC || isPM;
  } catch (error) {
    logger.error('[RBAC] canApproveInspection failed', { userId, checklistId }, error);
    return false;
  }
}

/**
 * Check if user can assign a defect
 * Rules: Project manager or QC inspector only
 */
export async function canAssignDefect(userId: number, defectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get defect and task details
    const defectResult = await db
      .select({
        taskId: defects.taskId,
      })
      .from(defects)
      .where(eq(defects.id, defectId))
      .limit(1);

    if (defectResult.length === 0) return false;

    const taskResult = await db
      .select({
        projectId: tasks.projectId,
      })
      .from(tasks)
      .where(eq(tasks.id, defectResult[0].taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const projectId = taskResult[0].projectId;

    // Check if user is QC inspector or project manager
    const isQC = await isQCInspector(userId, projectId);
    const isPM = await isProjectManager(userId, projectId);

    return isQC || isPM;
  } catch (error) {
    logger.error('[RBAC] canAssignDefect failed', { userId, defectId }, error);
    return false;
  }
}

/**
 * Check if user can close a defect
 * Rules: QC inspector or project manager only
 */
export async function canCloseDefect(userId: number, defectId: number): Promise<boolean> {
  // Same rules as canAssignDefect
  return await canAssignDefect(userId, defectId);
}

/**
 * Check if user can edit a project
 * Rules: Project manager only
 */
export async function canEditProject(userId: number, projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Check if user is project manager
    return await isProjectManager(userId, projectId);
  } catch (error) {
    logger.error('[RBAC] canEditProject failed', { userId, projectId }, error);
    return false;
  }
}

/**
 * Check if user can delete a project
 * Rules: Project manager only
 */
export async function canDeleteProject(userId: number, projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Check if user is project manager
    return await isProjectManager(userId, projectId);
  } catch (error) {
    logger.error('[RBAC] canDeleteProject failed', { userId, projectId }, error);
    return false;
  }
}

/**
 * Check if user can edit a defect
 * Rules: Project manager, QC inspector, or defect creator
 */
export async function canEditDefect(userId: number, defectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get defect details
    const defectResult = await db
      .select({
        taskId: defects.taskId,
        reportedBy: defects.reportedBy,
      })
      .from(defects)
      .where(eq(defects.id, defectId))
      .limit(1);

    if (defectResult.length === 0) return false;

    const defect = defectResult[0];

    // Check if user is defect creator
    if (defect.reportedBy === userId) {
      return true;
    }

    // Get project ID from task
    const taskResult = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, defect.taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const projectId = taskResult[0].projectId;

    // Check if user is QC inspector or project manager
    const isQC = await isQCInspector(userId, projectId);
    const isPM = await isProjectManager(userId, projectId);

    return isQC || isPM;
  } catch (error) {
    logger.error('[RBAC] canEditDefect failed', { userId, defectId }, error);
    return false;
  }
}

/**
 * Check if user can delete a defect
 * Rules: Project manager or defect creator only
 */
export async function canDeleteDefect(userId: number, defectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get defect details
    const defectResult = await db
      .select({
        taskId: defects.taskId,
        reportedBy: defects.reportedBy,
      })
      .from(defects)
      .where(eq(defects.id, defectId))
      .limit(1);

    if (defectResult.length === 0) return false;

    const defect = defectResult[0];

    // Check if user is defect creator
    if (defect.reportedBy === userId) {
      return true;
    }

    // Get project ID from task
    const taskResult = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, defect.taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const projectId = taskResult[0].projectId;

    // Check if user is project manager
    return await isProjectManager(userId, projectId);
  } catch (error) {
    logger.error('[RBAC] canDeleteDefect failed', { userId, defectId }, error);
    return false;
  }
}

/**
 * Check if user can edit an inspection/checklist
 * Rules: QC inspector, project manager, or checklist creator
 */
export async function canEditInspection(userId: number, checklistId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get checklist details
    const checklistResult = await db
      .select({
        taskId: taskChecklists.taskId,
      })
      .from(taskChecklists)
      .where(eq(taskChecklists.id, checklistId))
      .limit(1);

    if (checklistResult.length === 0) return false;

    const checklist = checklistResult[0];

    // Get project ID from task
    const taskResult = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, checklist.taskId))
      .limit(1);

    if (taskResult.length === 0) return false;

    const projectId = taskResult[0].projectId;

    // Check if user is QC inspector or project manager
    const isQC = await isQCInspector(userId, projectId);
    const isPM = await isProjectManager(userId, projectId);

    return isQC || isPM;
  } catch (error) {
    logger.error('[RBAC] canEditInspection failed', { userId, checklistId }, error);
    return false;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const { users } = await import("../drizzle/schema");
    
    const userResult = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return userResult.length > 0 && userResult[0].role === "admin";
  } catch (error) {
    logger.error('[RBAC] isAdmin failed', { userId }, error);
    return false;
  }
}

/**
 * Get user's role in a specific project
 */
export async function getUserProjectRole(
  userId: number,
  projectId: number
): Promise<ProjectMemberRole | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const membership = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .limit(1);

    return membership.length > 0 ? (membership[0].role as ProjectMemberRole) : null;
  } catch (error) {
    logger.error('[RBAC] getUserProjectRole failed', { userId, projectId }, error);
    return null;
  }
}

/**
 * Check if user has any of the specified roles in a project
 */
export async function hasAnyProjectRole(
  userId: number,
  projectId: number,
  roles: ProjectMemberRole[]
): Promise<boolean> {
  const userRole = await getUserProjectRole(userId, projectId);
  return userRole !== null && roles.includes(userRole);
}

/**
 * Audit log for authorization failures
 * Call this when authorization check fails to log the attempt
 */
export function logAuthorizationFailure(
  userId: number,
  action: string,
  resourceType: string,
  resourceId: number,
  reason?: string
): void {
  logger.warn('[RBAC] Authorization failed', 'RBAC', { userId, action, resourceType, resourceId, reason: reason || 'Permission denied' });
}
