/**
 * Security Middleware - Simplified for Development
 * Keeps basic security without excessive rate limiting
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ============================================================
// HELMET - Security Headers ( essentials only )
// ============================================================

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
});

// ============================================================
// CORS - Allow all origins for development
// ============================================================

export const corsMiddleware = cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// ============================================================
// RATE LIMITING - Simple global limit ( no per-IP )
// ============================================================

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window per IP - generous
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints - slightly stricter but still lenient
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: {
    success: false,
    error: { code: 'TOO_MANY_AUTH_REQUESTS', message: 'Too many login attempts' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// REQUEST LOGGING
// ============================================================

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || duration > 1000) {
      console.warn(`[${req.method}] ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  
  next();
};

// ============================================================
// EXPORTS
// ============================================================

export const securityMiddleware = [
  helmetMiddleware,
  requestLoggerMiddleware,
];

export default securityMiddleware;