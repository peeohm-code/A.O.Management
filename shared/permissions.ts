/**
 * Role-Based Access Control (RBAC) System
 * Defines roles, permissions, and helper functions for authorization
 */

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  PM: "project_manager",
  OE: "office_engineer",
  SITE_ENGINEER: "site_engineer",
  QC: "qc_inspector",
  WORKER: "worker",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.OWNER]: "เจ้าของระบบ",
  [ROLES.ADMIN]: "ผู้ดูแลระบบ",
  [ROLES.PM]: "ผู้จัดการโครงการ (PM)",
  [ROLES.OE]: "วิศวกรสำนักงาน (OE)",
  [ROLES.SITE_ENGINEER]: "วิศวกรประจำหน้างาน",
  [ROLES.QC]: "ผู้ตรวจสอบคุณภาพ (QC)",
  [ROLES.WORKER]: "พนักงาน",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.OWNER]: "เจ้าของระบบ - เข้าถึงและควบคุมทุกอย่าง",
  [ROLES.ADMIN]: "ผู้ดูแลระบบ - จัดการโครงการและผู้ใช้",
  [ROLES.PM]: "ผู้จัดการโครงการ - สร้างและจัดการโครงการ, อนุมัติ QC และ Defects",
  [ROLES.OE]: "วิศวกรสำนักงาน - สร้างแผนงาน, อนุมัติ QC และ Defects, ตรวจสอบงาน",
  [ROLES.SITE_ENGINEER]: "วิศวกรประจำหน้างาน - ดูแลงานหน้างาน, update ความคืบหน้า, นัด QC, แก้ไข Defects",
  [ROLES.QC]: "ผู้ตรวจสอบคุณภาพ - ทำ QC Inspection และสร้าง Defects",
  [ROLES.WORKER]: "พนักงาน - ทำงานตามที่ได้รับมอบหมาย",
};

/**
 * Permission definitions for each resource and action
 * Each permission maps to an array of roles that are allowed to perform that action
 */
export const PERMISSIONS = {
  projects: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    delete: [ROLES.OWNER, ROLES.ADMIN],
    assignMembers: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
  },
  tasks: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    updateProgress: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.WORKER],
    assign: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    comment: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.QC, ROLES.WORKER],
  },
  defects: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC, ROLES.SITE_ENGINEER],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC, ROLES.SITE_ENGINEER],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    resolve: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER],
    assign: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    comment: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.QC],
    approveFixPlan: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE], // New: PM/OE approve defect fix plan
    approveResolution: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE], // New: PM/OE approve defect resolution
  },
  checklists: {
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    performInspection: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC],
    approve: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    scheduleInspection: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER], // New: Schedule QC inspection
  },
  templates: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.QC, ROLES.WORKER],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC],
    edit: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC],
    delete: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
  },
  reports: {
    viewAll: [ROLES.OWNER, ROLES.ADMIN],
    export: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.QC],
    generate: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
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
    project: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE],
    personal: [ROLES.OWNER, ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.QC, ROLES.WORKER],
  },
  system: {
    view: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN],
    monitor: [ROLES.OWNER, ROLES.ADMIN],
  },
  escalation: {
    view: [ROLES.OWNER, ROLES.ADMIN],
    create: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN],
    delete: [ROLES.OWNER, ROLES.ADMIN],
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
 * - Owner, Admin, PM, OE can edit any defect
 * - QC can edit defects they created or are assigned to
 * - Site Engineer can only edit defects assigned to them
 */
export function canEditDefect(
  userRole: Role | string,
  userId: number,
  defect: { assignedTo?: number | null; reportedBy: number }
): boolean {
  // Owner, Admin, PM, OE can edit any defect
  if (userRole === ROLES.OWNER || userRole === ROLES.ADMIN || userRole === ROLES.PM || userRole === ROLES.OE) {
    return true;
  }

  // QC can edit defects they created or are assigned to
  if (userRole === ROLES.QC) {
    return defect.reportedBy === userId || defect.assignedTo === userId;
  }

  // Site Engineer can only edit defects assigned to them
  if (userRole === ROLES.SITE_ENGINEER) {
    return defect.assignedTo === userId;
  }

  return false;
}

/**
 * Check if a user can delete a specific defect
 * Only Owner, Admin, PM, and OE can delete defects
 */
export function canDeleteDefect(userRole: Role | string): boolean {
  return userRole === ROLES.OWNER || userRole === ROLES.ADMIN || userRole === ROLES.PM || userRole === ROLES.OE;
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: Role | string): number {
  const levels: Record<string, number> = {
    [ROLES.OWNER]: 6,
    [ROLES.ADMIN]: 5,
    [ROLES.PM]: 4,
    [ROLES.OE]: 4, // OE has same level as PM
    [ROLES.SITE_ENGINEER]: 3,
    [ROLES.QC]: 2,
    [ROLES.WORKER]: 1,
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
    return [ROLES.ADMIN, ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.QC, ROLES.WORKER];
  }

  if (userRole === ROLES.ADMIN) {
    return [ROLES.PM, ROLES.OE, ROLES.SITE_ENGINEER, ROLES.QC, ROLES.WORKER];
  }

  if (userRole === ROLES.PM || userRole === ROLES.OE) {
    return [ROLES.SITE_ENGINEER, ROLES.QC, ROLES.WORKER];
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
