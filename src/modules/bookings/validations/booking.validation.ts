import { z } from 'zod';

const showtimeIdSchema = z.object({
  id: z.uuid('Invalid showtime id'),
});

const bookingIdSchema = z.object({
  id: z.uuid('Invalid booking id'),
});

const createBookingSchema = z.object({
  showtimeId: z.uuid('Invalid showtime id'),
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can book up to 10 seats at once'),
});

const updateBookingSchema = z.object({
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can book up to 10 seats at once'),
});

export default {
  showtimeIdSchema,
  bookingIdSchema,
  createBookingSchema,
  updateBookingSchema,
};
