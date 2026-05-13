import { pool, databaseType } from './db';

const isPostgreSQL = databaseType === 'postgresql';

/**
 * Execute a query and return results
 */
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  if (isPostgreSQL) {
    const result = await pool.query(query, params);
    return result.rows;
  } else {
    const [rows] = await pool.query(query, params);
    return rows;
  }
};

/**
 * Execute a query and return result with affected rows
 */
export const executeQueryWithResult = async (query: string, params: any[] = []): Promise<{ affectedRows: number; insertId?: string }> => {
  if (isPostgreSQL) {
    const result = await pool.query(query, params);
    return {
      affectedRows: result.rowCount || 0,
      insertId: result.rows[0]?.id
    };
  } else {
    const [result]: any = await pool.query(query, params);
    return {
      affectedRows: result.affectedRows,
      insertId: result.insertId
    };
  }
};

/**
 * Get a connection from pool
 */
export const getConnection = async (): Promise<any> => {
  if (isPostgreSQL) {
    return await pool.connect();
  } else {
    return await pool.getConnection();
  }
};

/**
 * Begin transaction
 */
export const beginTransaction = async (connection: any): Promise<void> => {
  if (isPostgreSQL) {
    await connection.query('BEGIN');
  } else {
    await connection.beginTransaction();
  }
};

/**
 * Commit transaction
 */
export const commit = async (connection: any): Promise<void> => {
  if (isPostgreSQL) {
    await connection.query('COMMIT');
  } else {
    await connection.commit();
  }
};

/**
 * Rollback transaction
 */
export const rollback = async (connection: any): Promise<void> => {
  if (isPostgreSQL) {
    await connection.query('ROLLBACK');
  } else {
    await connection.rollback();
  }
};

/**
 * Release connection
 */
export const releaseConnection = async (connection: any): Promise<void> => {
  if (isPostgreSQL) {
    connection.release();
  } else {
    connection.release();
  }
};

/**
 * Check if database is PostgreSQL
 */
export const isPg = (): boolean => isPostgreSQL;
