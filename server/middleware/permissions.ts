import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { projectMembers, projects, tasks, defects } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";

/**
 * Permission Middleware สำหรับ Construction Management & QC Platform
 * 
 * ระบบมี 2 ระดับการตรวจสอบสิทธิ์:
 * 1. Role-based: admin, user
 * 2. Project-based: project_manager, qc_inspector, worker
 */

// ==================== Helper Functions ====================

/**
 * ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

/**
 * ตรวจสอบว่าผู้ใช้เป็นสมาชิกของโปรเจกต์หรือไม่
 */
export async function isProjectMember(userId: number, projectId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const member = await db
    .select()
    .from(projectMembers)
    .where(and(
      eq(projectMembers.userId, userId),
      eq(projectMembers.projectId, projectId)
    ))
    .limit(1);

  return member.length > 0;
}

/**
 * ตรวจสอบว่าผู้ใช้เป็น Project Manager ของโปรเจกต์หรือไม่
 */
export async function isProjectManager(userId: number, projectId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const member = await db
    .select()
    .from(projectMembers)
    .where(and(
      eq(projectMembers.userId, userId),
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.role, 'project_manager')
    ))
    .limit(1);

  return member.length > 0;
}

/**
 * ตรวจสอบว่าผู้ใช้เป็น QC Inspector ของโปรเจกต์หรือไม่
 */
export async function isQCInspector(userId: number, projectId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const member = await db
    .select()
    .from(projectMembers)
    .where(and(
      eq(projectMembers.userId, userId),
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.role, 'qc_inspector')
    ))
    .limit(1);

  return member.length > 0;
}

/**
 * ตรวจสอบว่าผู้ใช้เป็นเจ้าของโปรเจกต์หรือไม่
 */
export async function isProjectOwner(userId: number, projectId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return project.length > 0 && project[0].createdBy === userId;
}

/**
 * ดึง role ของผู้ใช้ในโปรเจกต์
 */
export async function getProjectRole(userId: number, projectId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const member = await db
    .select()
    .from(projectMembers)
    .where(and(
      eq(projectMembers.userId, userId),
      eq(projectMembers.projectId, projectId)
    ))
    .limit(1);

  return member.length > 0 ? member[0].role : null;
}

// ==================== Permission Check Functions ====================

/**
 * ตรวจสอบสิทธิ์ในการดูโปรเจกต์
 * - Admin: ดูได้ทุกโปรเจกต์
 * - User: ดูได้เฉพาะโปรเจกต์ที่เป็นสมาชิก
 */
export async function canViewProject(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  return await isProjectMember(user.id, projectId);
}

/**
 * ตรวจสอบสิทธิ์ในการแก้ไขโปรเจกต์
 * - Admin: แก้ไขได้ทุกโปรเจกต์
 * - Project Manager: แก้ไขได้เฉพาะโปรเจกต์ที่เป็น PM
 * - Project Owner: แก้ไขได้เฉพาะโปรเจกต์ที่สร้าง
 */
export async function canEditProject(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const isPM = await isProjectManager(user.id, projectId);
  const isOwner = await isProjectOwner(user.id, projectId);
  
  return isPM || isOwner;
}

/**
 * ตรวจสอบสิทธิ์ในการลบโปรเจกต์
 * - Admin: ลบได้ทุกโปรเจกต์
 * - Project Owner: ลบได้เฉพาะโปรเจกต์ที่สร้าง
 */
export async function canDeleteProject(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  return await isProjectOwner(user.id, projectId);
}

/**
 * ตรวจสอบสิทธิ์ในการสร้าง Task
 * - Admin: สร้างได้ทุกโปรเจกต์
 * - Project Manager: สร้างได้ในโปรเจกต์ที่เป็น PM
 * - QC Inspector: สร้างได้ในโปรเจกต์ที่เป็น QC
 */
export async function canCreateTask(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const isPM = await isProjectManager(user.id, projectId);
  const isQC = await isQCInspector(user.id, projectId);
  
  return isPM || isQC;
}

