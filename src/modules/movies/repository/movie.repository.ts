import { sql } from '@/database/postgres';
import type { PaginationParams } from '@/core/types/pagination';
import type {
  HallSummary,
  MovieRecord,
  MovieRow,
  MovieWithShowtimes,
  SeatRecord,
  SeatRow,
  ShowtimeSeatsResponse,
} from '@/modules/movies/types/movie.types';

function mapMovieRow(row: MovieRow): MovieRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    genre: row.genre,
    rating: row.rating,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ShowtimeJoinRow = {
  showtime_id: string;
  hall_id: string;
  hall_name: string;
  capacity: number;
  start_time: Date;
  end_time: Date;
};

function mapShowtimeRow(row: ShowtimeJoinRow): HallSummary {
  return {
    showtimeId: row.showtime_id,
    hallId: row.hall_id,
    hallName: row.hall_name,
    capacity: row.capacity,
    startTime: row.start_time,
    endTime: row.end_time,
  };
}

export async function findMovies(
  params: PaginationParams,
): Promise<{ movies: MovieRecord[]; total: number }> {
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM movies
  `;
  const total = Number(countRow?.count ?? 0);

  const movies = await sql<MovieRow[]>`
    SELECT id, title, description, duration_minutes, genre, rating, created_at, updated_at
    FROM movies
    ORDER BY title ASC
    LIMIT ${params.limit}
    OFFSET ${offset}
  `;

  return {
    movies: movies.map(mapMovieRow),
    total,
  };
}

export async function findMovieById(
  id: string,
): Promise<MovieWithShowtimes | null> {
  const [movie] = await sql<MovieRow[]>`
    SELECT id, title, description, duration_minutes, genre, rating, created_at, updated_at
    FROM movies
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!movie) {
    return null;
  }

  const showtimes = await sql<ShowtimeJoinRow[]>`
    SELECT
      s.id AS showtime_id,
      h.id AS hall_id,
      h.name AS hall_name,
      h.capacity,
      s.start_time,
      s.end_time
    FROM showtimes s
    JOIN halls h ON h.id = s.hall_id
    WHERE s.movie_id = ${id}
    ORDER BY s.start_time ASC
  `;

  return {
    ...mapMovieRow(movie),
    showtimes: showtimes.map(mapShowtimeRow),
  };
}

export async function   findShowtimeSeats(
  showtimeId: string,
): Promise<ShowtimeSeatsResponse | null> {
  const [showtime] = await sql<
    {
      showtime_id: string;
      movie_id: string;
      movie_title: string;
      hall_id: string;
      hall_name: string;
      capacity: number;
      start_time: Date;
      end_time: Date;
    }[]
  >`
    SELECT
      s.id AS showtime_id,
      m.id AS movie_id,
      m.title AS movie_title,
      h.id AS hall_id,
      h.name AS hall_name,
      h.capacity,
      s.start_time,
      s.end_time
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    JOIN halls h ON h.id = s.hall_id
    WHERE s.id = ${showtimeId}
    LIMIT 1
  `;

  if (!showtime) {
    return null;
  }

  const seats = await sql<SeatRow[]>`
    SELECT
      se.id,
      se.seat_number,
      NOT EXISTS (
        SELECT 1
        FROM movie_booking_seats mbs
        WHERE mbs.showtime_id = ${showtimeId}
          AND mbs.seat_id = se.id
      ) AS is_available
    FROM seats se
    WHERE se.hall_id = ${showtime.hall_id}
    ORDER BY se.seat_number ASC
  `;

  return {
    showtimeId: showtime.showtime_id,
    movieId: showtime.movie_id,
    movieTitle: showtime.movie_title,
    hallId: showtime.hall_id,
    hallName: showtime.hall_name,
    capacity: showtime.capacity,
    startTime: showtime.start_time,
    endTime: showtime.end_time,
    seats: seats.map(
      (seat): SeatRecord => ({
        id: seat.id,
        seatNumber: seat.seat_number,
        isAvailable: seat.is_available,
      }),
    ),
  };
}

export async function findShowtimeHallId(
  showtimeId: string,
): Promise<string | null> {
  const [row] = await sql<{ hall_id: string }[]>`
    SELECT hall_id FROM showtimes WHERE id = ${showtimeId} LIMIT 1
  `;

  return row?.hall_id ?? null;
}

export async function findSeatsForShowtime(
  showtimeId: string,
  seatIds: string[],
): Promise<{ id: string; seat_number: number; hall_id: string }[]> {
  if (seatIds.length === 0) {
    return [];
  }

  return sql`
    SELECT se.id, se.seat_number, se.hall_id
    FROM seats se
    JOIN showtimes st ON st.hall_id = se.hall_id
    WHERE st.id = ${showtimeId}
      AND se.id IN ${sql(seatIds)}
  `;
}

export async function createMovieBooking(
  userId: string,
  showtimeId: string,
  seatIds: string[],
): Promise<string> {
  return sql.begin(async (tx) => {
    const seats = await tx`
      SELECT se.id
      FROM seats se
      JOIN showtimes st ON st.hall_id = se.hall_id
      WHERE st.id = ${showtimeId}
        AND se.id IN ${sql(seatIds)}
    `;

    if (seats.length !== seatIds.length) {
      throw new Error('INVALID_SEATS');
    }

    const booked = await tx`
      SELECT seat_id
      FROM movie_booking_seats
      WHERE showtime_id = ${showtimeId}
        AND seat_id IN ${sql(seatIds)}
    `;

    if (booked.length > 0) {
      throw new Error('SEATS_UNAVAILABLE');
    }

    const [booking] = await tx<{ id: string }[]>`
      INSERT INTO movie_bookings (user_id, showtime_id)
      VALUES (${userId}, ${showtimeId})
      RETURNING id
    `;

    if (!booking) {
      throw new Error('BOOKING_FAILED');
    }

    for (const seatId of seatIds) {
      await tx`
        INSERT INTO movie_booking_seats (booking_id, showtime_id, seat_id)
        VALUES (${booking.id}, ${showtimeId}, ${seatId})
      `;
    }

    return booking.id;
  });
}

export async function findUserBookings(
  userId: string,
): Promise<
  {
    booking_id: string;
    showtime_id: string;
    movie_title: string;
    hall_name: string;
    start_time: Date;
    created_at: Date;
    seat_id: string;
    seat_number: number;
  }[]
> {
  return sql`
    SELECT
      mb.id AS booking_id,
      st.id AS showtime_id,
      m.title AS movie_title,
      h.name AS hall_name,
      st.start_time,
      mb.created_at,
      se.id AS seat_id,
      se.seat_number
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    JOIN seats se ON se.id = mbs.seat_id
    WHERE mb.user_id = ${userId}
    ORDER BY mb.created_at DESC, se.seat_number ASC
  `;
}

export async function findBookingById(
  bookingId: string,
  userId: string,
): Promise<
  {
    booking_id: string;
    showtime_id: string;
    movie_title: string;
    hall_name: string;
    start_time: Date;
    created_at: Date;
    seat_id: string;
    seat_number: number;
  }[]
> {
  return sql`
    SELECT
      mb.id AS booking_id,
      st.id AS showtime_id,
      m.title AS movie_title,
      h.name AS hall_name,
      st.start_time,
      mb.created_at,
      se.id AS seat_id,
      se.seat_number
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    JOIN seats se ON se.id = mbs.seat_id
    WHERE mb.id = ${bookingId}
      AND mb.user_id = ${userId}
    ORDER BY se.seat_number ASC
  `;
}
