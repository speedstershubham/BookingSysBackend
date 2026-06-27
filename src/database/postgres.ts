import { SQL } from 'bun';
import { env } from '@/config/env';

let sql: SQL | undefined;
let connectPromise: Promise<SQL> | undefined;

const getDB = async (): Promise<SQL> => {
  if (sql) {
    return sql;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async (): Promise<SQL> => {
    try {
      const instance = new SQL({
        url: env.DATABASE_URL,
        max: env.DB_POOL_MAX,
        idleTimeout: env.DB_IDLE_TIMEOUT,
      });

      await instance`SELECT 1`;
      console.log('✅ PostgreSQL Connected');
      sql = instance;

      return instance;
    } catch (error) {
      connectPromise = undefined;
      console.error('❌ PostgreSQL Connection Failed:', error);
      process.exit(1);
    }
  })();

  return connectPromise;
};

export default getDB;

export const db = await getDB();
