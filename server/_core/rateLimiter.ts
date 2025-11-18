import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Enhanced Rate Limiting Configuration
 * 
 * Provides different rate limits for different types of endpoints
 * to prevent abuse and DDoS attacks
 */

// General API rate limiter (100 requests per 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests in development
  skip: (req: Request) => process.env.NODE_ENV === "development",
});

// Strict limiter for authentication endpoints (5 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many authentication attempts, please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
});

// File upload limiter (20 uploads per hour)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: "Too many file uploads, please try again later.",
    code: "UPLOAD_RATE_LIMIT_EXCEEDED",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive operations (10 per hour)
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many sensitive operations, please try again later.",
    code: "SENSITIVE_RATE_LIMIT_EXCEEDED",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict limiter for critical operations (3 per hour)
export const criticalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many critical operations, please try again later.",
    code: "CRITICAL_RATE_LIMIT_EXCEEDED",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Flexible limiter for read-only operations (200 per 15 minutes)
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: "Too many read requests, please try again later.",
    code: "READ_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => process.env.NODE_ENV === "development",
});

// Custom handler for rate limit exceeded
export function rateLimitHandler(req: Request, res: Response) {
  res.status(429).json({
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
    message: "You have exceeded the rate limit. Please try again later.",
  });
}

/**
 * Create a custom rate limiter with specific options
 */
export function createCustomLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessful?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message,
      code: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessful || false,
    skip: (req: Request) => process.env.NODE_ENV === "development",
  });
}
