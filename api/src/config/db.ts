import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from './drizzle/schema/index.js';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors — never let them crash the process silently
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

// Test connection on startup
export async function connectDB(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();
    console.log(`✅ PostgreSQL connected — DB: ${result.rows[0].db} | Time: ${result.rows[0].now}`);
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', (error as Error).message);
    process.exit(1);
  }
}

// Drizzle instance — schema will be added in next step
export const db = drizzle(pool, { schema });
export { pool };
export type DB = typeof db;