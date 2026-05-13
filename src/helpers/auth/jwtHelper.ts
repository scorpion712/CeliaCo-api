 import jwt, { SignOptions, Secret, TokenExpiredError } from 'jsonwebtoken';

const DEFAULT_SECRET = 'default-secret-key';
const DEFAULT_REFRESH_SECRET = 'default-refresh-secret';

export const generateAccessToken = (userId: string, userEmail: string, userRole: string, userName: string) => {
  const secret = (process.env.JWT_SECRET || DEFAULT_SECRET) as Secret;
  const options = { expiresIn: '1h' } as SignOptions;
  return jwt.sign({ userId, userEmail, userRole, userName }, secret, options);
};

export const generateRefreshToken = (userId: string) => {
  const secret = (process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET) as Secret;
  const options = { expiresIn: '1d' } as SignOptions;
  return jwt.sign({ userId }, secret, options);
};

export const verifyAccessToken = (token: string) => {
  const secret = (process.env.JWT_SECRET || DEFAULT_SECRET) as Secret;
  return jwt.verify(token, secret) as {
    userId: string;
    userEmail: string;
    userRole: string;
    userName: string;
  };
};

export const verifyRefreshToken = (token: string) => {
  const secret = (process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET) as Secret;
  return jwt.verify(token, secret);
};
