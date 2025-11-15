/**
 * Role-Based Access Control (RBAC) System
 * Defines roles, permissions, and helper functions for authorization
 */

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  PM: "project_manager",
  QC: "qc_inspector",
  FIELD_ENGINEER: "field_engineer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.OWNER]: "Owner",
  [ROLES.ADMIN]: "Admin",
  [ROLES.PM]: "PM",
  [ROLES.QC]: "QC Inspector",
  [ROLES.FIELD_ENGINEER]: "วิศวกรสนาม",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.OWNER]: "เจ้าของระบบ - เข้าถึงและควบคุมทุกอย่าง",
  [ROLES.ADMIN]: "ผู้ดูแลระบบ - จัดการโครงการและผู้ใช้",
  [ROLES.PM]: "ผู้จัดการโครงการ - จัดการโครงการที่รับผิดชอบ",
  [ROLES.QC]: "ผู้ตรวจสอบคุณภาพ - ทำ QC Inspection และสร้าง Defects",
  [ROLES.FIELD_ENGINEER]: "วิศวกรสนาม - ทำงานและแก้ไข Defects",
};

/**
 * Permission definitions for each resource and action
 * Each permission maps to an array of roles that are allowed to perform that action
 */
export const PERMISSIONS = {
  projects: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN],
    create: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    delete: [ROLES.OWNER, ROLES.ADMIN],
    assignMembers: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
  },
  tasks: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    updateProgress: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.FIELD_ENGINEER],
    assign: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    comment: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER],
  },
  defects: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM], // PM can delete defects
    resolve: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.FIELD_ENGINEER],
    assign: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    comment: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER],
  },
  checklists: {
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    performInspection: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    approve: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
  },
  templates: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
  },
  reports: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN],
    export: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC],
    generate: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
  },
  users: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN],
    create: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN],
    delete: [ROLES.OWNER, ROLES.ADMIN],
    changeRole: [ROLES.OWNER, ROLES.ADMIN],
  },
  settings: {
    system: [ROLES.OWNER],
    project: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM],
    personal: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER],
  },
  system: {
    view: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN],
    monitor: [ROLES.OWNER, ROLES.ADMIN],
  },
} as const;

/**
 * Check if a user role has permission to perform an action on a resource
 */
export function hasPermission(
  userRole: Role | string,
  resource: keyof typeof PERMISSIONS,
  action: string
): boolean {
  const allowedRoles = (PERMISSIONS[resource] as any)?.[action] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user can access a specific project
 * Owner and Admin can access all projects
 * Others must be project members
 */
export function canAccessProject(
  userRole: Role | string,
  userId: number,
  projectMembers: Array<{ userId: number; role: string }>
): boolean {
  // Owner and Admin can access all projects
  if (userRole === ROLES.OWNER || userRole === ROLES.ADMIN) {
    return true;
  }
  
  // Others must be project members
  return projectMembers.some(m => m.userId === userId);
}

/**
 * Check if a user can edit a specific defect
 * - Owner, Admin, PM can edit any defect
 * - QC can edit defects they created or are assigned to
 * - Field Engineer can only edit defects assigned to them
 */
export function canEditDefect(
  userRole: Role | string,
  userId: number,
  defect: { assignedTo?: number | null; reportedBy: number }
): boolean {
  // Owner, Admin, PM can edit any defect
  if (userRole === ROLES.OWNER || userRole === ROLES.ADMIN || userRole === ROLES.PM) {
    return true;
  }
  
  // QC can edit defects they created or are assigned to
  if (userRole === ROLES.QC) {
    return defect.reportedBy === userId || defect.assignedTo === userId;
  }
  
  // Field Engineer can only edit defects assigned to them
  if (userRole === ROLES.FIELD_ENGINEER) {
    return defect.assignedTo === userId;
  }
  
  return false;
}

/**
 * Check if a user can delete a specific defect
 * Only Owner, Admin, and PM can delete defects
 */
export function canDeleteDefect(userRole: Role | string): boolean {
  return userRole === ROLES.OWNER || userRole === ROLES.ADMIN || userRole === ROLES.PM;
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: Role | string): number {
  const levels: Record<string, number> = {
    [ROLES.OWNER]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.PM]: 3,
    [ROLES.QC]: 2,
    [ROLES.FIELD_ENGINEER]: 1,
  };
  return levels[role] || 0;
}

/**
 * Check if a user can change another user's role
 * - Owner can change anyone's role (except their own)
 * - Admin can change roles below Admin level
 */
export function canChangeUserRole(
  actorRole: Role | string,
  targetCurrentRole: Role | string,
  targetNewRole: Role | string
): boolean {
  const actorLevel = getRoleLevel(actorRole);
  const targetCurrentLevel = getRoleLevel(targetCurrentRole);
  const targetNewLevel = getRoleLevel(targetNewRole);
  
  // Owner can change anyone's role (except promoting to Owner)
  if (actorRole === ROLES.OWNER) {
    return targetNewRole !== ROLES.OWNER;
  }
  
  // Admin can change roles below Admin level
  if (actorRole === ROLES.ADMIN) {
    return targetCurrentLevel < 4 && targetNewLevel < 4;
  }
  
  return false;
}

/**
 * Get all roles that a user can assign to others
 */
export function getAssignableRoles(userRole: Role | string): Role[] {
  if (userRole === ROLES.OWNER) {
    return [ROLES.ADMIN, ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER];
  }
  
  if (userRole === ROLES.ADMIN) {
    return [ROLES.PM, ROLES.QC, ROLES.FIELD_ENGINEER];
  }
  
  return [];
}

/**
 * Get role label for display
 */
export function getRoleLabel(role: Role | string): string {
  return ROLE_LABELS[role as Role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role | string): string {
  return ROLE_DESCRIPTIONS[role as Role] || "";
}
