import authMiddleware from '@/core/auth/auth.middleware';
import request from '@/core/http/request';
import response from '@/core/http/response';
import bookingService from '@/modules/bookings/services/booking.service';
import bookingValidation from '@/modules/bookings/validations/booking.validation';

const createBookingHandler = authMiddleware.withAuth(
  async (req, _params, auth) => {
    const body = await request.parseJsonBody(req);
    const input = bookingValidation.createBookingSchema.parse(body);
    const booking = await bookingService.createBooking(auth.userId, input);

    return response.jsonResponse(booking, 201);
  },
);

const getMyBookingsHandler = authMiddleware.withAuth(
  async (_req, _params, auth) => {
    const bookings = await bookingService.getMyBookings(auth.userId);

    return response.jsonResponse(bookings);
  },
);

const getBookingByIdHandler = authMiddleware.withAuth(
  async (_req, params, auth) => {
    const { id } = bookingValidation.bookingIdSchema.parse(params);
    const booking = await bookingService.getBookingById(auth.userId, id);

    return response.jsonResponse(booking);
  },
);

const updateBookingHandler = authMiddleware.withAuth(
  async (req, params, auth) => {
    const { id } = bookingValidation.bookingIdSchema.parse(params);
    const body = await request.parseJsonBody(req);
    const input = bookingValidation.updateBookingSchema.parse(body);
    const booking = await bookingService.updateBooking(auth.userId, id, input);

    return response.jsonResponse(booking);
  },
);

const cancelBookingHandler = authMiddleware.withAuth(
  async (_req, params, auth) => {
    const { id } = bookingValidation.bookingIdSchema.parse(params);
    const result = await bookingService.cancelBooking(auth.userId, id);

    return response.jsonResponse(result);
  },
);

export default {
  createBookingHandler,
  getMyBookingsHandler,
  getBookingByIdHandler,
  updateBookingHandler,
  cancelBookingHandler,
};
