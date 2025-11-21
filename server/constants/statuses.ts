/**
 * Status Constants
 * Centralized status enums to avoid magic strings and ensure consistency
 */

// Project Status
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.DRAFT]: 'ร่าง',
  [PROJECT_STATUS.PLANNING]: 'วางแผน',
  [PROJECT_STATUS.ACTIVE]: 'กำลังดำเนินการ',
  [PROJECT_STATUS.ON_HOLD]: 'พักไว้',
  [PROJECT_STATUS.COMPLETED]: 'เสร็จสิ้น',
  [PROJECT_STATUS.CANCELLED]: 'ยกเลิก',
};

// Task Status
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  DELAYED: 'delayed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUS.NOT_STARTED]: 'ยังไม่เริ่ม',
  [TASK_STATUS.IN_PROGRESS]: 'กำลังดำเนินการ',
  [TASK_STATUS.DELAYED]: 'ล่าช้า',
  [TASK_STATUS.COMPLETED]: 'เสร็จสิ้น',
  [TASK_STATUS.CANCELLED]: 'ยกเลิก',
};

// Checklist Status
export const CHECKLIST_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING_INSPECTION: 'pending_inspection',
  PASSED: 'passed',
  FAILED: 'failed',
  RECTIFIED: 'rectified',
} as const;

export type ChecklistStatus = typeof CHECKLIST_STATUS[keyof typeof CHECKLIST_STATUS];

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  [CHECKLIST_STATUS.NOT_STARTED]: 'ยังไม่เริ่ม',
  [CHECKLIST_STATUS.PENDING_INSPECTION]: 'รอตรวจสอบ',
  [CHECKLIST_STATUS.PASSED]: 'ผ่าน',
  [CHECKLIST_STATUS.FAILED]: 'ไม่ผ่าน',
  [CHECKLIST_STATUS.RECTIFIED]: 'แก้ไขแล้ว',
};

// Inspection Result
export const INSPECTION_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  NA: 'na',
} as const;

export type InspectionResult = typeof INSPECTION_RESULT[keyof typeof INSPECTION_RESULT];

export const INSPECTION_RESULT_LABELS: Record<InspectionResult, string> = {
  [INSPECTION_RESULT.PASS]: 'ผ่าน',
  [INSPECTION_RESULT.FAIL]: 'ไม่ผ่าน',
  [INSPECTION_RESULT.NA]: 'ไม่ระบุ',
};

// Defect Status
export const DEFECT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  VERIFIED: 'verified',
  CLOSED: 'closed',
  REOPENED: 'reopened',
} as const;

export type DefectStatus = typeof DEFECT_STATUS[keyof typeof DEFECT_STATUS];

export const DEFECT_STATUS_LABELS: Record<DefectStatus, string> = {
  [DEFECT_STATUS.OPEN]: 'เปิด',
  [DEFECT_STATUS.IN_PROGRESS]: 'กำลังแก้ไข',
  [DEFECT_STATUS.RESOLVED]: 'แก้ไขแล้ว',
  [DEFECT_STATUS.VERIFIED]: 'ตรวจสอบแล้ว',
  [DEFECT_STATUS.CLOSED]: 'ปิด',
  [DEFECT_STATUS.REOPENED]: 'เปิดใหม่',
};

// Defect Severity
export const DEFECT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type DefectSeverity = typeof DEFECT_SEVERITY[keyof typeof DEFECT_SEVERITY];

export const DEFECT_SEVERITY_LABELS: Record<DefectSeverity, string> = {
  [DEFECT_SEVERITY.LOW]: 'ต่ำ',
  [DEFECT_SEVERITY.MEDIUM]: 'ปานกลาง',
  [DEFECT_SEVERITY.HIGH]: 'สูง',
  [DEFECT_SEVERITY.CRITICAL]: 'วิกฤต',
};

// Checklist Stage
export const CHECKLIST_STAGE = {
  PRE: 'pre',
  IN_PROGRESS: 'in_progress',
  POST: 'post',
} as const;

export type ChecklistStage = typeof CHECKLIST_STAGE[keyof typeof CHECKLIST_STAGE];

export const CHECKLIST_STAGE_LABELS: Record<ChecklistStage, string> = {
  [CHECKLIST_STAGE.PRE]: 'ก่อนเริ่มงาน',
  [CHECKLIST_STAGE.IN_PROGRESS]: 'ระหว่างดำเนินการ',
  [CHECKLIST_STAGE.POST]: 'หลังเสร็จงาน',
};

// Activity Actions
export const ACTIVITY_ACTION = {
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_ARCHIVED: 'project_archived',
  PROJECT_UNARCHIVED: 'project_unarchived',
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  INSPECTION_SUBMITTED: 'inspection_submitted',
  INSPECTION_PASSED: 'inspection_passed',
  INSPECTION_FAILED: 'inspection_failed',
  DEFECT_CREATED: 'defect_created',
  DEFECT_UPDATED: 'defect_updated',
  DEFECT_RESOLVED: 'defect_resolved',
  COMMENT_ADDED: 'comment_added',
} as const;

export type ActivityAction = typeof ACTIVITY_ACTION[keyof typeof ACTIVITY_ACTION];
