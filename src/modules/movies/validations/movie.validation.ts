import { z } from 'zod';

const movieIdSchema = z.object({
  id: z.uuid('Invalid movie id'),
});

const showtimeIdSchema = z.object({
  id: z.uuid('Invalid showtime id'),
});

const listMoviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createMovieSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).default(''),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  genre: z.string().trim().max(100).default(''),
  rating: z.string().trim().max(10).default(''),
});

const updateMovieSchema = createMovieSchema.partial();

const createShowtimeSchema = z.object({
  movieId: z.uuid('Invalid movie id'),
  hallId: z.uuid('Invalid hall id'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  ticketPrice: z.coerce.number().min(0).default(500),
});

const updateShowtimeSchema = z.object({
  hallId: z.uuid('Invalid hall id').optional(),
  startTime: z.coerce.date().optional(),
  ticketPrice: z.coerce.number().min(0).optional(),
});

export default {
  movieIdSchema,
  showtimeIdSchema,
  listMoviesQuerySchema,
  createMovieSchema,
  updateMovieSchema,
  createShowtimeSchema,
  updateShowtimeSchema,
};
