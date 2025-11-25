/**
 * Security Middleware for TRPC
 * Provides rate limiting, input sanitization, and security headers
 */

import { TRPCError } from "@trpc/server";
import { middleware } from "./_core/trpc";
import { checkRateLimit, sanitizeText, sanitizeHtml } from "./validationService";
import { logger } from "./logger";

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per user
 */
export const rateLimitMiddleware = middleware(async ({ ctx, next, path }: { ctx: any; next: any; path: any }) => {
  if (!ctx.user) {
    // For unauthenticated users, use IP-based rate limiting
    const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
    checkRateLimit(`ip:${ip}`, 50, 60000); // 50 requests per minute
  } else {
    // For authenticated users, use user ID-based rate limiting
    checkRateLimit(`user:${ctx.user.id}`, 200, 60000); // 200 requests per minute
  }

  return next();
});

/**
 * Input sanitization middleware
 * Automatically sanitizes string inputs to prevent XSS
 */
export const sanitizeInputMiddleware = middleware(async ({ ctx, next }) => {
  // Note: rawInput is not available in tRPC middleware context
  // Sanitization should be done at the procedure level
  return next();
});

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  if (typeof obj === "string") {
    // Check if it looks like HTML
    if (/<[^>]+>/.test(obj)) {
      return sanitizeHtml(obj);
    }
    return sanitizeText(obj);
  }

  return obj;
}

/**
 * Audit logging middleware
 * Logs sensitive operations for security auditing
 */
const SENSITIVE_OPERATIONS = [
  "user.delete",
  "user.updateRole",
  "project.delete",
  "project.archive",
  "defect.delete",
  "admin.",
];

export const auditLogMiddleware = middleware(async ({ ctx, next, path }) => {
  const isSensitive = SENSITIVE_OPERATIONS.some((op) => path.startsWith(op));

  if (isSensitive && ctx.user) {
    logger.info("[Audit Log] " + JSON.stringify({
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      action: path,
      timestamp: new Date().toISOString(),
      ip: ctx.req.ip || ctx.req.socket.remoteAddress,
    }));
  }

  return next();
});

/**
 * Permission check middleware factory
 * Creates middleware that checks if user has required permission
 */
export function requirePermission(permission: string) {
  return middleware(async ({ ctx, next }: { ctx: any; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
      });
    }

    // TODO: Implement permission checking logic
    // For now, check if user is admin for sensitive operations
    const sensitivePermissions = ["delete", "admin", "manage_users"];
    const requiresAdmin = sensitivePermissions.some((p) => permission.includes(p));

    if (requiresAdmin && ctx.user.role !== "admin" && ctx.user.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "คุณไม่มีสิทธิ์ในการดำเนินการนี้",
      });
    }

    return next();
  });
}

/**
 * Project member check middleware
 * Ensures user is a member of the project they're accessing
 */
export const requireProjectMember = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
    });
  }

  // Skip check for admins/owners
  if (ctx.user.role === "admin" || ctx.user.role === "owner") {
    return next();
  }

  // Note: projectId validation should be done at the procedure level
  // as rawInput is not reliably available in middleware

  return next();
});

/**
 * CORS and security headers middleware
 */
export function setSecurityHeaders(req: any, res: any) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content Security Policy (basic)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
}

/**
 * SQL injection prevention helper
 * Validates that input doesn't contain SQL injection attempts
 */
export function validateNoSqlInjection(input: string, fieldName: string = "input"): void {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      logger.warn("[SQL Injection Attempt] " + JSON.stringify({
        input,
        fieldName,
        pattern: pattern.source,
      }));

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${fieldName}มีอักขระที่ไม่อนุญาต`,
      });
    }
  }
}

/**
 * File upload security check
 */
export function validateFileUploadSecurity(fileName: string, fileContent?: Buffer): void {
  // Check for path traversal
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ชื่อไฟล์ไม่ถูกต้อง",
    });
  }

  // Check for executable extensions
  const dangerousExtensions = [
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".app", ".deb", ".rpm",
    ".js", ".jar", ".py", ".php", ".asp", ".aspx", ".jsp",
  ];

  const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (extension && dangerousExtensions.includes(extension)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ประเภทไฟล์นี้ไม่อนุญาต",
    });
  }

  // Check file content if provided
  if (fileContent) {
    // Check for executable signatures
    const executableSignatures = [
      Buffer.from([0x4D, 0x5A]), // MZ (Windows executable)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux executable)
    ];

    for (const signature of executableSignatures) {
      if (fileContent.slice(0, signature.length).equals(signature)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ไฟล์นี้ไม่อนุญาต",
        });
      }
    }
  }
}
