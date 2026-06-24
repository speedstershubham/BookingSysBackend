import type { Route } from '@/core/router/router';
import {
  getHallSeatsHandler,
  getShowtimeSeatsHandler,
  updateSeatStatusHandler,
} from '@/modules/seats/controllers/seat.controller';

export const seatRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/halls/:id/seats',
    handler: getHallSeatsHandler,
  },
  {
    method: 'GET',
    path: '/api/showtimes/:id/seats',
    handler: getShowtimeSeatsHandler,
  },
  {
    method: 'PATCH',
    path: '/api/showtimes/:id/seats/status',
    handler: updateSeatStatusHandler,
  },
];
