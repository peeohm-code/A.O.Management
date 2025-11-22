import { getDb } from './db';
import { activityLog } from '../drizzle/schema';
import { logger } from './logger';

export type AuditAction = 
  | 'create' | 'update' | 'delete' 
  | 'login' | 'logout' 
  | 'view' | 'download' | 'export'
  | 'approve' | 'reject' | 'submit'
  | 'assign' | 'unassign'
  | 'archive' | 'restore';

export type ResourceType = 
  | 'project' | 'task' | 'defect' 
  | 'checklist' | 'inspection' | 'template'
  | 'user' | 'member' | 'comment' | 'attachment'
  | 'notification' | 'report';

export interface AuditLogEntry {
  userId: number;
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: number;
  projectId?: number;
  taskId?: number;
  defectId?: number;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

/**
 * Log an audit trail entry
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      logger.warn('[AuditTrail] Database not available, skipping audit log');
      return;
    }

    await db.insert(activityLog).values({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      projectId: entry.projectId,
      taskId: entry.taskId,
      defectId: entry.defectId,
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      details: entry.details,
    });

    logger.info(`[AuditTrail] ${entry.action} on ${entry.resourceType}:${entry.resourceId} by user:${entry.userId}`);
  } catch (error) {
    logger.error('[AuditTrail] Failed to log audit entry', error);
  }
}

/**
 * Log project-related actions
 */
export async function logProjectAudit(
  userId: number,
  action: AuditAction,
  projectId: number,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType: 'project',
    resourceId: projectId,
    projectId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
  });
}

/**
 * Log task-related actions
 */
export async function logTaskAudit(
  userId: number,
  action: AuditAction,
  taskId: number,
  projectId?: number,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType: 'task',
    resourceId: taskId,
    taskId,
    projectId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
  });
}

/**
 * Log defect-related actions
 */
export async function logDefectAudit(
  userId: number,
  action: AuditAction,
  defectId: number,
  projectId?: number,
  taskId?: number,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType: 'defect',
    resourceId: defectId,
    defectId,
    projectId,
    taskId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
  });
}

/**
 * Log inspection-related actions
 */
export async function logInspectionAudit(
  userId: number,
  action: AuditAction,
  checklistId: number,
  taskId?: number,
  projectId?: number,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType: 'inspection',
    resourceId: checklistId,
    taskId,
    projectId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
  });
}

/**
 * Log user authentication actions
 */
export async function logAuthAudit(
  userId: number,
  action: 'login' | 'logout',
  ipAddress?: string,
  userAgent?: string,
  details?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resourceType: 'user',
    resourceId: userId,
    ipAddress,
    userAgent,
    details,
  });
}

/**
 * Extract IP address from request
 */
export function getClientIp(req: any): string | undefined {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}
