import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';
import { AppError, ErrorCode } from '../errors';

interface LogEntry {
  timestamp: string;
  path: string;
  method: string;
  error: string;
  code?: string;
  stack?: string;
}

// ─── Not Found Handler ───────────────────────────────────────────────
// Phase 5: Must be last in app.use() chain

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: 'Recurso no encontrado',
    },
  });
};

// ─── Error Handler ───────────────────────────────────────────────

export const errorHandler = (
  err: Error | HttpError | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: err.message,
  };

  if (process.env.NODE_ENV === 'development') {
    logEntry.stack = err.stack;
  }

  // AppError - our custom error class
  if (err instanceof AppError) {
    logEntry.code = err.code;
    console.error(JSON.stringify(logEntry));

    return res.status(err.statusCode).json(err.toJSON());
  }

  // HttpError - from http-errors package
  if (err instanceof HttpError) {
    console.error(JSON.stringify(logEntry));

    return res.status(err.status || 500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: err.message,
      },
    });
  }

  // Generic Error - convert to proper API response
  logEntry.code = 'INTERNAL_ERROR';
  console.error(JSON.stringify(logEntry));

  // For known operational errors, return 400 instead of 500
  const isOperationalError = err.message.includes('no encontrado') || 
                           err.message.includes('ya existe') || 
                           err.message.includes('Duplicate') ||
                           err.message.includes('not found') ||
                           err.message.includes('exists');
  
  const statusCode = isOperationalError ? 400 : 500;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: isOperationalError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message: err.message,
    },
  });
};