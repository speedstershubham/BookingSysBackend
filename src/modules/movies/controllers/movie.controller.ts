import authMiddleware from '@/core/auth/auth.middleware';
import request from '@/core/http/request';
import response from '@/core/http/response';
import movieService from '@/modules/movies/services/movie.service';
import movieValidation from '@/modules/movies/validations/movie.validation';

const listMoviesHandler = authMiddleware.withAuth(async (req) => {
  const url = new URL(req.url);
  const query = movieValidation.listMoviesQuerySchema.parse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  const result = await movieService.getMovies(query);

  return response.jsonResponse(result);
});

const getMovieHandler = authMiddleware.withAuth(async (_req, params) => {
  const { id } = movieValidation.movieIdSchema.parse(params);
  const movie = await movieService.getMovieById(id);

  return response.jsonResponse(movie);
});

const listShowtimesByMovieHandler = authMiddleware.withAuth(
  async (_req, params) => {
    const { id } = movieValidation.movieIdSchema.parse(params);
    const showtimes = await movieService.getShowtimesByMovieId(id);

    return response.jsonResponse(showtimes);
  },
);

const getShowtimeHandler = authMiddleware.withAuth(async (_req, params) => {
  const { id } = movieValidation.showtimeIdSchema.parse(params);
  const showtime = await movieService.getShowtimeDetail(id);

  return response.jsonResponse(showtime);
});

const createMovieHandler = authMiddleware.withAdmin(async (req) => {
  const body = await request.parseJsonBody(req);
  const input = movieValidation.createMovieSchema.parse(body);
  const movie = await movieService.createMovie(input);

  return response.jsonResponse(movie, 201);
});

const updateMovieHandler = authMiddleware.withAdmin(async (req, params) => {
  const { id } = movieValidation.movieIdSchema.parse(params);
  const body = await request.parseJsonBody(req);
  const input = movieValidation.updateMovieSchema.parse(body);
  const movie = await movieService.updateMovie(id, input);

  return response.jsonResponse(movie);
});

const deleteMovieHandler = authMiddleware.withAdmin(async (_req, params) => {
  const { id } = movieValidation.movieIdSchema.parse(params);
  await movieService.deleteMovie(id);

  return response.jsonResponse({ message: 'Movie deleted' });
});

const createShowtimeHandler = authMiddleware.withAdmin(async (req) => {
  const body = await request.parseJsonBody(req);
  const input = movieValidation.createShowtimeSchema.parse(body);
  const showtime = await movieService.createShowtime(input);

  return response.jsonResponse(showtime, 201);
});

const updateShowtimeHandler = authMiddleware.withAdmin(async (req, params) => {
  const { id } = movieValidation.showtimeIdSchema.parse(params);
  const body = await request.parseJsonBody(req);
  const input = movieValidation.updateShowtimeSchema.parse(body);
  const showtime = await movieService.updateShowtime(id, input);

  return response.jsonResponse(showtime);
});

const deleteShowtimeHandler = authMiddleware.withAdmin(async (_req, params) => {
  const { id } = movieValidation.showtimeIdSchema.parse(params);
  await movieService.deleteShowtime(id);

  return response.jsonResponse({ message: 'Showtime deleted' });
});

export default {
  listMoviesHandler,
  getMovieHandler,
  listShowtimesByMovieHandler,
  getShowtimeHandler,
  createMovieHandler,
  updateMovieHandler,
  deleteMovieHandler,
  createShowtimeHandler,
  updateShowtimeHandler,
  deleteShowtimeHandler,
};
