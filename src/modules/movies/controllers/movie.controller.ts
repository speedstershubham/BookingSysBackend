import { withAdmin, withAuth } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  createMovieSchema,
  createShowtimeSchema,
  listMoviesQuerySchema,
  movieIdSchema,
  showtimeIdSchema,
  updateMovieSchema,
  updateShowtimeSchema,
} from '@/modules/movies/validations/movie.validation';
import {
  createMovie,
  createShowtime,
  deleteMovie,
  deleteShowtime,
  getMovieById,
  getMovies,
  getShowtimeDetail,
  getShowtimesByMovieId,
  updateMovie,
  updateShowtime,
} from '@/modules/movies/services/movie.service';

export const listMoviesHandler = withAuth(async (req) => {
  const url = new URL(req.url);
  const query = listMoviesQuerySchema.parse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  const result = await getMovies(query);

  return jsonResponse(result);
});

export const getMovieHandler = withAuth(async (_req, params) => {
  const { id } = movieIdSchema.parse(params);
  const movie = await getMovieById(id);

  return jsonResponse(movie);
});

export const listShowtimesByMovieHandler = withAuth(async (_req, params) => {
  const { id } = movieIdSchema.parse(params);
  const showtimes = await getShowtimesByMovieId(id);

  return jsonResponse(showtimes);
});

export const getShowtimeHandler = withAuth(async (_req, params) => {
  const { id } = showtimeIdSchema.parse(params);
  const showtime = await getShowtimeDetail(id);

  return jsonResponse(showtime);
});

export const createMovieHandler = withAdmin(async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createMovieSchema.parse(body);
  const movie = await createMovie(input);

  return jsonResponse(movie, 201);
});

export const updateMovieHandler = withAdmin(async (req, params) => {
  const { id } = movieIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateMovieSchema.parse(body);
  const movie = await updateMovie(id, input);

  return jsonResponse(movie);
});

export const deleteMovieHandler = withAdmin(async (_req, params) => {
  const { id } = movieIdSchema.parse(params);
  await deleteMovie(id);

  return jsonResponse({ message: 'Movie deleted' });
});

export const createShowtimeHandler = withAdmin(async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createShowtimeSchema.parse(body);
  const showtime = await createShowtime(input);

  return jsonResponse(showtime, 201);
});

export const updateShowtimeHandler = withAdmin(async (req, params) => {
  const { id } = showtimeIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateShowtimeSchema.parse(body);
  const showtime = await updateShowtime(id, input);

  return jsonResponse(showtime);
});

export const deleteShowtimeHandler = withAdmin(async (_req, params) => {
  const { id } = showtimeIdSchema.parse(params);
  await deleteShowtime(id);

  return jsonResponse({ message: 'Showtime deleted' });
});
