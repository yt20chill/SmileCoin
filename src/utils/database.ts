import { Pool, PoolClient } from 'pg';

let pool: Pool;

/**
 * Initialize database connection pool
 */
export function initializeDatabase(): void {
  if (pool) {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    initializeDatabase();
  }
  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction(queries: Array<{ text: string; params?: any[] }>): Promise<any[]> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const results = [];
    
    for (const queryObj of queries) {
      const result = await client.query(queryObj.text, queryObj.params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}