/**
 * Input Validation and Sanitization Service
 * Provides comprehensive validation and sanitization for user inputs
 */

import { z } from "zod";
import { createTRPCError } from "./errorHandlerService";

/**
 * Common Zod schemas for reuse
 */
export const CommonSchemas = {
  // Basic types
  nonEmptyString: z.string().min(1, "กรุณากรอกข้อมูล"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  url: z.string().url("รูปแบบ URL ไม่ถูกต้อง"),
  
  // Numbers
  positiveInt: z.number().int().positive("ต้องเป็นจำนวนเต็มบวก"),
  nonNegativeInt: z.number().int().nonnegative("ต้องไม่เป็นค่าลบ"),
  percentage: z.number().min(0).max(100, "ต้องอยู่ระหว่าง 0-100"),
  
  // Dates
  futureDate: z.date().refine((date) => date > new Date(), {
    message: "ต้องเป็นวันที่ในอนาคต",
  }),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  
  // Project specific
  projectStatus: z.enum(["draft", "planning", "active", "on_hold", "completed", "cancelled"]),
  taskStatus: z.enum([
    "todo",
    "pending_pre_inspection",
    "ready_to_start",
    "in_progress",
    "pending_final_inspection",
    "rectification_needed",
    "completed",
    "not_started",
    "delayed",
  ]),
  defectStatus: z.enum([
    "reported",
    "analysis",
    "in_progress",
    "resolved",
    "pending_reinspection",
    "closed",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  
  // File validation
  imageUrl: z.string().url().refine(
    (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url),
    "ต้องเป็น URL ของรูปภาพ"
  ),
};

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  
  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
  
  return sanitized.trim();
}

/**
 * Sanitize text input (remove dangerous characters)
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  
  // Remove null bytes and control characters
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitize SQL-like input (prevent SQL injection)
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return "";
  
  // Remove SQL keywords and special characters
  return input
    .replace(/['";\\]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .trim();
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "";
  
  // Remove path traversal attempts and dangerous characters
  return fileName
    .replace(/\.\./g, "")
    .replace(/[<>:"|?*]/g, "")
    .replace(/^\.+/, "")
    .trim();
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFileUpload(
  file: { name: string; size: number; type: string },
  options: FileValidationOptions = {}
): void {
  const {
    maxSizeMB = 10,
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"],
  } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)`,
      { fileSize: file.size, maxSize: maxSizeBytes }
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `ประเภทไฟล์ไม่ถูกต้อง (รองรับ: ${allowedTypes.join(", ")})`,
      { fileType: file.type, allowedTypes }
    );
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `นามสกุลไฟล์ไม่ถูกต้อง (รองรับ: ${allowedExtensions.join(", ")})`,
      { fileName: file.name, allowedExtensions }
    );
  }

  // Sanitize file name
  const sanitizedName = sanitizeFileName(file.name);
  if (sanitizedName !== file.name) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      "ชื่อไฟล์มีอักขระที่ไม่อนุญาต",
      { fileName: file.name }
    );
  }
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date,
  fieldName: string = "วันที่"
): void {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName}เริ่มต้นไม่ถูกต้อง`,
      { startDate }
    );
  }

  if (isNaN(end.getTime())) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName}สิ้นสุดไม่ถูกต้อง`,
      { endDate }
    );
  }

  if (start > end) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName}เริ่มต้นต้องไม่เกิน${fieldName}สิ้นสุด`,
      { startDate, endDate }
    );
  }
}

/**
 * Validate coordinates
 */
export function validateCoordinates(latitude: string, longitude: string): void {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      "ค่า Latitude ไม่ถูกต้อง (ต้องอยู่ระหว่าง -90 ถึง 90)",
      { latitude }
    );
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      "ค่า Longitude ไม่ถูกต้อง (ต้องอยู่ระหว่าง -180 ถึง 180)",
      { longitude }
    );
  }
}

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string, fieldName: string = "JSON"): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName} รูปแบบไม่ถูกต้อง`,
      { jsonString }
    );
  }
}

/**
 * Validate array length
 */
export function validateArrayLength(
  array: any[],
  min: number,
  max: number,
  fieldName: string = "รายการ"
): void {
  if (array.length < min) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName}ต้องมีอย่างน้อย ${min} รายการ`,
      { length: array.length, min }
    );
  }

  if (array.length > max) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName}ต้องไม่เกิน ${max} รายการ`,
      { length: array.length, max }
    );
  }
}

/**
 * Validate unique values in array
 */
export function validateUniqueArray<T>(
  array: T[],
  fieldName: string = "รายการ"
): void {
  const uniqueValues = new Set(array);
  if (uniqueValues.size !== array.length) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      `${fieldName}มีค่าซ้ำกัน`,
      { array }
    );
  }
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): void {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (record.count >= maxRequests) {
    throw createTRPCError(
      "VALIDATION_ERROR",
      "คุณทำรายการบ่อยเกินไป กรุณารอสักครู่",
      { key, maxRequests, windowMs }
    );
  }

  record.count++;
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [key, record] of entries) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute
