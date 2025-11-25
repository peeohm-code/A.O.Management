/**
 * Centralized Error Handler
 * Provides user-friendly error messages in Thai and error tracking
 */

import { toast } from "sonner";

export interface AppError {
  code: string;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
}

// Error message mapping (Thai translations)
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
  TIMEOUT_ERROR: "การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง",
  
  // Authentication errors
  UNAUTHORIZED: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบใหม่",
  FORBIDDEN: "คุณไม่มีสิทธิ์ในการดำเนินการนี้",
  SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  
  // Validation errors
  VALIDATION_ERROR: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
  REQUIRED_FIELD: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
  INVALID_FORMAT: "รูปแบบข้อมูลไม่ถูกต้อง",
  
  // Database errors
  NOT_FOUND: "ไม่พบข้อมูลที่ต้องการ",
  DUPLICATE_ENTRY: "ข้อมูลนี้มีอยู่ในระบบแล้ว",
  DATABASE_ERROR: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
  
  // File upload errors
  FILE_TOO_LARGE: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)",
  INVALID_FILE_TYPE: "ประเภทไฟล์ไม่ถูกต้อง",
  UPLOAD_FAILED: "การอัปโหลดไฟล์ล้มเหลว กรุณาลองใหม่อีกครั้ง",
  
  // Business logic errors
  TASK_DEPENDENCY_ERROR: "ไม่สามารถลบงานนี้ได้เนื่องจากมีงานอื่นที่ขึ้นอยู่กับงานนี้",
  INSPECTION_INCOMPLETE: "กรุณาตรวจสอบรายการให้ครบถ้วนก่อนส่ง",
  DEFECT_NOT_RESOLVED: "ต้องแก้ไขข้อบกพร่องก่อนปิดงาน",
  
  // Generic errors
  UNKNOWN_ERROR: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาติดต่อผู้ดูแลระบบ",
  SERVER_ERROR: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง",
};

/**
 * Parse error from various sources and return standardized AppError
 */
export function parseError(error: unknown): AppError {
  // Handle AppError
  if (isAppError(error)) {
    return error;
  }

  // Handle tRPC errors
  if (isTRPCError(error)) {
    const code = error.data?.code || "UNKNOWN_ERROR";
    const message = error.message;
    
    return {
      code,
      message: ERROR_MESSAGES[code] || message || ERROR_MESSAGES.UNKNOWN_ERROR,
      originalError: error as Error,
      context: error.data,
    };
  }

  // Handle network errors
  if ((error as any) instanceof TypeError && typeof (error as any).message === 'string' && (error as any).message.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: ERROR_MESSAGES.NETWORK_ERROR,
      originalError: error,
    };
  }

  // Handle generic Error
  if ((error as any) instanceof Error) {
    // Check for specific error messages
    const errorMessage = (error as any).message || '';
    if (typeof errorMessage === 'string' && errorMessage.includes("timeout")) {
      return {
        code: "TIMEOUT_ERROR",
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        originalError: error,
      };
    }

    if (typeof errorMessage === 'string' && (errorMessage.includes("401") || errorMessage.includes("Unauthorized"))) {
      return {
        code: "UNAUTHORIZED",
        message: ERROR_MESSAGES.UNAUTHORIZED,
        originalError: error,
      };
    }

    if (typeof errorMessage === 'string' && (errorMessage.includes("403") || errorMessage.includes("Forbidden"))) {
      return {
        code: "FORBIDDEN",
        message: ERROR_MESSAGES.FORBIDDEN,
        originalError: error,
      };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: typeof errorMessage === 'string' ? errorMessage : ERROR_MESSAGES.UNKNOWN_ERROR,
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      code: "UNKNOWN_ERROR",
      message: error,
    };
  }

  // Fallback for unknown error types
  return {
    code: "UNKNOWN_ERROR",
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
  };
}

/**
 * Display error toast with user-friendly message
 */
export function showErrorToast(error: unknown, title?: string) {
  const appError = parseError(error);
  
  toast.error(title || "เกิดข้อผิดพลาด", {
    description: appError.message,
    duration: 5000,
  });

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error("[Error Handler]", {
      code: appError.code,
      message: appError.message,
      original: appError.originalError,
      context: appError.context,
    });
  }

  // TODO: Send to error tracking service (Sentry, etc.)
  // trackError(appError);
}

/**
 * Handle async operation with error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    showErrorToast(error, errorMessage);
    return null;
  }
}

/**
 * Type guards
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

function isTRPCError(error: unknown): error is any {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as any).data === "object"
  );
}

/**
 * Get user-friendly error message by code
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Validation helper
 */
export function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    throw {
      code: "REQUIRED_FIELD",
      message: `กรุณากรอก${fieldName}`,
    } as AppError;
  }
}

/**
 * File validation helper
 */
export function validateFile(file: File, maxSizeMB: number = 10): void {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    throw {
      code: "FILE_TOO_LARGE",
      message: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)`,
    } as AppError;
  }

  // Validate file type for images
  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validImageTypes.includes(file.type)) {
    throw {
      code: "INVALID_FILE_TYPE",
      message: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP)",
    } as AppError;
  }
}
