import { z } from 'zod';

const theatreIdSchema = z.object({
  id: z.uuid('Invalid theatre id'),
});

const hallIdSchema = z.object({
  id: z.uuid('Invalid hall id'),
});

const bookingIdSchema = z.object({
  id: z.uuid('Invalid booking id'),
});

const userIdSchema = z.object({
  id: z.uuid('Invalid user id'),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listHallsQuerySchema = paginationQuerySchema.extend({
  theatreId: z.uuid('Invalid theatre id').optional(),
});

const listBookingsQuerySchema = paginationQuerySchema.extend({
  userId: z.uuid('Invalid user id').optional(),
  showtimeId: z.uuid('Invalid showtime id').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const revenueReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const occupancyReportQuerySchema = z.object({
  movieId: z.uuid('Invalid movie id').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const bookingsReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: z.uuid('Invalid user id').optional(),
  movieId: z.uuid('Invalid movie id').optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

const createTheatreSchema = z.object({
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().max(255).default(''),
});

const updateTheatreSchema = createTheatreSchema.partial();

const createHallSchema = z.object({
  theatreId: z.uuid('Invalid theatre id'),
  name: z.string().trim().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(500),
});

const updateHallSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const updateUserBanSchema = z.object({
  banned: z.boolean(),
});

const regenerateSeatsSchema = z.object({
  capacity: z.coerce.number().int().min(1).max(500).optional(),
});

export default {
  theatreIdSchema,
  hallIdSchema,
  bookingIdSchema,
  userIdSchema,
  paginationQuerySchema,
  listHallsQuerySchema,
  listBookingsQuerySchema,
  revenueReportQuerySchema,
  occupancyReportQuerySchema,
  bookingsReportQuerySchema,
  createTheatreSchema,
  updateTheatreSchema,
  createHallSchema,
  updateHallSchema,
  updateUserRoleSchema,
  updateUserBanSchema,
  regenerateSeatsSchema,
};
