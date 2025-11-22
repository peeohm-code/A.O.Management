import { TRPCError } from "@trpc/server";
import { middleware } from "../_core/trpc";
import {
  canViewProject,
  canEditProject,
  canDeleteProject,
  canCreateTask,
  canEditTask,
  canDeleteTask,
  canCreateDefect,
  canEditDefect,
  canDeleteDefect,
  canPerformInspection,
  canManageProjectMembers,
  isAdmin,
} from "./permissions";
import type { User } from "../../drizzle/schema";

/**
 * tRPC Middleware Wrappers สำหรับ Permission Checks
 * 
 * ใช้ middleware เหล่านี้แทนการเขียน inline permission checks ใน routers
 * เพื่อให้โค้ดสะอาด มีมาตรฐานเดียวกัน และจัดการง่ายขึ้น
 */

// ==================== Admin Middleware ====================

/**
 * Middleware: ต้องเป็น Admin เท่านั้น
 * 
 * @example
 * const adminProcedure = protectedProcedure.use(requireAdminMiddleware);
 * 
 * adminProcedure.query(async ({ ctx }) => {
 *   // ctx.user จะเป็น admin เท่านั้น
 * });
 */
export const requireAdminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  if (!isAdmin(ctx.user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "ต้องมีสิทธิ์ Admin เท่านั้น",
    });
  }

  return next({ ctx });
});

// ==================== Project Permission Middleware ====================

/**
 * Middleware: ตรวจสอบสิทธิ์ในการดูโปรเจกต์
 * 
 * @example
 * protectedProcedure
 *   .input(z.object({ projectId: z.number() }))
 *   .use(requireViewProjectMiddleware)
 *   .query(async ({ input, ctx }) => {
 *     // ctx.user มีสิทธิ์ดูโปรเจกต์นี้แล้ว
 *   });
 */
export const requireViewProjectMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId || (input as any)?.id;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canViewProject(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

/**
 * Middleware: ตรวจสอบสิทธิ์ในการแก้ไขโปรเจกต์
 */
export const requireEditProjectMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId || (input as any)?.id;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canEditProject(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์แก้ไขโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

/**
 * Middleware: ตรวจสอบสิทธิ์ในการลบโปรเจกต์
 */
export const requireDeleteProjectMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId || (input as any)?.id;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canDeleteProject(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์ลบโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

// ==================== Task Permission Middleware ====================

/**
 * Middleware: ตรวจสอบสิทธิ์ในการสร้าง Task
 */
export const requireCreateTaskMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canCreateTask(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์สร้าง Task ในโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

/**
 * Middleware: ตรวจสอบสิทธิ์ในการแก้ไข Task
 */
export const requireEditTaskMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const taskId = (input as any)?.taskId || (input as any)?.id;
  if (!taskId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ taskId ใน input",
    });
  }

  const hasPermission = await canEditTask(ctx.user, taskId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์แก้ไข Task นี้",
    });
  }

  return next({ ctx });
});

/**
 * Middleware: ตรวจสอบสิทธิ์ในการลบ Task
 */
export const requireDeleteTaskMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const taskId = (input as any)?.taskId || (input as any)?.id;
  if (!taskId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ taskId ใน input",
    });
  }

  const hasPermission = await canDeleteTask(ctx.user, taskId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์ลบ Task นี้",
    });
  }

  return next({ ctx });
});

// ==================== Defect Permission Middleware ====================

/**
 * Middleware: ตรวจสอบสิทธิ์ในการสร้าง Defect
 */
export const requireCreateDefectMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canCreateDefect(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์สร้าง Defect ในโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

/**
 * Middleware: ตรวจสอบสิทธิ์ในการแก้ไข Defect
 */
export const requireEditDefectMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const defectId = (input as any)?.defectId || (input as any)?.id;
  if (!defectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ defectId ใน input",
    });
  }

  const hasPermission = await canEditDefect(ctx.user, defectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์แก้ไข Defect นี้",
    });
  }

  return next({ ctx });
});

/**
 * Middleware: ตรวจสอบสิทธิ์ในการลบ Defect
 */
export const requireDeleteDefectMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const defectId = (input as any)?.defectId || (input as any)?.id;
  if (!defectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ defectId ใน input",
    });
  }

  const hasPermission = await canDeleteDefect(ctx.user, defectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์ลบ Defect นี้",
    });
  }

  return next({ ctx });
});

// ==================== Inspection Permission Middleware ====================

/**
 * Middleware: ตรวจสอบสิทธิ์ในการทำ QC Inspection
 */
export const requirePerformInspectionMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canPerformInspection(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์ทำ QC Inspection ในโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

// ==================== Project Members Permission Middleware ====================

/**
 * Middleware: ตรวจสอบสิทธิ์ในการจัดการสมาชิกโปรเจกต์
 */
export const requireManageProjectMembersMiddleware = middleware(async ({ ctx, input, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  const projectId = (input as any)?.projectId;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบ projectId ใน input",
    });
  }

  const hasPermission = await canManageProjectMembers(ctx.user, projectId);
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "คุณไม่มีสิทธิ์จัดการสมาชิกโปรเจกต์นี้",
    });
  }

  return next({ ctx });
});

// ==================== Generic Permission Middleware ====================

/**
 * สร้าง middleware แบบ dynamic สำหรับ permission check ใดๆ
 * 
 * @example
 * const canEditProjectProcedure = protectedProcedure.use(
 *   createPermissionMiddleware(canEditProject, "คุณไม่มีสิทธิ์แก้ไขโปรเจกต์นี้", "projectId")
 * );
 */
export function createPermissionMiddleware(
  checkFn: (user: User, resourceId: number) => Promise<boolean>,
  errorMessage: string,
  resourceIdField: string = "id"
) {
  return middleware(async ({ ctx, input, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบก่อน",
      });
    }

    const resourceId = (input as any)?.[resourceIdField];
    if (!resourceId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `ไม่พบ ${resourceIdField} ใน input`,
      });
    }

    const hasPermission = await checkFn(ctx.user, resourceId);
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: errorMessage,
      });
    }

    return next({ ctx });
  });
}
