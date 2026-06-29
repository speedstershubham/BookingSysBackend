import type { Route } from '@/core/router/router.types';
import movieController from '@/modules/movies/controllers/movie.controller';

export default [
  {
    method: 'GET',
    path: '/api/movies',
    handler: movieController.listMoviesHandler,
  },
  {
    method: 'POST',
    path: '/api/movies',
    handler: movieController.createMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/movies/:id/showtimes',
    handler: movieController.listShowtimesByMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/movies/:id',
    handler: movieController.getMovieHandler,
  },
  {
    method: 'PATCH',
    path: '/api/movies/:id',
    handler: movieController.updateMovieHandler,
  },
  {
    method: 'DELETE',
    path: '/api/movies/:id',
    handler: movieController.deleteMovieHandler,
  },
  {
    method: 'GET',
    path: '/api/showtimes/:id',
    handler: movieController.getShowtimeHandler,
  },
  {
    method: 'POST',
    path: '/api/showtimes',
    handler: movieController.createShowtimeHandler,
  },
  {
    method: 'PATCH',
    path: '/api/showtimes/:id',
    handler: movieController.updateShowtimeHandler,
  },
  {
    method: 'DELETE',
    path: '/api/showtimes/:id',
    handler: movieController.deleteShowtimeHandler,
  },
] satisfies Route[];
