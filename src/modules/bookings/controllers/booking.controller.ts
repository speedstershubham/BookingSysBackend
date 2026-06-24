import { withAuth } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  bookingIdSchema,
  createBookingSchema,
  updateBookingSchema,
} from '@/modules/bookings/validations/booking.validation';
import {
  cancelBooking,
  createBooking,
  getBookingById,
  getMyBookings,
  updateBooking,
} from '@/modules/bookings/services/booking.service';

export const createBookingHandler = withAuth(async (req, _params, auth) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createBookingSchema.parse(body);
  const booking = await createBooking(auth.userId, input);

  return jsonResponse(booking, 201);
});

export const getMyBookingsHandler = withAuth(async (_req, _params, auth) => {
  const bookings = await getMyBookings(auth.userId);

  return jsonResponse(bookings);
});

export const getBookingByIdHandler = withAuth(async (_req, params, auth) => {
  const { id } = bookingIdSchema.parse(params);
  const booking = await getBookingById(auth.userId, id);

  return jsonResponse(booking);
});

export const updateBookingHandler = withAuth(async (req, params, auth) => {
  const { id } = bookingIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateBookingSchema.parse(body);
  const booking = await updateBooking(auth.userId, id, input);

  return jsonResponse(booking);
});

export const cancelBookingHandler = withAuth(async (_req, params, auth) => {
  const { id } = bookingIdSchema.parse(params);
  const result = await cancelBooking(auth.userId, id);

  return jsonResponse(result);
});
