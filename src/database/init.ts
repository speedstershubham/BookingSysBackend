import { connectDB, getDB } from '@/database/mongodb';
import { Collections } from '@/database/collections';
import { logger } from '@/core/logger/logger';

export async function initializeDatabase(): Promise<void> {
  await connectDB();
  const db = getDB();

  const existingCollections = new Set(
    (await db.listCollections().toArray()).map((c) => c.name),
  );

  for (const name of Object.values(Collections)) {
    if (!existingCollections.has(name)) {
      await db.createCollection(name);
      logger.info(`Created collection: ${name}`);
    }
  }

  await db.collection(Collections.USERS).createIndex(
    { email: 1 },
    { unique: true },
  );
  await db.collection(Collections.BOOKINGS).createIndex({ userId: 1 });
  await db.collection(Collections.BOOKINGS).createIndex({ serviceId: 1 });
  await db.collection(Collections.BOOKINGS).createIndex({ startTime: 1 });
  await db.collection(Collections.SERVICES).createIndex({ slug: 1 }, { unique: true });

  logger.info(`Database "${db.databaseName}" initialized`);
}
