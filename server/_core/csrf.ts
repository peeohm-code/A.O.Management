import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * CSRF Protection Middleware
 * 
 * Modern CSRF protection using Double Submit Cookie pattern
 * (csurf package is deprecated, so we implement our own)
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

// Generate a random CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

// Middleware to set CSRF token cookie
export function setCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS requests (safe methods)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Check if token already exists in cookie
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    // Generate new token
    token = generateCsrfToken();
    
    // Set cookie with secure options
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  next();
}

// Middleware to verify CSRF token
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip for public endpoints (OAuth callback, webhooks)
  const publicPaths = ["/api/oauth/callback", "/api/webhooks"];
  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Verify both tokens exist and match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      error: "CSRF token validation failed",
      code: "CSRF_INVALID",
    });
  }

  next();
}

// Endpoint to get CSRF token for client
export function getCsrfToken(req: Request, res: Response) {
  const token = req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();
  
  // Set cookie if not exists
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  res.json({ csrfToken: token });
}
