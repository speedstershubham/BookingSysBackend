import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string(),
  DB_NAME: z.string(),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);