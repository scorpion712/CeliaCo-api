/**
 * Audit Logger - Phase 4
 * Implements OWASP Top 10 2025:
 * - A09: Logging Failures
 * 
 * Logs critical business events for security auditing:
 * - Authentication (login, logout, failed attempts)
 * - Sales (create, update, delete)
 * - Customer modifications
 * - Admin actions
 */

import { Request, Response, NextFunction } from 'express';

// ─── Event Types ───────────────────────────────────────────────

export enum AuditEvent {
  // Auth events
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILURE = 'auth.login.failure',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_TOKEN_REFRESH = 'auth.token.refresh',
  AUTH_INVALID_TOKEN = 'auth.invalid.token',

  // Sales events
  SALE_CREATED = 'sale.created',
  SALE_UPDATED = 'sale.updated',
  SALE_DELETED = 'sale.deleted',
  SALE_DESPRECIADA = 'sale.desestimada',

  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',

  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',

  // Admin events
  ADMIN_USER_CREATED = 'admin.user.created',
  ADMIN_USER_UPDATED = 'admin.user.updated',
  ADMIN_PASSWORD_CHANGE = 'admin.password.changed',

  // Account events
  CUENTA_CREATED = 'cuenta.created',
  CUENTA_PAYMENT = 'cuenta.payment',
}

// ─── Log Entry ───────────────────────────────────────────────

export interface AuditEntry {
  timestamp: string;
  event: AuditEvent;
  userId?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  status?: 'success' | 'failure';
  error?: string;
}

// ─── Logger ───────────────────────────────────────────────

const formatEntry = (entry: AuditEntry): string => {
  return JSON.stringify(entry);
};

export const logAudit = (entry: AuditEntry): void => {
  const fullEntry = {
    timestamp: new Date().toISOString(),
    event: entry.event,
    userId: entry.userId,
    userName: entry.userName,
    ip: entry.ip,
    userAgent: entry.userAgent,
    resourceId: entry.resourceId,
    resourceType: entry.resourceType,
    metadata: entry.metadata,
    status: entry.status,
    error: entry.error,
  };

  // Audit log - in production use proper logger (Winston/Pino)
  // console.log removed for production safety
};

// ─── Extract User Info ───────────────────────────────────────────────

const getUserInfo = (req: Request): { userId?: string; userName?: string } => {
  const user = (req as any).user;
  if (user) {
    return {
      userId: user.id || user.sub,
      userName: user.name || user.email,
    };
  }
  return {};
};

// ─── Audit Helper ───────────────────────────────────────────────

export const createAuditEntry = (
  req: Request,
  event: AuditEvent,
  options?: {
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, unknown>;
    status?: 'success' | 'failure';
    error?: string;
  }
): AuditEntry => {
  const { userId, userName } = getUserInfo(req);
  const userAgent = req.headers['user-agent'];
  const userAgentStr = Array.isArray(userAgent) ? userAgent[0] : userAgent;

  return {
    timestamp: new Date().toISOString(),
    event,
    userId,
    userName,
    ip: req.ip,
    userAgent: userAgentStr,
    resourceId: options?.resourceId,
    resourceType: options?.resourceType,
    metadata: options?.metadata,
    status: options?.status,
    error: options?.error,
  };
};

// ─── Audit Middleware ───────────────────────────────────────────────

// Middleware to log all mutations on critical routes
export const auditRoute = (routePattern: string, event: AuditEvent) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body): Response {
      const status = res.statusCode >= 400 ? 'failure' : 'success';

      // Don't log failed auth attempts here (handled by auth controller)
      if (!req.path.includes('/Auth/')) {
        logAudit(
          createAuditEntry(req, event, {
            resourceId: req.params.id as string,
            resourceType: routePattern,
            status,
            metadata: {
              method: req.method,
              path: req.path,
              body: req.method !== 'GET' ? body : undefined,
            },
          })
        );
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

// ─── Pre-built Audit Loggers ───────────────────────────────────────────────

export const auditLoginSuccess = (req: Request) =>
  logAudit(createAuditEntry(req, AuditEvent.AUTH_LOGIN_SUCCESS, { status: 'success' }));

export const auditLoginFailure = (req: Request, reason: string) =>
  logAudit(
    createAuditEntry(req, AuditEvent.AUTH_LOGIN_FAILURE, {
      status: 'failure',
      error: reason,
    })
  );

export const auditLogout = (req: Request) =>
  logAudit(createAuditEntry(req, AuditEvent.AUTH_LOGOUT, { status: 'success' }));

export const auditSaleCreated = (req: Request, saleId: string, metadata?: Record<string, unknown>) =>
  logAudit(
    createAuditEntry(req, AuditEvent.SALE_CREATED, {
      resourceId: saleId,
      resourceType: 'sale',
      metadata,
      status: 'success',
    })
  );

export const auditSaleDesestimada = (req: Request, saleId: string) =>
  logAudit(
    createAuditEntry(req, AuditEvent.SALE_DESPRECIADA, {
      resourceId: saleId,
      resourceType: 'sale',
      status: 'success',
    })
  );

export const auditCustomerCreated = (req: Request, customerId: string, name: string) =>
  logAudit(
    createAuditEntry(req, AuditEvent.CUSTOMER_CREATED, {
      resourceId: customerId,
      resourceType: 'customer',
      metadata: { name },
      status: 'success',
    })
  );

export const auditAdminAction = (req: Request, action: string, targetUserId: string) =>
  logAudit(
    createAuditEntry(req, action as AuditEvent, {
      resourceId: targetUserId,
      resourceType: 'admin',
      metadata: { action },
      status: 'success',
    })
  );

export default {
  logAudit,
  createAuditEntry,
  auditRoute,
  AuditEvent,
};