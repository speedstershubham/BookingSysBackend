import AppError from '@/core/errors/app-error';
import postgresError from '@/core/errors/postgres-error';
import pagination from '@/core/types/pagination';
import type {
  PaginatedResult,
  PaginationParams,
} from '@/core/types/pagination.types';
import movieRepository from '@/modules/movies/repository/movie.repository';
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

const getMovies = async (
  params: PaginationParams,
): Promise<PaginatedResult<MovieResponse>> => {
  const { movies, total } = await movieRepository.findMovies(params);

  return {
    items: movies,
    pagination: pagination.buildPagination(params, total),
  };
};

const getMovieById = async (id: string): Promise<MovieDetailResponse> => {
  const movie = await movieRepository.findMovieById(id);

  if (!movie) {
    throw new AppError(404, 'Movie not found');
  }

  return movie;
};

const getShowtimesByMovieId = async (
  movieId: string,
): Promise<HallSummary[]> => {
  await getMovieById(movieId);
  return movieRepository.findShowtimesByMovieId(movieId);
};

const getShowtimeById = async (id: string): Promise<ShowtimeRecord> => {
  const showtime = await movieRepository.findShowtimeById(id);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
};

const getHallById = async (id: string): Promise<HallRecord> => {
  const hall = await movieRepository.findHallById(id);

  if (!hall) {
    throw new AppError(404, 'Hall not found');
  }

  return hall;
};

const getShowtimeDetail = async (
  id: string,
): Promise<ShowtimeDetailResponse> => {
  const showtime = await movieRepository.findShowtimeDetailById(id);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
};

const createMovie = async (input: CreateMovieInput): Promise<MovieRecord> =>
  movieRepository.insertMovie(input);

const updateMovie = async (
  id: string,
  input: UpdateMovieInput,
): Promise<MovieRecord> => {
  const movie = await movieRepository.updateMovieById(id, input);

  if (!movie) {
    throw new AppError(404, 'Movie not found');
  }

  return movie;
};

const deleteMovie = async (id: string): Promise<void> => {
  const deleted = await movieRepository.deleteMovieById(id);

  if (!deleted) {
    throw new AppError(404, 'Movie not found');
  }
};

const createShowtime = async (
  input: CreateShowtimeInput,
): Promise<ShowtimeRecord> => {
  const movie = await movieRepository.findMovieById(input.movieId);

  if (!movie) {
    throw new AppError(404, 'Movie not found');
  }

  const hall = await movieRepository.findHallById(input.hallId);

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
    return await movieRepository.insertShowtime(
      input.movieId,
      input.hallId,
      input.startTime,
      endTime,
      input.ticketPrice ?? 500,
    );
  } catch (error) {
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(
        409,
        'A showtime already exists for this movie, hall, and start time',
      );
    }

    throw error;
  }
};

const updateShowtime = async (
  id: string,
  input: UpdateShowtimeInput,
): Promise<ShowtimeRecord> => {
  if (Object.keys(input).length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  const existing = await movieRepository.findShowtimeById(id);

  if (!existing) {
    throw new AppError(404, 'Showtime not found');
  }

  const bookingCount = await movieRepository.countShowtimeBookings(id);

  if (input.hallId && input.hallId !== existing.hallId) {
    if (bookingCount > 0) {
      throw new AppError(
        409,
        'Cannot change hall for a showtime with existing bookings',
      );
    }

    const hall = await movieRepository.findHallById(input.hallId);

    if (!hall) {
      throw new AppError(404, 'Hall not found');
    }
  }

  const startTime = input.startTime ?? existing.startTime;
  let endTime = existing.endTime;

  if (input.startTime) {
    const durationMinutes = await movieRepository.findMovieDurationMinutes(
      existing.movieId,
    );

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
    const showtime = await movieRepository.updateShowtimeById(id, {
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
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(
        409,
        'A showtime already exists for this movie, hall, and start time',
      );
    }

    throw error;
  }
};

const deleteShowtime = async (id: string): Promise<void> => {
  await getShowtimeById(id);

  const bookingCount = await movieRepository.countShowtimeBookings(id);

  if (bookingCount > 0) {
    throw new AppError(409, 'Cannot delete showtime with existing bookings');
  }

  const deleted = await movieRepository.deleteShowtimeById(id);

  if (!deleted) {
    throw new AppError(404, 'Showtime not found');
  }
};

export default {
  getMovies,
  getMovieById,
  getShowtimesByMovieId,
  getShowtimeById,
  getHallById,
  getShowtimeDetail,
  createMovie,
  updateMovie,
  deleteMovie,
  createShowtime,
  updateShowtime,
  deleteShowtime,
};
