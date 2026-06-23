import { withAuth } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  createBookingSchema,
  listMoviesQuerySchema,
  movieIdSchema,
  showtimeIdSchema,
} from '@/modules/movies/validations/movie.validation';
import {
  createBooking,
  getMovieById,
  getMovies,
  getMyBookings,
  getShowtimeSeats,
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

export const getShowtimeSeatsHandler = withAuth(async (_req, params) => {
  const { id } = showtimeIdSchema.parse(params);
  const seats = await getShowtimeSeats(id);

  return jsonResponse(seats);
});

export const createBookingHandler = withAuth(async (req, _params, auth) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createBookingSchema.parse(body);
  const booking = await createBooking(auth.userId, input);

  return jsonResponse(booking, 201);
});

export const getMyBookingsHandler = withAuth(async (_req, _params, auth) => {
  const bookings = await getMyBookings(auth.userId);

  return jsonResponse(bookings);
});
