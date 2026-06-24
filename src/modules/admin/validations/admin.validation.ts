import { z } from 'zod';

export const theatreIdSchema = z.object({
  id: z.uuid('Invalid theatre id'),
});

export const hallIdSchema = z.object({
  id: z.uuid('Invalid hall id'),
});

export const bookingIdSchema = z.object({
  id: z.uuid('Invalid booking id'),
});

export const userIdSchema = z.object({
  id: z.uuid('Invalid user id'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listHallsQuerySchema = paginationQuerySchema.extend({
  theatreId: z.uuid('Invalid theatre id').optional(),
});

export const listBookingsQuerySchema = paginationQuerySchema.extend({
  userId: z.uuid('Invalid user id').optional(),
  showtimeId: z.uuid('Invalid showtime id').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const revenueReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const occupancyReportQuerySchema = z.object({
  movieId: z.uuid('Invalid movie id').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const bookingsReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: z.uuid('Invalid user id').optional(),
  movieId: z.uuid('Invalid movie id').optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const createTheatreSchema = z.object({
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().max(255).default(''),
});

export const updateTheatreSchema = createTheatreSchema.partial();

export const createHallSchema = z.object({
  theatreId: z.uuid('Invalid theatre id'),
  name: z.string().trim().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(500),
});

export const updateHallSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const updateUserBanSchema = z.object({
  banned: z.boolean(),
});

export const regenerateSeatsSchema = z.object({
  capacity: z.coerce.number().int().min(1).max(500).optional(),
});
