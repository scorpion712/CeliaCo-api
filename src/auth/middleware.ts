import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../helpers/auth/jwtHelper';
import { errors } from '../errors';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  provider: 'firebase' | 'credentials';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  userId?: string;
}

export const authMiddleware = (requiredRoles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = (req.headers as any).authorization || req.headers.get('authorization');
      
      if (!authHeader) {
        return next(errors.unauthorized('Authorization header required'));
      }

      const [bearer, token] = authHeader.split(' ');
      
      if (bearer !== 'Bearer' || !token) {
        return next(errors.unauthorized('Invalid authorization format'));
      }

      const decoded = verifyAccessToken(token);
      
      if (!decoded) {
        return next(errors.tokenInvalid('Invalid token'));
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.userRole)) {
        return next(errors.forbidden('Insufficient permissions'));
      }

      req.user = {
        id: decoded.userId,
        email: decoded.userEmail,
        nombre: decoded.userName,
        rol: decoded.userRole,
        provider: 'credentials',
      };
      req.userId = decoded.userId;
      
      next();
    } catch (error: any) {
      console.error('[Auth] Token verification failed:', error.message, error.name);
      if (error.name === 'TokenExpiredError') {
        return next(errors.tokenExpired('Token has expired'));
      }
      return next(errors.tokenInvalid('Invalid token'));
    }
  };
};