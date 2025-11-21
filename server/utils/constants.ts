/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers/strings
 */

// ==================== User Roles ====================
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  QC_INSPECTOR: 'qc_inspector',
  WORKER: 'worker',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ==================== Project Status ====================
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// ==================== Task Status ====================
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// ==================== Defect Severity ====================
export const DEFECT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type DefectSeverity = typeof DEFECT_SEVERITY[keyof typeof DEFECT_SEVERITY];

// ==================== Defect Status ====================
export const DEFECT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened',
} as const;

export type DefectStatus = typeof DEFECT_STATUS[keyof typeof DEFECT_STATUS];

// ==================== Inspection Results ====================
export const INSPECTION_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  NA: 'na',
} as const;

export type InspectionResult = typeof INSPECTION_RESULT[keyof typeof INSPECTION_RESULT];

// ==================== Checklist Status ====================
export const CHECKLIST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ChecklistStatus = typeof CHECKLIST_STATUS[keyof typeof CHECKLIST_STATUS];

// ==================== Checklist Stages ====================
export const CHECKLIST_STAGE = {
  PRE: 'pre',
  IN_PROGRESS: 'in-progress',
  POST: 'post',
} as const;

export type ChecklistStage = typeof CHECKLIST_STAGE[keyof typeof CHECKLIST_STAGE];

// ==================== Completion & Progress Thresholds ====================
export const COMPLETION_THRESHOLDS = {
  PROJECT_MIN_COMPLETENESS: 70, // Minimum % to open project
  PROJECT_AT_RISK_COMPLETION: 50, // Projects below this % are at risk
  PROJECT_AT_RISK_DAYS: 30, // Days to deadline threshold
  PROJECT_OVERDUE_CRITICAL_DAYS: 7, // Days overdue to be critical
  QUALITY_SCORE_A: 90, // Grade A threshold
  QUALITY_SCORE_B: 80, // Grade B threshold
  QUALITY_SCORE_C: 70, // Grade C threshold
  QUALITY_SCORE_D: 60, // Grade D threshold
  // Below 60 is F
} as const;

// ==================== Quality Score Penalties ====================
export const QUALITY_PENALTIES = {
  FAILED_INSPECTION_MULTIPLIER: 0.5, // Multiply fail rate by this
  DEFECT_PENALTY_PER_ITEM: 2, // Points deducted per defect
  DEFECT_PENALTY_MAX: 30, // Max points from defects
  CRITICAL_DEFECT_PENALTY: 5, // Points per critical defect
  CRITICAL_DEFECT_PENALTY_MAX: 20, // Max points from critical defects
  RESOLUTION_BONUS_MAX: 10, // Max bonus for resolved defects
} as const;

// ==================== Time Periods ====================
export const TIME_PERIODS = {
  RECENT_ACTIVITY_DAYS: 30, // Days for "recent" activity
  OVERDUE_NOTIFICATION_DAYS: 1, // Days overdue before notification
} as const;

// ==================== Database Connection ====================
export const DB_CONFIG = {
  CONNECTION_LIMIT: 10, // Maximum concurrent connections
  MAX_IDLE: 5, // Maximum idle connections
  IDLE_TIMEOUT: 60000, // Close idle connections after 60s (ms)
  KEEP_ALIVE_DELAY: 10000, // Keep-alive initial delay (ms)
} as const;

// ==================== Notification Types ====================
export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_OVERDUE: 'task_overdue',
  DEFECT_CREATED: 'defect_created',
  DEFECT_UPDATED: 'defect_updated',
  DEFECT_RESOLVED: 'defect_resolved',
  INSPECTION_FAILED: 'inspection_failed',
  INSPECTION_COMPLETED: 'inspection_completed',
  COMMENT_MENTION: 'comment_mention',
  PROJECT_UPDATED: 'project_updated',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

// ==================== Activity Types ====================
export const ACTIVITY_TYPE = {
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  DEFECT_CREATED: 'defect_created',
  DEFECT_UPDATED: 'defect_updated',
  DEFECT_RESOLVED: 'defect_resolved',
  INSPECTION_CREATED: 'inspection_created',
  INSPECTION_COMPLETED: 'inspection_completed',
  COMMENT_ADDED: 'comment_added',
  FILE_UPLOADED: 'file_uploaded',
} as const;

export type ActivityType = typeof ACTIVITY_TYPE[keyof typeof ACTIVITY_TYPE];

// ==================== Percentage Calculation ====================
export const PERCENTAGE = {
  MULTIPLIER: 100, // Convert decimal to percentage
  PRECISION: 0, // Round to integer by default
} as const;

// ==================== Grade Thresholds ====================
export const GRADE_THRESHOLDS = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  // F is below 60
} as const;

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Calculate grade based on score
 */
export function calculateGrade(score: number): Grade {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Calculate completion rate percentage
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * PERCENTAGE.MULTIPLIER);
}

/**
 * Calculate fail rate percentage with precision
 */
export function calculateFailRate(failed: number, total: number, precision: number = 2): number {
  if (total === 0) return 0;
  const multiplier = Math.pow(10, precision + 2); // For 2 decimal places: 10^4 = 10000
  return Math.round((failed / total) * multiplier) / Math.pow(10, precision);
}
