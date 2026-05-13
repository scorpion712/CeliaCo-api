import { userService, User } from '../users/User.service';
import { generateAccessToken, generateRefreshToken } from '../../helpers/auth/jwtHelper';
import { errors } from '../../errors';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userService.validateCredentials(email, password);
    
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.rol,
      user.nombre
    );
    
    const refreshToken = generateRefreshToken(user.id);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  },

  async refreshToken(refreshToken: string, userId: string): Promise<LoginResult> {
    const user = await userService.getUserById(userId);
    
    if (!user || !user.isActive) {
      throw errors.unauthorized('Invalid refresh token');
    }
    
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.rol,
      user.nombre
    );
    
    const newRefreshToken = generateRefreshToken(user.id);
    
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  },

  async register(email: string, password: string, nombre: string, rol: string = 'user'): Promise<LoginResult> {
    const userId = await userService.createUser({ email, nombre, password, rol });
    
    const user = await userService.getUserById(userId);
    if (!user) {
      throw errors.internalError('Failed to create user');
    }
    
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.rol,
      user.nombre
    );
    
    const refreshToken = generateRefreshToken(user.id);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  },
};