import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import {
  buildPagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/core/types/pagination';
import {
  createMovieBooking,
  findBookingById,
  findMovieById,
  findMovies,
  findShowtimeSeats,
  findUserBookings,
} from '@/modules/movies/repository/movie.repository';
import type {
  BookingRecord,
  CreateBookingInput,
  MovieDetailResponse,
  MovieResponse,
  ShowtimeSeatsResponse,
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

export async function getShowtimeSeats(
  showtimeId: string,
): Promise<ShowtimeSeatsResponse> {
  const showtime = await findShowtimeSeats(showtimeId);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
}

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<BookingRecord> {
  const uniqueSeatIds = [...new Set(input.seatIds)];

  if (uniqueSeatIds.length !== input.seatIds.length) {
    throw new AppError(400, 'Duplicate seats are not allowed');
  }

  const showtime = await findShowtimeSeats(input.showtimeId);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  const unavailableSeats = showtime.seats.filter(
    (seat) =>
      input.seatIds.includes(seat.id) && !seat.isAvailable,
  );

  if (unavailableSeats.length > 0) {
    throw new AppError(
      409,
      `Seats already booked: ${unavailableSeats.map((s) => s.seatNumber).join(', ')}`,
    );
  }

  try {
    const bookingId = await createMovieBooking(
      userId,
      input.showtimeId,
      input.seatIds,
    );

    const booking = await findBookingById(bookingId, userId);

    if (booking.length === 0) {
      throw new AppError(500, 'Failed to create booking');
    }

    return mapBookingRows(booking);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_SEATS') {
        throw new AppError(400, 'One or more seats are invalid for this showtime');
      }

      if (error.message === 'SEATS_UNAVAILABLE') {
        throw new AppError(409, 'One or more seats are already booked');
      }
    }

    if (isUniqueViolation(error)) {
      throw new AppError(409, 'One or more seats are already booked');
    }

    throw error;
  }
}

export async function getMyBookings(userId: string): Promise<BookingRecord[]> {
  const rows = await findUserBookings(userId);
  return groupBookingRows(rows);
}

function mapBookingRows(
  rows: {
    booking_id: string;
    showtime_id: string;
    movie_title: string;
    hall_name: string;
    start_time: Date;
    created_at: Date;
    seat_id: string;
    seat_number: number;
  }[],
): BookingRecord {
  const first = rows[0];

  if (!first) {
    throw new AppError(500, 'Failed to load booking');
  }

  return {
    id: first.booking_id,
    showtimeId: first.showtime_id,
    movieTitle: first.movie_title,
    hallName: first.hall_name,
    startTime: first.start_time,
    createdAt: first.created_at,
    seats: rows.map((row) => ({
      id: row.seat_id,
      seatNumber: row.seat_number,
    })),
  };
}

function groupBookingRows(
  rows: {
    booking_id: string;
    showtime_id: string;
    movie_title: string;
    hall_name: string;
    start_time: Date;
    created_at: Date;
    seat_id: string;
    seat_number: number;
  }[],
): BookingRecord[] {
  const bookings = new Map<string, BookingRecord>();

  for (const row of rows) {
    const existing = bookings.get(row.booking_id);

    if (!existing) {
      bookings.set(row.booking_id, {
        id: row.booking_id,
        showtimeId: row.showtime_id,
        movieTitle: row.movie_title,
        hallName: row.hall_name,
        startTime: row.start_time,
        createdAt: row.created_at,
        seats: [{ id: row.seat_id, seatNumber: row.seat_number }],
      });
      continue;
    }

    existing.seats.push({
      id: row.seat_id,
      seatNumber: row.seat_number,
    });
  }

  return [...bookings.values()];
}
