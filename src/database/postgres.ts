import { SQL } from 'bun';
import { env } from '@/config/env';

export const sql = new SQL({
  url: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeout: env.DB_IDLE_TIMEOUT,
});

export async function connectDB(): Promise<void> {
  try {
    await sql`SELECT 1`;
    console.log('✅ PostgreSQL Connected');
  } catch (error) {
    console.error('❌ PostgreSQL Connection Failed:', error);
    process.exit(1);
  }
}

export function getSql(): SQL {
  return sql;
}
