import { z } from 'zod';

export const movieIdSchema = z.object({
  id: z.uuid('Invalid movie id'),
});

export const showtimeIdSchema = z.object({
  id: z.uuid('Invalid showtime id'),
});

export const listMoviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createBookingSchema = z.object({
  showtimeId: z.uuid('Invalid showtime id'),
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can book up to 10 seats at once'),
});
