/**
 * Type Guards and Runtime Type Checking
 * ใช้สำหรับ validate types ที่ runtime
 */

import type { TaskStatus, TaskPriority, DefectStatus, DefectSeverity, ChecklistStatus, NotificationType, UserRole } from './detailedTypes';

// ============= Task Type Guards =============

export function isValidTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && 
    ['not_started', 'todo', 'in_progress', 'completed', 'cancelled'].includes(value);
}

export function isValidTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && 
    ['low', 'medium', 'high', 'urgent'].includes(value);
}

export function assertTaskStatus(value: unknown): TaskStatus {
  if (!isValidTaskStatus(value)) {
    throw new Error(`Invalid task status: ${value}`);
  }
  return value;
}

export function assertTaskPriority(value: unknown): TaskPriority {
  if (!isValidTaskPriority(value)) {
    throw new Error(`Invalid task priority: ${value}`);
  }
  return value;
}

// ============= Defect Type Guards =============

export function isValidDefectStatus(value: unknown): value is DefectStatus {
  return typeof value === 'string' && 
    ['reported', 'analysis', 'in_progress', 'resolved', 'closed'].includes(value);
}

export function isValidDefectSeverity(value: unknown): value is DefectSeverity {
  return typeof value === 'string' && 
    ['low', 'medium', 'high', 'critical'].includes(value);
}

export function assertDefectStatus(value: unknown): DefectStatus {
  if (!isValidDefectStatus(value)) {
    throw new Error(`Invalid defect status: ${value}`);
  }
  return value;
}

export function assertDefectSeverity(value: unknown): DefectSeverity {
  if (!isValidDefectSeverity(value)) {
    throw new Error(`Invalid defect severity: ${value}`);
  }
  return value;
}

// ============= Checklist Type Guards =============

export function isValidChecklistStatus(value: unknown): value is ChecklistStatus {
  return typeof value === 'string' && 
    ['not_started', 'pending_inspection', 'in_progress', 'completed', 'failed'].includes(value);
}

export function isValidChecklistResult(value: unknown): value is 'pass' | 'fail' | 'na' {
  return typeof value === 'string' && 
    ['pass', 'fail', 'na'].includes(value);
}

export function assertChecklistStatus(value: unknown): ChecklistStatus {
  if (!isValidChecklistStatus(value)) {
    throw new Error(`Invalid checklist status: ${value}`);
  }
  return value;
}

// ============= User Type Guards =============

export function isValidUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && 
    ['admin', 'pm', 'qc', 'worker'].includes(value);
}

export function assertUserRole(value: unknown): UserRole {
  if (!isValidUserRole(value)) {
    throw new Error(`Invalid user role: ${value}`);
  }
  return value;
}

// ============= Notification Type Guards =============

export function isValidNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && 
    [
      'task_assigned',
      'task_updated',
      'task_comment',
      'inspection_required',
      'inspection_completed',
      'defect_reported',
      'defect_assigned',
      'defect_resolved',
      'deadline_reminder',
      'system'
    ].includes(value);
}

export function assertNotificationType(value: unknown): NotificationType {
  if (!isValidNotificationType(value)) {
    throw new Error(`Invalid notification type: ${value}`);
  }
  return value;
}

// ============= Generic Type Guards =============

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isValidDate(value: unknown): value is Date {
  return isDate(value) && value.getTime() > 0;
}

// ============= Array Type Guards =============

export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

// ============= Object Type Guards =============

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============= Validation Helpers =============

/**
 * Safely parse integer from unknown value
 */
export function parseIntSafe(value: unknown): number | null {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Safely parse float from unknown value
 */
export function parseFloatSafe(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Safely parse date from unknown value
 */
export function parseDateSafe(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isValidDate(date) ? date : null;
  }
  return null;
}

/**
 * Validate and sanitize ID
 */
export function validateId(value: unknown): number {
  const id = parseIntSafe(value);
  if (id === null || id <= 0) {
    throw new Error(`Invalid ID: ${value}`);
  }
  return id;
}

/**
 * Validate progress percentage (0-100)
 */
export function validateProgress(value: unknown): number {
  const progress = parseIntSafe(value);
  if (progress === null || progress < 0 || progress > 100) {
    throw new Error(`Invalid progress: ${value}. Must be between 0 and 100.`);
  }
  return progress;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): void {
  if (!isValidDate(startDate)) {
    throw new Error('Invalid start date');
  }
  if (!isValidDate(endDate)) {
    throw new Error('Invalid end date');
  }
  if (startDate > endDate) {
    throw new Error('Start date must be before end date');
  }
}
