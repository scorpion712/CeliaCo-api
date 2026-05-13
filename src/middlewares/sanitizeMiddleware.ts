/**
 * Input Sanitization Middleware - Phase 2
 * Implements OWASP Top 10 2025:
 * - A03: Injection Prevention
 * 
 * Sanitizes all string inputs to prevent XSS attacks
 * before they reach Joi validation or business logic.
 */

import xss from 'xss';
import { Request, Response, NextFunction } from 'express';

// XSS filter options - strip dangerous HTML
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const xssOptions: any = {
  whiteList: {}, // No allowed tags - strip all HTML
  stripIgnoreTag: true,
  stripIgnoreTagBody: true,
};

// Clean a single value
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return xss(value, xssOptions);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
};

// ─── Body Sanitization ───────────────────────────────────────────
// Applied after body parser, before validation

export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body) as any;
  }
  next();
};

// ─── Query Params Sanitization ─────────────────────────────────
// Applied before route handlers

export const sanitizeQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.query) {
    req.query = sanitizeValue(req.query) as any;
  }
  next();
};

// ─── Combined Sanitizer ────────────────────────────────────────────

export const inputSanitizer = [sanitizeBody, sanitizeQuery];

export default inputSanitizer;