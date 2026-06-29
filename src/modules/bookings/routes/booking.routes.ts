import type { Route } from '@/core/router/router.types';
import bookingController from '@/modules/bookings/controllers/booking.controller';

export default [
  {
    method: 'POST',
    path: '/api/bookings',
    handler: bookingController.createBookingHandler,
  },
  {
    method: 'GET',
    path: '/api/bookings/me',
    handler: bookingController.getMyBookingsHandler,
  },
  {
    method: 'GET',
    path: '/api/bookings/:id',
    handler: bookingController.getBookingByIdHandler,
  },
  {
    method: 'PATCH',
    path: '/api/bookings/:id',
    handler: bookingController.updateBookingHandler,
  },
  {
    method: 'DELETE',
    path: '/api/bookings/:id',
    handler: bookingController.cancelBookingHandler,
  },
] satisfies Route[];
