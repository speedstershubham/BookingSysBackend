import type { Route } from '@/core/router/router';
import {
  cancelBookingHandler,
  createBookingHandler,
  getBookingByIdHandler,
  getMyBookingsHandler,
  updateBookingHandler,
} from '@/modules/bookings/controllers/booking.controller';

export const bookingRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/bookings',
    handler: createBookingHandler,
  },
  {
    method: 'GET',
    path: '/api/bookings/me',
    handler: getMyBookingsHandler,
  },
  {
    method: 'GET',
    path: '/api/bookings/:id',
    handler: getBookingByIdHandler,
  },
  {
    method: 'PATCH',
    path: '/api/bookings/:id',
    handler: updateBookingHandler,
  },
  {
    method: 'DELETE',
    path: '/api/bookings/:id',
    handler: cancelBookingHandler,
  },
];
