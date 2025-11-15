/**
 * Error Logging Utility
 * 
 * Provides centralized error logging for the application.
 * In development: logs to console
 * In production: can be extended to send to external service (Sentry, LogRocket, etc.)
 */

export interface ErrorLogData {
  message: string;
  stack?: string;
  componentStack?: string;
  errorType?: string;
  userId?: number;
  userEmail?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Log error to console in development, and to external service in production
 */
export function logError(error: Error, errorInfo?: React.ErrorInfo, additionalData?: Record<string, unknown>): void {
  const errorData: ErrorLogData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack || undefined,
    timestamp: new Date(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    additionalData,
  };

  // Development: log to console
  if (process.env.NODE_ENV === "development") {
    console.group("🔴 Error Logged");
    console.error("Message:", errorData.message);
    console.error("Stack:", errorData.stack);
    if (errorData.componentStack) {
      console.error("Component Stack:", errorData.componentStack);
    }
    if (errorData.additionalData) {
      console.error("Additional Data:", errorData.additionalData);
    }
    console.error("URL:", errorData.url);
    console.error("Timestamp:", errorData.timestamp.toISOString());
    console.groupEnd();
  }

  // Production: send to external service
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error, { contexts: { errorData } });
    // Example: LogRocket.captureException(error, { extra: errorData });
    
    // For now, just log to console (will be sent to server logs)
    console.error("[Error Logger]", JSON.stringify(errorData, null, 2));
  }
}

/**
 * Log API error (for tRPC mutations/queries)
 */
export function logApiError(
  endpoint: string,
  error: unknown,
  requestData?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const apiError = new Error(`API Error at ${endpoint}: ${errorMessage}`);
  apiError.stack = errorStack;

  logError(apiError, undefined, {
    endpoint,
    requestData,
    errorType: "API_ERROR",
  });
}

/**
 * Log file upload error
 */
export function logFileUploadError(
  fileName: string,
  fileSize: number,
  error: unknown
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const uploadError = new Error(`File Upload Error: ${errorMessage}`);

  logError(uploadError, undefined, {
    fileName,
    fileSize,
    errorType: "FILE_UPLOAD_ERROR",
  });
}

/**
 * Log network error
 */
export function logNetworkError(url: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const networkError = new Error(`Network Error at ${url}: ${errorMessage}`);

  logError(networkError, undefined, {
    url,
    errorType: "NETWORK_ERROR",
  });
}