/**
 * ตรวจสอบสิทธิ์ในการแก้ไข Task
 * - Admin: แก้ไขได้ทุก Task
 * - Project Manager: แก้ไขได้ใน Task ของโปรเจกต์ที่เป็น PM
 * - Task Assignee: แก้ไขได้เฉพาะ Task ที่ถูก assign
 */
export async function canEditTask(user: User, taskId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const db = await getDb();
  if (!db) return false;

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (task.length === 0) return false;

  const isPM = await isProjectManager(user.id, task[0].projectId);
  const isAssignee = task[0].assigneeId === user.id;
  
  return isPM || isAssignee;
}

/**
 * ตรวจสอบสิทธิ์ในการลบ Task
 * - Admin: ลบได้ทุก Task
 * - Project Manager: ลบได้ใน Task ของโปรเจกต์ที่เป็น PM
 */
export async function canDeleteTask(user: User, taskId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const db = await getDb();
  if (!db) return false;

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (task.length === 0) return false;

  return await isProjectManager(user.id, task[0].projectId);
}

/**
 * ตรวจสอบสิทธิ์ในการสร้าง Defect
 * - Admin: สร้างได้ทุกโปรเจกต์
 * - Project Member: สร้างได้ในโปรเจกต์ที่เป็นสมาชิก
 */
export async function canCreateDefect(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  return await isProjectMember(user.id, projectId);
}

/**
 * ตรวจสอบสิทธิ์ในการแก้ไข Defect
 * - Admin: แก้ไขได้ทุก Defect
 * - Project Manager: แก้ไขได้ใน Defect ของโปรเจกต์ที่เป็น PM
 * - QC Inspector: แก้ไขได้ใน Defect ของโปรเจกต์ที่เป็น QC
 * - Defect Assignee: แก้ไขได้เฉพาะ Defect ที่ถูก assign
 */
export async function canEditDefect(user: User, defectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const db = await getDb();
  if (!db) return false;

  const defect = await db
    .select()
    .from(defects)
    .where(eq(defects.id, defectId))
    .limit(1);

  if (defect.length === 0) return false;

  const isPM = await isProjectManager(user.id, defect[0].projectId);
  const isQC = await isQCInspector(user.id, defect[0].projectId);
  const isAssignee = defect[0].assignedTo === user.id;
  
  return isPM || isQC || isAssignee;
}

/**
 * ตรวจสอบสิทธิ์ในการลบ Defect
 * - Admin: ลบได้ทุก Defect
 * - Project Manager: ลบได้ใน Defect ของโปรเจกต์ที่เป็น PM
 */
export async function canDeleteDefect(user: User, defectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const db = await getDb();
  if (!db) return false;

  const defect = await db
    .select()
    .from(defects)
    .where(eq(defects.id, defectId))
    .limit(1);

  if (defect.length === 0) return false;

  return await isProjectManager(user.id, defect[0].projectId);
}

/**
 * ตรวจสอบสิทธิ์ในการทำ QC Inspection
 * - Admin: ทำได้ทุกโปรเจกต์
 * - QC Inspector: ทำได้ในโปรเจกต์ที่เป็น QC
 * - Project Manager: ทำได้ในโปรเจกต์ที่เป็น PM
 */
export async function canPerformInspection(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const isQC = await isQCInspector(user.id, projectId);
  const isPM = await isProjectManager(user.id, projectId);
  
  return isQC || isPM;
}

/**
 * ตรวจสอบสิทธิ์ในการแก้ไข Inspection/Checklist
 * - Admin: แก้ไขได้ทุก Inspection
 * - QC Inspector: แก้ไขได้ในโปรเจกต์ที่เป็น QC
 * - Project Manager: แก้ไขได้ในโปรเจกต์ที่เป็น PM
 * - Checklist Creator: แก้ไขได้เฉพาะ checklist ที่สร้างเอง
 */
