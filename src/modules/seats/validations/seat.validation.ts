import { z } from 'zod';

export const hallIdSchema = z.object({
  id: z.uuid('Invalid hall id'),
});

export const showtimeIdSchema = z.object({
  id: z.uuid('Invalid showtime id'),
});

export const listHallSeatsQuerySchema = z.object({
  showtimeId: z.uuid('Invalid showtime id').optional(),
});

export const updateSeatStatusSchema = z.object({
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can update up to 10 seats at once'),
  status: z.enum(['locked', 'available']),
});
