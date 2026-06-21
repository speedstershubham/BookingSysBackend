import { MongoClient, Db } from 'mongodb';
import { env } from '@/config/env';

const client = new MongoClient(env.MONGODB_URI);

let database: Db;

export async function connectDB(): Promise<Db> {
  try {
    if (database) {
      return database;
    }

    await client.connect();

    database = client.db(env.DB_NAME);

    console.log('✅ MongoDB Connected');

    return database;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!database) {
    throw new Error(
      'Database not initialized. Call connectDB() first.',
    );
  }

  return database;
}