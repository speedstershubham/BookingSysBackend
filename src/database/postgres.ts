import { SQL } from 'bun';
import env from '@/config/env';

const sql = new SQL({
  url: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeout: env.DB_IDLE_TIMEOUT,
});

const connectDB = async (): Promise<void> => {
  try {
    await sql`SELECT 1`;
    console.log('✅ PostgreSQL Connected');
  } catch (error) {
    console.error('❌ PostgreSQL Connection Failed:', error);
    process.exit(1);
  }
};

const getSql = (): SQL => sql;

export default { sql, connectDB, getSql };
