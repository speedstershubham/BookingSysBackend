import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const userIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id'),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
