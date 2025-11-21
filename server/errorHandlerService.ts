/**
 * Backend Error Handler Service
 * Centralized error handling and logging for server-side operations
 */

import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

export interface ErrorContext {
  userId?: number;
  projectId?: number;
  taskId?: number;
  action?: string;
  [key: string]: any;
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  
  // Validation
  VALIDATION_ERROR: "BAD_REQUEST",
  REQUIRED_FIELD: "BAD_REQUEST",
  INVALID_FORMAT: "BAD_REQUEST",
  
  // Database
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_ENTRY: "CONFLICT",
  DATABASE_ERROR: "INTERNAL_SERVER_ERROR",
  
  // Business Logic
  TASK_DEPENDENCY_ERROR: "BAD_REQUEST",
  INSPECTION_INCOMPLETE: "BAD_REQUEST",
  DEFECT_NOT_RESOLVED: "BAD_REQUEST",
  
  // System
  INTERNAL_ERROR: "INTERNAL_SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

/**
 * Create standardized TRPC error
 */
export function createTRPCError(
  code: keyof typeof ErrorCodes,
  message: string,
  context?: ErrorContext
): TRPCError {
  const trpcCode = ErrorCodes[code];
  
  // Log error
  logger.error(`[TRPC Error] ${code}: ${message}`, JSON.stringify({
    code,
    trpcCode,
    message,
    context,
  }));

  return new TRPCError({
    code: trpcCode as any,
    message,
    cause: context,
  });
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any, context?: ErrorContext): never {
  logger.error("[Database Error]", JSON.stringify({ error: error?.message || String(error), context }));

  // Check for specific database errors
  if (error.code === "ER_DUP_ENTRY" || error.message?.includes("duplicate")) {
    throw createTRPCError(
      "DUPLICATE_ENTRY",
      "ข้อมูลนี้มีอยู่ในระบบแล้ว",
      context
    );
  }

  if (error.code === "ER_NO_REFERENCED_ROW" || error.message?.includes("foreign key")) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      "ข้อมูลอ้างอิงไม่ถูกต้อง",
      context
    );
  }

  if (error.message?.includes("not found")) {
    throw createTRPCError(
      "NOT_FOUND",
      "ไม่พบข้อมูลที่ต้องการ",
      context
    );
  }

  // Generic database error
  throw createTRPCError(
    "DATABASE_ERROR",
    "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
    context
  );
}

/**
 * Handle validation errors
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw createTRPCError(
      "REQUIRED_FIELD",
      `กรุณากรอก${fieldName}`,
      { field: fieldName }
    );
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createTRPCError(
      "INVALID_FORMAT",
      "รูปแบบอีเมลไม่ถูกต้อง",
      { email }
    );
  }
}

export function validateDateRange(startDate: Date, endDate: Date): void {
  if (startDate > endDate) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      "วันเริ่มต้นต้องไม่เกินวันสิ้นสุด",
      { startDate, endDate }
    );
  }
}

/**
 * Handle authorization errors
 */
export function requirePermission(
  hasPermission: boolean,
  action: string,
  context?: ErrorContext
): void {
  if (!hasPermission) {
    throw createTRPCError(
      "FORBIDDEN",
      `คุณไม่มีสิทธิ์ในการ${action}`,
      context
    );
  }
}

export function requireAuthentication(user: any): void {
  if (!user) {
    throw createTRPCError(
      "UNAUTHORIZED",
      "กรุณาเข้าสู่ระบบก่อนใช้งาน"
    );
  }
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // If it's already a TRPC error, rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }

    // Handle database errors
    if (isDatabaseError(error)) {
      handleDatabaseError(error, context);
    }

    // Log unexpected error
    logger.error(`[Unexpected Error] ${errorMessage}`, JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      context,
    }));

    // Throw generic error
    throw createTRPCError(
      "INTERNAL_ERROR",
      errorMessage,
      { ...context, originalError: String(error) }
    );
  }
}

/**
 * Type guards
 */
function isDatabaseError(error: any): boolean {
  return (
    error?.code?.startsWith("ER_") ||
    error?.message?.includes("database") ||
    error?.message?.includes("query")
  );
}

/**
 * Log and track errors (for monitoring)
 */
export function trackError(error: Error, context?: ErrorContext): void {
  logger.error("[Error Tracked]", JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  }));

  // TODO: Send to error tracking service (Sentry, etc.)
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  code: string;
  message: string;
  details?: any;
} {
  if (error instanceof TRPCError) {
    return {
      code: error.code,
      message: error.message,
      details: error.cause,
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
  };
}
