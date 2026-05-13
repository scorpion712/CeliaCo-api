import { AppError } from './AppError';
import { ErrorCode } from './ErrorCode';

export const errors = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(ErrorCode.UNAUTHORIZED, 401, message),

  invalidCredentials: (message = 'Invalid credentials') =>
    new AppError(ErrorCode.INVALID_CREDENTIALS, 401, message),

  tokenExpired: (message = 'Token expired') =>
    new AppError(ErrorCode.TOKEN_EXPIRED, 401, message),

  tokenInvalid: (message = 'Invalid token') =>
    new AppError(ErrorCode.TOKEN_INVALID, 401, message),

  forbidden: (message = 'Access denied') =>
    new AppError(ErrorCode.FORBIDDEN, 403, message),

  userInactive: (message = 'User account is inactive') =>
    new AppError(ErrorCode.USER_INACTIVE, 403, message),

  notFound: (entity: string) =>
    new AppError(ErrorCode.DB_NOT_FOUND, 404, `${entity} not found`),

  duplicate: (entity: string) =>
    new AppError(ErrorCode.DB_DUPLICATE, 409, `${entity} already exists`),

  validation: (message: string) =>
    new AppError(ErrorCode.VALIDATION_ERROR, 400, message),

  missingField: (field: string) =>
    new AppError(ErrorCode.MISSING_FIELD, 400, `Missing required field: ${field}`),

  invalidFormat: (field: string, expected: string) =>
    new AppError(ErrorCode.INVALID_FORMAT, 400, `Invalid ${field}. Expected: ${expected}`),

  insufficientStock: (available: number, requested: number) =>
    new AppError(
      ErrorCode.INSUFFICIENT_STOCK,
      400,
      `Insufficient stock. Available: ${available}, Requested: ${requested}`
    ),

  accountOverdue: () =>
    new AppError(ErrorCode.ACCOUNT_OVERDUE, 400, 'Account is overdue'),

  saleCancelled: () =>
    new AppError(ErrorCode.SALE_ALREADY_CANCELLED, 400, 'Sale is already cancelled'),

  saleCompleted: () =>
    new AppError(ErrorCode.SALE_ALREADY_COMPLETED, 400, 'Sale is already completed'),

  invalidOperation: (message: string) =>
    new AppError(ErrorCode.INVALID_OPERATION, 400, message),

  dbConnection: (message = 'Database connection error') =>
    new AppError(ErrorCode.DB_CONNECTION, 500, message, false),

  dbTransaction: (message = 'Transaction error') =>
    new AppError(ErrorCode.DB_TRANSACTION, 500, message, false),

  fiscalServiceError: (message: string) =>
    new AppError(ErrorCode.FISCAL_SERVICE_ERROR, 502, message),

  printerError: (message: string) =>
    new AppError(ErrorCode.PRINTER_ERROR, 500, message),

  externalServiceError: (service: string) =>
    new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      `External service error: ${service}`
    ),

  internalError: (message = 'Internal server error') =>
    new AppError(ErrorCode.INTERNAL_ERROR, 500, message, false),

  notImplemented: (feature: string) =>
    new AppError(ErrorCode.NOT_IMPLEMENTED, 501, `Not implemented: ${feature}`),

  serviceUnavailable: (service: string) =>
    new AppError(ErrorCode.SERVICE_UNAVAILABLE, 503, `Service unavailable: ${service}`),
};