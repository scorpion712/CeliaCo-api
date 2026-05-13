import { pool } from '../config/db';
import { errors } from '../errors';

export interface QueryOperation {
  text: string;
  params?: any[];
}

export interface IUnitOfWork {
  query<T = any>(text: string, params?: any[]): Promise<T>;
  execute<T = any>(operations: QueryOperation[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface IConnection {
  query<T = any>(text: string, params?: any[]): Promise<T>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

class MySQLConnection implements IConnection {
  constructor(private connection: any) {}

  async query<T = any>(text: string, params?: any[]): Promise<T> {
    const [rows] = await this.connection.query(text, params);
    return rows as T;
  }

  async beginTransaction(): Promise<void> {
    await this.connection.beginTransaction();
  }

  async commit(): Promise<void> {
    await this.connection.commit();
  }

  async rollback(): Promise<void> {
    await this.connection.rollback();
  }

  release(): void {
    this.connection.release();
  }
}

export const createUnitOfWork = async (): Promise<IUnitOfWork> => {
  const connection = await pool.getConnection();
  const conn = new MySQLConnection(connection);
  await conn.beginTransaction();

  return {
    async query<T = any>(text: string, params: any[] = []): Promise<T> {
      const result = await conn.query<T>(text, params);
      return result;
    },

    async execute<T = any>(operations: QueryOperation[]): Promise<T[]> {
      const results: T[] = [];
      for (const op of operations) {
        const result = await conn.query<T>(op.text, op.params);
        results.push(result);
      }
      return results;
    },

    async commit(): Promise<void> {
      await conn.commit();
      conn.release();
    },

    async rollback(): Promise<void> {
      await conn.rollback();
      conn.release();
    },
  };
};

export const withUnitOfWork = async <T>(
  work: (uow: IUnitOfWork) => Promise<T>
): Promise<T> => {
  const uow = await createUnitOfWork();
  try {
    const result = await work(uow);
    await uow.commit();
    return result;
  } catch (error) {
    await uow.rollback();
    throw error;
  }
};