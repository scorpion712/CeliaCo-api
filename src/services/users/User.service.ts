import dotenv from 'dotenv';
import { pool } from '../../config/db';
import { errors } from '../../errors';
import bcrypt from 'bcryptjs';

dotenv.config();

export interface User {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  rol: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  nombre: string;
  password: string;
  rol?: string;
}

const SALT_ROUNDS = 12;

export const userService = {
  async getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    const users = rows as any[];
    if (!users[0]) return null;
    // Map snake_case to camelCase
    const u = users[0];
    return {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      passwordHash: u.password_hash,
      rol: u.rol,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT id, email, nombre, rol, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    const users = rows as any[];
    if (!users[0]) return null;
    const u = users[0];
    return {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      passwordHash: '',
      rol: u.rol,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  },

  async createUser(data: CreateUserData): Promise<string> {
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      throw errors.duplicate('User');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const id = crypto.randomUUID();
    
    await pool.query(
      `INSERT INTO users (id, email, nombre, password_hash, rol, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())`,
      [id, data.email, data.nombre, passwordHash, data.rol || 'user']
    );

    return id;
  },

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      throw errors.invalidCredentials();
    }

    if (!user.isActive) {
      throw errors.userInactive();
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw errors.invalidCredentials();
    }

    return user;
  },

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );
  },

  async toggleActive(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
      [userId]
    );
  },

  async listUsers(): Promise<User[]> {
    const [rows] = await pool.query(
      'SELECT id, email, nombre, rol, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    const users = rows as any[];
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      passwordHash: '',
      rol: u.rol,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));
  },
};