import { z } from 'zod';

const hallIdSchema = z.object({
  id: z.uuid('Invalid hall id'),
});

const showtimeIdSchema = z.object({
  id: z.uuid('Invalid showtime id'),
});

const listHallSeatsQuerySchema = z.object({
  showtimeId: z.uuid('Invalid showtime id').optional(),
});

const updateSeatStatusSchema = z.object({
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can update up to 10 seats at once'),
  status: z.enum(['locked', 'available']),
});

export default {
  hallIdSchema,
  showtimeIdSchema,
  listHallSeatsQuerySchema,
  updateSeatStatusSchema,
};
