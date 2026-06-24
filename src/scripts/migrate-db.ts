import { runMigrations } from '@/database/migrate';
import { logger } from '@/core/logger/logger';

try {
  await runMigrations();
  process.exit(0);
} catch (error) {
  logger.error(error);
  process.exit(1);
}
