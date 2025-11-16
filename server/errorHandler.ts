import { Request, Response, NextFunction } from "express";
import { logOOMEvent, logEMFILEEvent, logGeneralError } from './monitoring/errorLogger';

export interface ErrorWithCode extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  path?: string;
}

/**
 * Enhanced error logger with context
 */
export function logError(error: ErrorWithCode, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error.message,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    path: error.path,
    stack: error.stack,
    ...context,
  };
  
  console.error("[Error]", JSON.stringify(errorInfo, null, 2));
}

/**
 * Handle EMFILE (too many open files) error
 */
export function handleEMFILEError(error: ErrorWithCode): boolean {
  if (error.code === "EMFILE" || error.errno === -24) {
    console.error("[EMFILE] Too many open files detected");
    logError(error, {
      type: "EMFILE",
      recommendation: "Check for file descriptor leaks, increase ulimit, or implement connection pooling",
    });
    
    // Log to error logger
    logEMFILEEvent(error, {
      recommendation: "Check for file descriptor leaks, increase ulimit, or implement connection pooling",
    }).catch(err => console.error('Failed to log EMFILE event:', err));
    
    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    return true;
  }
  return false;
}

/**
 * Handle ENOMEM (out of memory) error
 */
export function handleENOMEMError(error: ErrorWithCode): boolean {
  if (error.code === "ENOMEM" || error.message.includes("out of memory")) {
    console.error("[ENOMEM] Out of memory detected");
    logError(error, {
      type: "ENOMEM",
      memoryUsage: process.memoryUsage(),
      recommendation: "Check for memory leaks, reduce cache size, or increase available memory",
    });
    
    // Log to error logger
    logOOMEvent(error, {
      memoryUsage: process.memoryUsage(),
      recommendation: "Check for memory leaks, reduce cache size, or increase available memory",
    }).catch(err => console.error('Failed to log OOM event:', err));
    
    // Trigger garbage collection
    if (global.gc) {
      global.gc();
    }
    
    return true;
  }
  return false;
}

/**
 * Handle ECONNRESET (connection reset) error
 */
export function handleECONNRESETError(error: ErrorWithCode): boolean {
  if (error.code === "ECONNRESET") {
    console.warn("[ECONNRESET] Connection reset by peer");
    logError(error, {
      type: "ECONNRESET",
      recommendation: "Client disconnected, this is usually not critical",
    });
    return true;
  }
  return false;
}

/**
 * Handle ETIMEDOUT (connection timeout) error
 */
export function handleETIMEDOUTError(error: ErrorWithCode): boolean {
  if (error.code === "ETIMEDOUT") {
    console.warn("[ETIMEDOUT] Connection timeout");
    logError(error, {
      type: "ETIMEDOUT",
      recommendation: "Check network connectivity or increase timeout values",
    });
    return true;
  }
  return false;
}

/**
 * Comprehensive error handler
 */
export function handleSystemError(error: ErrorWithCode, context?: Record<string, any>): void {
  // Try specific handlers first
  if (handleEMFILEError(error)) return;
  if (handleENOMEMError(error)) return;
  if (handleECONNRESETError(error)) return;
  if (handleETIMEDOUTError(error)) return;
  
  // Generic error logging
  logError(error, context);
}

/**
 * Express error handling middleware
 */
export function errorMiddleware(
  error: ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const context = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };
  
  handleSystemError(error, context);
  
  // Send appropriate response
  if (error.code === "EMFILE") {
    res.status(503).json({
      error: "Service temporarily unavailable",
      message: "Server is experiencing high load. Please try again later.",
    });
  } else if (error.code === "ENOMEM") {
    res.status(503).json({
      error: "Service temporarily unavailable",
      message: "Server is experiencing memory issues. Please try again later.",
    });
  } else if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
    res.status(504).json({
      error: "Gateway timeout",
      message: "Request timeout. Please try again.",
    });
  } else {
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred.",
    });
  }
}

/**
 * Process-level error handlers
 */
export function setupProcessErrorHandlers() {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error: ErrorWithCode) => {
    console.error("[UncaughtException] Critical error detected");
    handleSystemError(error, { type: "uncaughtException" });
    
    // Give time to log before exiting
    setTimeout(() => {
      console.error("[UncaughtException] Exiting process");
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("[UnhandledRejection] Unhandled promise rejection");
    const error = reason instanceof Error ? reason : new Error(String(reason));
    handleSystemError(error as ErrorWithCode, {
      type: "unhandledRejection",
      promise: promise.toString(),
    });
  });
  
  // Handle warnings
  process.on("warning", (warning: Error) => {
    console.warn("[Warning]", warning.name, warning.message);
    if (warning.stack) {
      console.warn(warning.stack);
    }
  });
  
  // Handle SIGTERM gracefully
  process.on("SIGTERM", () => {
    console.log("[SIGTERM] Graceful shutdown initiated");
    // Give time for cleanup
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  });
  
  // Handle SIGINT gracefully
  process.on("SIGINT", () => {
    console.log("[SIGINT] Graceful shutdown initiated");
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  });
}

/**
 * Monitor memory usage and log warnings
 */
export function startMemoryMonitoring(intervalMs: number = 60000) {
  setInterval(() => {
    const usage = process.memoryUsage();
    const heapPercentage = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapPercentage > 80) {
      console.warn("[Memory] High heap usage:", {
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${heapPercentage.toFixed(2)}%`,
        rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
        external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
      });
      
      // Trigger GC if available
      if (global.gc) {
        global.gc();
      }
    }
  }, intervalMs);
}
