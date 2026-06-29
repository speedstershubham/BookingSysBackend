import { z } from 'zod';

const signupSchema = z.object({
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

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.email('Invalid email address').optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .optional(),
  })
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.newPassword !== undefined,
    { message: 'At least one field must be provided' },
  );

export type SignupSchema = z.infer<typeof signupSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type RefreshSchema = z.infer<typeof refreshSchema>;
export type LogoutSchema = z.infer<typeof logoutSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export default {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  updateProfileSchema,
};
