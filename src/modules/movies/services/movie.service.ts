import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import {
  buildPagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/core/types/pagination';
import {
  deleteMovieById,
  deleteShowtimeById,
  findHallById,
  findMovieById,
  findMovieDurationMinutes,
  findMovies,
  findShowtimeById,
  findShowtimeDetailById,
  findShowtimesByMovieId,
  insertMovie,
  insertShowtime,
  countShowtimeBookings,
  updateMovieById,
  updateShowtimeById,
} from '@/modules/movies/repository/movie.repository';
import type {
  HallRecord,
  CreateMovieInput,
  CreateShowtimeInput,
  HallSummary,
  MovieDetailResponse,
  MovieRecord,
  MovieResponse,
  ShowtimeDetailResponse,
  ShowtimeRecord,
  UpdateMovieInput,
  UpdateShowtimeInput,
} from '@/modules/movies/types/movie.types';

export async function getMovies(
  params: PaginationParams,
): Promise<PaginatedResult<MovieResponse>> {
  const { movies, total } = await findMovies(params);

  return {
    items: movies,
    pagination: buildPagination(params, total),
  };
}

export async function getMovieById(
  id: string,
): Promise<MovieDetailResponse> {
  const movie = await findMovieById(id);

  if (!movie) {
    throw new AppError(404, 'Movie not found');
  }

  return movie;
}

export async function getShowtimesByMovieId(
  movieId: string,
): Promise<HallSummary[]> {
  await getMovieById(movieId);
  return findShowtimesByMovieId(movieId);
}

export async function getShowtimeById(
  id: string,
): Promise<ShowtimeRecord> {
  const showtime = await findShowtimeById(id);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
}

export async function getHallById(id: string): Promise<HallRecord> {
  const hall = await findHallById(id);

  if (!hall) {
    throw new AppError(404, 'Hall not found');
  }

  return hall;
}

export async function getShowtimeDetail(
  id: string,
): Promise<ShowtimeDetailResponse> {
  const showtime = await findShowtimeDetailById(id);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
}

export async function createMovie(
  input: CreateMovieInput,
): Promise<MovieRecord> {
  return insertMovie(input);
}

export async function updateMovie(
  id: string,
  input: UpdateMovieInput,
): Promise<MovieRecord> {
  const movie = await updateMovieById(id, input);

  if (!movie) {
    throw new AppError(404, 'Movie not found');
  }

  return movie;
}

export async function deleteMovie(id: string): Promise<void> {
  const deleted = await deleteMovieById(id);

  if (!deleted) {
    throw new AppError(404, 'Movie not found');
  }
}

export async function createShowtime(
  input: CreateShowtimeInput,
): Promise<ShowtimeRecord> {
  const movie = await findMovieById(input.movieId);

  if (!movie) {
    throw new AppError(404, 'Movie not found');
  }

  const hall = await findHallById(input.hallId);

  if (!hall) {
    throw new AppError(404, 'Hall not found');
  }

  const endTime =
    input.endTime ??
    new Date(input.startTime.getTime() + movie.durationMinutes * 60_000);

  if (endTime <= input.startTime) {
    throw new AppError(400, 'End time must be after start time');
  }

  try {
    return await insertShowtime(
      input.movieId,
      input.hallId,
      input.startTime,
      endTime,
      input.ticketPrice ?? 500,
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        409,
        'A showtime already exists for this movie, hall, and start time',
      );
    }

    throw error;
  }
}

export async function updateShowtime(
  id: string,
  input: UpdateShowtimeInput,
): Promise<ShowtimeRecord> {
  if (Object.keys(input).length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  const existing = await findShowtimeById(id);

  if (!existing) {
    throw new AppError(404, 'Showtime not found');
  }

  const bookingCount = await countShowtimeBookings(id);

  if (input.hallId && input.hallId !== existing.hallId) {
    if (bookingCount > 0) {
      throw new AppError(
        409,
        'Cannot change hall for a showtime with existing bookings',
      );
    }

    const hall = await findHallById(input.hallId);

    if (!hall) {
      throw new AppError(404, 'Hall not found');
    }
  }

  const startTime = input.startTime ?? existing.startTime;
  let endTime = existing.endTime;

  if (input.startTime) {
    const durationMinutes = await findMovieDurationMinutes(existing.movieId);

    if (!durationMinutes) {
      throw new AppError(404, 'Movie not found');
    }

    endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
  }

  if (endTime <= startTime) {
    throw new AppError(400, 'End time must be after start time');
  }

  const hallId = input.hallId ?? existing.hallId;
  const ticketPrice = input.ticketPrice ?? existing.ticketPrice;

  try {
    const showtime = await updateShowtimeById(id, {
      hallId,
      startTime,
      endTime,
      ticketPrice,
    });

    if (!showtime) {
      throw new AppError(404, 'Showtime not found');
    }

    return showtime;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        409,
        'A showtime already exists for this movie, hall, and start time',
      );
    }

    throw error;
  }
}

export async function deleteShowtime(id: string): Promise<void> {
  await getShowtimeById(id);

  const bookingCount = await countShowtimeBookings(id);

  if (bookingCount > 0) {
    throw new AppError(
      409,
      'Cannot delete showtime with existing bookings',
    );
  }

  const deleted = await deleteShowtimeById(id);

  if (!deleted) {
    throw new AppError(404, 'Showtime not found');
  }
}
