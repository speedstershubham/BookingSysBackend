import type { Route } from '@/core/router/router';
import {
  createMovieHandler,
  createShowtimeHandler,
  deleteMovieHandler,
  deleteShowtimeHandler,
  getMovieHandler,
  getShowtimeHandler,
  listMoviesHandler,
  listShowtimesByMovieHandler,
  updateMovieHandler,
  updateShowtimeHandler,
} from '@/modules/movies/controllers/movie.controller';

export const movieRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/movies',
    handler: listMoviesHandler,
  },
  {
    method: 'POST',
    path: '/api/movies',
    handler: createMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/movies/:id/showtimes',
    handler: listShowtimesByMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/movies/:id',
    handler: getMovieHandler,
  },
  {
    method: 'PATCH',
    path: '/api/movies/:id',
    handler: updateMovieHandler,
  },
  {
    method: 'DELETE',
    path: '/api/movies/:id',
    handler: deleteMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/showtimes/:id',
    handler: getShowtimeHandler,
  },
  {
    method: 'POST',
    path: '/api/showtimes',
    handler: createShowtimeHandler,
  },
  {
    method: 'PATCH',
    path: '/api/showtimes/:id',
    handler: updateShowtimeHandler,
  },
  {
    method: 'DELETE',
    path: '/api/showtimes/:id',
    handler: deleteShowtimeHandler,
  },
];
