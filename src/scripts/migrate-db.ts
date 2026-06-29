import runMigrations from '@/database/migrate';
import logger from '@/core/logger/logger';

try {
  await runMigrations();
  process.exit(0);
} catch (error) {
  if (error instanceof Error) {
    logger.error(error);
  } else {
    logger.error(new Error(String(error)));
  }
  process.exit(1);
}
