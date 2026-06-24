import { z } from 'zod';

export const showtimeIdSchema = z.object({
  id: z.uuid('Invalid showtime id'),
});

export const bookingIdSchema = z.object({
  id: z.uuid('Invalid booking id'),
});

export const createBookingSchema = z.object({
  showtimeId: z.uuid('Invalid showtime id'),
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can book up to 10 seats at once'),
});

export const updateBookingSchema = z.object({
  seatIds: z
    .array(z.uuid('Invalid seat id'))
    .min(1, 'Select at least one seat')
    .max(10, 'You can book up to 10 seats at once'),
});
