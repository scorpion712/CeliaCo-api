import dotenv from 'dotenv';

dotenv.config();

type DatabaseType = 'mysql' | 'postgresql';

const databaseType = (process.env.DATABASE_TYPE || 'mysql') as DatabaseType;

let pool: any;

if (databaseType === 'postgresql') {
  // PostgreSQL configuration
  const { Pool } = require('pg');

  // Support both individual params and connection string
  const connectionString = process.env.DATABASE_URL;

  const pgPool = new Pool({
    ...(connectionString?.startsWith('postgresql://')
      ? { connectionString }
      : {
          host: process.env.DATABASE_URL,
          port: parseInt(process.env.DATABASE_PORT ?? "5432"),
          user: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
        }),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  // Test connection
  pgPool.on('error', (err: Error) => {
    console.error('Unexpected PostgreSQL error:', err);
  });

  // Wrap PostgreSQL pool to be compatible with MySQL pool API
  pool = {
    ...pgPool,
    databaseType: 'postgresql',
    query: async (text: string, params?: any[]) => {
      const start = Date.now();
      // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
      let pgText = text;
      if (params && params.length > 0) {
        let paramIndex = 0;
        pgText = text.replace(/\?/g, () => `$${++paramIndex}`);
      }
      const res = await pgPool.query(pgText, params);
      return [res.rows, res];
    },
    getConnection: async () => {
      const client = await pgPool.connect();
      // Wrap client to be compatible with MySQL connection API
      return {
        ...client,
        beginTransaction: async () => {
          await client.query('BEGIN');
        },
        commit: async () => {
          await client.query('COMMIT');
        },
        rollback: async () => {
          await client.query('ROLLBACK');
        },
        release: () => {
          client.release();
        },
        query: async (text: string, params?: any[]) => {
          // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
          let pgText = text;
          if (params && params.length > 0) {
            let paramIndex = 0;
            pgText = text.replace(/\?/g, () => `$${++paramIndex}`);
          }
          const res = await client.query(pgText, params);
          // Return in same format as pool.query: [rows, result]
          return [res.rows, res];
        },
      };
    },
  };
} else {
  // MySQL configuration
  const mysql = require('mysql2');
  const mysqlPool = mysql.createPool({
    host: process.env.DATABASE_URL,
    port: parseInt(process.env.DATABASE_PORT ?? "3306"),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  
  // Promisify the pool for async/await
  pool = mysqlPool.promise();
  pool.databaseType = 'mysql';
}

export { pool, databaseType };
export default pool;
