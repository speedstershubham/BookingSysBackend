import { sql } from '@/database/postgres';
import type { PaginationParams } from '@/core/types/pagination';
import type {
  CreateMovieInput,
  HallRecord,
  HallSummary,
  MovieRecord,
  MovieRow,
  MovieWithShowtimes,
  ShowtimeDetailResponse,
  ShowtimeRecord,
  UpdateMovieInput,
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

  const showtimes = await findShowtimesByMovieId(id);

  return {
    ...mapMovieRow(movie),
    showtimes,
  };
}

export async function findShowtimesByMovieId(
  movieId: string,
): Promise<HallSummary[]> {
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
    WHERE s.movie_id = ${movieId}
    ORDER BY s.start_time ASC
  `;

  return showtimes.map(mapShowtimeRow);
}

export async function insertMovie(
  input: CreateMovieInput,
): Promise<MovieRecord> {
  const now = new Date();
  const [movie] = await sql<MovieRow[]>`
    INSERT INTO movies (title, description, duration_minutes, genre, rating, created_at, updated_at)
    VALUES (
      ${input.title},
      ${input.description},
      ${input.durationMinutes},
      ${input.genre},
      ${input.rating},
      ${now},
      ${now}
    )
    RETURNING id, title, description, duration_minutes, genre, rating, created_at, updated_at
  `;

  if (!movie) {
    throw new Error('Failed to create movie');
  }

  return mapMovieRow(movie);
}

export async function updateMovieById(
  id: string,
  input: UpdateMovieInput,
): Promise<MovieRecord | null> {
  const [existing] = await sql<MovieRow[]>`
    SELECT id, title, description, duration_minutes, genre, rating, created_at, updated_at
    FROM movies
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!existing) {
    return null;
  }

  const [movie] = await sql<MovieRow[]>`
    UPDATE movies
    SET
      title = ${input.title ?? existing.title},
      description = ${input.description ?? existing.description},
      duration_minutes = ${input.durationMinutes ?? existing.duration_minutes},
      genre = ${input.genre ?? existing.genre},
      rating = ${input.rating ?? existing.rating},
      updated_at = ${new Date()}
    WHERE id = ${id}
    RETURNING id, title, description, duration_minutes, genre, rating, created_at, updated_at
  `;

  return movie ? mapMovieRow(movie) : null;
}

export async function deleteMovieById(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM movies WHERE id = ${id}
  `;

  return result.count > 0;
}

export async function findHallById(id: string): Promise<HallRecord | null> {
  const [hall] = await sql<{ id: string; name: string; capacity: number }[]>`
    SELECT id, name, capacity FROM halls WHERE id = ${id} LIMIT 1
  `;

  return hall ?? null;
}

export async function insertShowtime(
  movieId: string,
  hallId: string,
  startTime: Date,
  endTime: Date,
  ticketPrice = 500,
): Promise<ShowtimeRecord> {
  const [showtime] = await sql<
    {
      id: string;
      movie_id: string;
      hall_id: string;
      start_time: Date;
      end_time: Date;
      ticket_price: string;
    }[]
  >`
    INSERT INTO showtimes (movie_id, hall_id, start_time, end_time, ticket_price)
    VALUES (${movieId}, ${hallId}, ${startTime}, ${endTime}, ${ticketPrice})
    RETURNING id, movie_id, hall_id, start_time, end_time, ticket_price
  `;

  if (!showtime) {
    throw new Error('Failed to create showtime');
  }

  return {
    id: showtime.id,
    movieId: showtime.movie_id,
    hallId: showtime.hall_id,
    startTime: showtime.start_time,
    endTime: showtime.end_time,
    ticketPrice: Number(showtime.ticket_price),
  };
}

export async function findShowtimeById(
  id: string,
): Promise<ShowtimeRecord | null> {
  const [showtime] = await sql<
    {
      id: string;
      movie_id: string;
      hall_id: string;
      start_time: Date;
      end_time: Date;
      ticket_price: string;
    }[]
  >`
    SELECT id, movie_id, hall_id, start_time, end_time, ticket_price
    FROM showtimes
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!showtime) {
    return null;
  }

  return {
    id: showtime.id,
    movieId: showtime.movie_id,
    hallId: showtime.hall_id,
    startTime: showtime.start_time,
    endTime: showtime.end_time,
    ticketPrice: Number(showtime.ticket_price),
  };
}

export async function findShowtimeDetailById(
  id: string,
): Promise<ShowtimeDetailResponse | null> {
  const [showtime] = await sql<
    {
      id: string;
      movie_id: string;
      movie_title: string;
      hall_id: string;
      hall_name: string;
      capacity: number;
      start_time: Date;
      end_time: Date;
      ticket_price: string;
    }[]
  >`
    SELECT
      s.id,
      s.movie_id,
      m.title AS movie_title,
      s.hall_id,
      h.name AS hall_name,
      h.capacity,
      s.start_time,
      s.end_time,
      s.ticket_price
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    JOIN halls h ON h.id = s.hall_id
    WHERE s.id = ${id}
    LIMIT 1
  `;

  if (!showtime) {
    return null;
  }

  return {
    id: showtime.id,
    movieId: showtime.movie_id,
    movieTitle: showtime.movie_title,
    hallId: showtime.hall_id,
    hallName: showtime.hall_name,
    capacity: showtime.capacity,
    startTime: showtime.start_time,
    endTime: showtime.end_time,
    ticketPrice: Number(showtime.ticket_price),
  };
}

export async function countShowtimeBookings(
  showtimeId: string,
): Promise<number> {
  const [row] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM movie_bookings
    WHERE showtime_id = ${showtimeId}
      AND status = 'confirmed'
  `;

  return Number(row?.count ?? 0);
}

export async function updateShowtimeById(
  id: string,
  input: {
    hallId: string;
    startTime: Date;
    endTime: Date;
    ticketPrice: number;
  },
): Promise<ShowtimeRecord | null> {
  const [showtime] = await sql<
    {
      id: string;
      movie_id: string;
      hall_id: string;
      start_time: Date;
      end_time: Date;
      ticket_price: string;
    }[]
  >`
    UPDATE showtimes
    SET
      hall_id = ${input.hallId},
      start_time = ${input.startTime},
      end_time = ${input.endTime},
      ticket_price = ${input.ticketPrice}
    WHERE id = ${id}
    RETURNING id, movie_id, hall_id, start_time, end_time, ticket_price
  `;

  if (!showtime) {
    return null;
  }

  return {
    id: showtime.id,
    movieId: showtime.movie_id,
    hallId: showtime.hall_id,
    startTime: showtime.start_time,
    endTime: showtime.end_time,
    ticketPrice: Number(showtime.ticket_price),
  };
}

export async function deleteShowtimeById(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM showtimes WHERE id = ${id}
  `;

  return result.count > 0;
}

export async function findMovieDurationMinutes(
  id: string,
): Promise<number | null> {
  const [row] = await sql<{ duration_minutes: number }[]>`
    SELECT duration_minutes FROM movies WHERE id = ${id} LIMIT 1
  `;

  return row?.duration_minutes ?? null;
}
