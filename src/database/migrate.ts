import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import getDB from '@/database/postgres';
import logger from '@/core/logger/logger';

const migrationsDir = path.join(import.meta.dir, 'migrations');

const runMigrations = async (): Promise<void> => {
  const db = await getDB();

  await db`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const applied = await db<{ name: string }[]>`
    SELECT name FROM _migrations
  `;
  const appliedNames = new Set(applied.map((row) => row.name));

  for (const file of files) {
    if (appliedNames.has(file)) {
      continue;
    }

    const migration = await readFile(path.join(migrationsDir, file), 'utf-8');

    await db.begin(async (tx) => {
      await tx.unsafe(migration).simple();
      await tx`INSERT INTO _migrations (name) VALUES (${file})`;
    });

    logger.info(`Applied migration: ${file}`);
  }

  logger.info('Database migrations complete');
};

export default runMigrations;
