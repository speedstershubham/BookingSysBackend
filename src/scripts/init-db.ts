import { initializeDatabase } from '@/database/init';
import { logger } from '@/core/logger/logger';

try {
  await initializeDatabase();
  process.exit(0);
} catch (error) {
  logger.error(error);
  process.exit(1);
}
