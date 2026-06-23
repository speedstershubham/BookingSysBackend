import type { Route } from '@/core/router/router';
import {
  createBookingHandler,
  getMovieHandler,
  getMyBookingsHandler,
  getShowtimeSeatsHandler,
  listMoviesHandler,
} from '@/modules/movies/controllers/movie.controller';

export const movieRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/movies',
    handler: listMoviesHandler,
  },
  {
    method: 'GET',
    path: '/api/movies/:id',
    handler: getMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/showtimes/:id/seats',
    handler: getShowtimeSeatsHandler,
  },
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
];
