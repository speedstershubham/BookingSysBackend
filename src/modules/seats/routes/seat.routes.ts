import type { Route } from '@/core/router/router.types';
import seatController from '@/modules/seats/controllers/seat.controller';

export default [
  {
    method: 'GET',
    path: '/api/halls/:id/seats',
    handler: seatController.getHallSeatsHandler,
  },
  {
    method: 'GET',
    path: '/api/showtimes/:id/seats',
    handler: seatController.getShowtimeSeatsHandler,
  },
  {
    method: 'PATCH',
    path: '/api/showtimes/:id/seats/status',
    handler: seatController.updateSeatStatusHandler,
  },
] satisfies Route[];
