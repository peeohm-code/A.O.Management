import { TRPCError } from "@trpc/server";
import { logger } from "../logger";

/**
 * In-memory rate limiter for tRPC procedures
 * Uses a sliding window algorithm to track requests per user
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // First request or window expired
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const rateLimiter = new RateLimiter();

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom error message */
  message?: string;
  /** Key function to identify the user/client */
  keyGenerator?: (userId: number, ip?: string) => string;
}

/**
 * Default rate limit configurations
 */
export const RateLimitPresets = {
  /** General API calls: 100 requests per 15 minutes */
  general: {
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: "Too many requests. Please try again later.",
  },
  /** Read operations: 200 requests per 15 minutes */
  read: {
    max: 200,
    windowMs: 15 * 60 * 1000,
    message: "Too many read requests. Please try again later.",
  },
  /** Write operations: 50 requests per 15 minutes */
  write: {
    max: 50,
    windowMs: 15 * 60 * 1000,
    message: "Too many write requests. Please try again later.",
  },
  /** Sensitive operations: 10 requests per hour */
  sensitive: {
    max: 10,
    windowMs: 60 * 60 * 1000,
    message: "Too many sensitive operations. Please try again later.",
  },
  /** Critical operations: 3 requests per hour */
  critical: {
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: "Too many critical operations. Please try again later.",
  },
  /** File uploads: 20 requests per hour */
  upload: {
    max: 20,
    windowMs: 60 * 60 * 1000,
    message: "Too many file uploads. Please try again later.",
  },
} as const;

/**
 * Create a rate limiting middleware for tRPC procedures
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware({ ctx, next }: any) {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    // Skip if no user (public endpoints)
    if (!ctx.user) {
      return next();
    }

    const userId = ctx.user.id;
    const ip = ctx.req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || 
               ctx.req?.headers?.["x-real-ip"] || 
               ctx.req?.socket?.remoteAddress;

    // Generate rate limit key
    const key = config.keyGenerator 
      ? config.keyGenerator(userId, ip)
      : `user:${userId}`;

    // Check rate limit
    const result = rateLimiter.check(key, config.max, config.windowMs);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      
      logger.warn(`[RateLimit] User ${userId} exceeded rate limit for ${key}`);
      
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: config.message || "Rate limit exceeded. Please try again later.",
        cause: {
          retryAfter: retryAfterSeconds,
          resetAt: new Date(result.resetAt).toISOString(),
        },
      });
    }

    // Add rate limit info to response headers (if available)
    if (ctx.res && typeof ctx.res.setHeader === "function") {
      ctx.res.setHeader("X-RateLimit-Limit", config.max.toString());
      ctx.res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
      ctx.res.setHeader("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
    }

    return next();
  };
}

/**
 * Pre-configured rate limit middlewares
 */
export const rateLimitMiddlewares = {
  general: createRateLimitMiddleware(RateLimitPresets.general),
  read: createRateLimitMiddleware(RateLimitPresets.read),
  write: createRateLimitMiddleware(RateLimitPresets.write),
  sensitive: createRateLimitMiddleware(RateLimitPresets.sensitive),
  critical: createRateLimitMiddleware(RateLimitPresets.critical),
  upload: createRateLimitMiddleware(RateLimitPresets.upload),
};

/**
 * Cleanup rate limiter on process exit
 */
process.on("beforeExit", () => {
  rateLimiter.destroy();
});
