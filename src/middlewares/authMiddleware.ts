import { Request, Response, NextFunction } from 'express'; 

import { verifyAccessToken } from '../helpers/auth/jwtHelper';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): any => {
  const token = req.headers['authorization']?.split(' ')[1]; 
  if (!token) {
    return res.status(403).json({ message: 'Debe iniciar sesión para realizar esta acción' });
  }

  try {
    const decoded = verifyAccessToken(token as string);
    (req as any).userId = decoded.userId;  // Attach user info to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'El token ha expirado o no es válido' });
  }
};
