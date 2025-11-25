/**
 * Role Constants
 * Centralized role definitions for user permissions
 */

// User Roles
export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLE.ADMIN]: 'ผู้ดูแลระบบ',
  [USER_ROLE.USER]: 'ผู้ใช้งาน',
};

// Project Member Roles
export const PROJECT_MEMBER_ROLE = {
  PROJECT_MANAGER: 'project_manager',
  QC_INSPECTOR: 'qc_inspector',
  WORKER: 'worker',
} as const;

export type ProjectMemberRole = typeof PROJECT_MEMBER_ROLE[keyof typeof PROJECT_MEMBER_ROLE];

export const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  [PROJECT_MEMBER_ROLE.PROJECT_MANAGER]: 'ผู้จัดการโครงการ',
  [PROJECT_MEMBER_ROLE.QC_INSPECTOR]: 'ผู้ตรวจสอบคุณภาพ',
  [PROJECT_MEMBER_ROLE.WORKER]: 'พนักงาน',
};

// Permission Resources
export const PERMISSION_RESOURCE = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  INSPECTIONS: 'inspections',
  DEFECTS: 'defects',
  USERS: 'users',
  REPORTS: 'reports',
} as const;

export type PermissionResource = typeof PERMISSION_RESOURCE[keyof typeof PERMISSION_RESOURCE];

// Permission Actions
export const PERMISSION_ACTION = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  ASSIGN_MEMBERS: 'assignMembers',
} as const;

export type PermissionAction = typeof PERMISSION_ACTION[keyof typeof PERMISSION_ACTION];