export async function canEditInspection(user: User, checklistId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const db = await getDb();
  if (!db) return false;

  // Import taskChecklists schema
  const { taskChecklists } = await import('../../drizzle/schema');
  
  // Get checklist details
  const checklist = await db
    .select({
      taskId: taskChecklists.taskId,
    })
    .from(taskChecklists)
    .where(eq(taskChecklists.id, checklistId))
    .limit(1);

  if (checklist.length === 0) return false;

  // Get task to find project
  const task = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, checklist[0].taskId))
    .limit(1);

  if (task.length === 0) return false;

  // Check if user is QC inspector or project manager
  const isQC = await isQCInspector(user.id, task[0].projectId);
  const isPM = await isProjectManager(user.id, task[0].projectId);

  return isQC || isPM;
}

/**
 * ตรวจสอบสิทธิ์ในการอนุมัติ Inspection
 * - Admin: อนุมัติได้ทุก Inspection
 * - QC Inspector: อนุมัติได้ในโปรเจกต์ที่เป็น QC
 * - Project Manager: อนุมัติได้ในโปรเจกต์ที่เป็น PM
 */
export async function canApproveInspection(user: User, checklistId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const db = await getDb();
  if (!db) return false;

  // Import taskChecklists schema
  const { taskChecklists } = await import('../../drizzle/schema');
  
  // Get checklist details
  const checklist = await db
    .select({ taskId: taskChecklists.taskId })
    .from(taskChecklists)
    .where(eq(taskChecklists.id, checklistId))
    .limit(1);

  if (checklist.length === 0) return false;

  // Get task to find project
  const task = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, checklist[0].taskId))
    .limit(1);

  if (task.length === 0) return false;

  // Check if user is QC inspector or project manager
  const isQC = await isQCInspector(user.id, task[0].projectId);
  const isPM = await isProjectManager(user.id, task[0].projectId);

  return isQC || isPM;
}

/**
 * ตรวจสอบสิทธิ์ในการจัดการสมาชิกโปรเจกต์
 * - Admin: จัดการได้ทุกโปรเจกต์
 * - Project Manager: จัดการได้ในโปรเจกต์ที่เป็น PM
 * - Project Owner: จัดการได้ในโปรเจกต์ที่สร้าง
 */
export async function canManageProjectMembers(user: User, projectId: number): Promise<boolean> {
  if (isAdmin(user)) return true;
  
  const isPM = await isProjectManager(user.id, projectId);
  const isOwner = await isProjectOwner(user.id, projectId);
  
  return isPM || isOwner;
}

// ==================== Middleware Functions ====================

/**
 * Middleware: ต้องเป็น Admin
 */
export function requireAdmin(user: User): void {
  if (!isAdmin(user)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'ต้องมีสิทธิ์ Admin เท่านั้น',
    });
  }
}

/**
 * Middleware: ต้องเป็นสมาชิกของโปรเจกต์
 */
export async function requireProjectMember(user: User, projectId: number): Promise<void> {
  if (isAdmin(user)) return;
  
  const isMember = await isProjectMember(user.id, projectId);
  if (!isMember) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'คุณไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้',
    });
  }
}

/**
 * Middleware: ต้องเป็น Project Manager
 */
export async function requireProjectManager(user: User, projectId: number): Promise<void> {
  if (isAdmin(user)) return;
  
  const isPM = await isProjectManager(user.id, projectId);
  if (!isPM) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'ต้องเป็น Project Manager เท่านั้น',
    });
  }
}

/**
 * Middleware: ต้องเป็น QC Inspector
 */
export async function requireQCInspector(user: User, projectId: number): Promise<void> {
  if (isAdmin(user)) return;
  
  const isQC = await isQCInspector(user.id, projectId);
  if (!isQC) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'ต้องเป็น QC Inspector เท่านั้น',
    });
  }
}

/**
 * Middleware: ตรวจสอบสิทธิ์ทั่วไป
 */
export async function checkPermission(
  user: User,
  checkFn: (user: User, ...args: any[]) => Promise<boolean>,
  errorMessage: string,
  ...args: any[]
): Promise<void> {
  const hasPermission = await checkFn(user, ...args);
  if (!hasPermission) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: errorMessage,
    });
  }
}
