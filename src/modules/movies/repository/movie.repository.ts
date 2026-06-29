import { db } from '@/database/postgres';
import type { PaginationParams } from '@/core/types/pagination.types';
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

const mapMovieRow = (row: MovieRow): MovieRecord => ({
  id: row.id,
  title: row.title,
  description: row.description,
  durationMinutes: row.duration_minutes,
  genre: row.genre,
  rating: row.rating,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type ShowtimeJoinRow = {
  showtime_id: string;
  hall_id: string;
  hall_name: string;
  capacity: number;
  start_time: Date;
  end_time: Date;
};

const mapShowtimeRow = (row: ShowtimeJoinRow): HallSummary => ({
  showtimeId: row.showtime_id,
  hallId: row.hall_id,
  hallName: row.hall_name,
  capacity: row.capacity,
  startTime: row.start_time,
  endTime: row.end_time,
});

const findMovies = async (
  params: PaginationParams,
): Promise<{ movies: MovieRecord[]; total: number }> => {
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM movies
  `;
  const total = countRow!.count;

  const movies = await db<MovieRow[]>`
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
};

const findMovieById = async (
  id: string,
): Promise<MovieWithShowtimes | null> => {
  const [movie] = await db<MovieRow[]>`
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
};

const findShowtimesByMovieId = async (
  movieId: string,
): Promise<HallSummary[]> => {
  const showtimes = await db<ShowtimeJoinRow[]>`
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
};

const insertMovie = async (input: CreateMovieInput): Promise<MovieRecord> => {
  const now = new Date();
  const [movie] = await db<MovieRow[]>`
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
};

const updateMovieById = async (
  id: string,
  input: UpdateMovieInput,
): Promise<MovieRecord | null> => {
  const [existing] = await db<MovieRow[]>`
    SELECT id, title, description, duration_minutes, genre, rating, created_at, updated_at
    FROM movies
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!existing) {
    return null;
  }

  const [movie] = await db<MovieRow[]>`
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
};

const deleteMovieById = async (id: string): Promise<boolean> => {
  const result = await db`
    DELETE FROM movies WHERE id = ${id}
  `;

  return result.count > 0;
};

const findHallById = async (id: string): Promise<HallRecord | null> => {
  const [hall] = await db<{ id: string; name: string; capacity: number }[]>`
    SELECT id, name, capacity FROM halls WHERE id = ${id} LIMIT 1
  `;

  return hall ?? null;
};

const insertShowtime = async (
  movieId: string,
  hallId: string,
  startTime: Date,
  endTime: Date,
  ticketPrice = 500,
): Promise<ShowtimeRecord> => {
  const [showtime] = await db<
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
};

const findShowtimeById = async (id: string): Promise<ShowtimeRecord | null> => {
  const [showtime] = await db<
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
};

const findShowtimeDetailById = async (
  id: string,
): Promise<ShowtimeDetailResponse | null> => {
  const [showtime] = await db<
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
};

const countShowtimeBookings = async (showtimeId: string): Promise<number> => {
  const [row] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM movie_bookings
    WHERE showtime_id = ${showtimeId}
      AND status = 'confirmed'
  `;

  return row!.count;
};

const updateShowtimeById = async (
  id: string,
  input: {
    hallId: string;
    startTime: Date;
    endTime: Date;
    ticketPrice: number;
  },
): Promise<ShowtimeRecord | null> => {
  const [showtime] = await db<
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
};

const deleteShowtimeById = async (id: string): Promise<boolean> => {
  const result = await db`
    DELETE FROM showtimes WHERE id = ${id}
  `;

  return result.count > 0;
};

const findMovieDurationMinutes = async (id: string): Promise<number | null> => {
  const [row] = await db<{ duration_minutes: number }[]>`
    SELECT duration_minutes FROM movies WHERE id = ${id} LIMIT 1
  `;

  return row?.duration_minutes ?? null;
};

export default {
  findMovies,
  findMovieById,
  findShowtimesByMovieId,
  insertMovie,
  updateMovieById,
  deleteMovieById,
  findHallById,
  insertShowtime,
  findShowtimeById,
  findShowtimeDetailById,
  countShowtimeBookings,
  updateShowtimeById,
  deleteShowtimeById,
  findMovieDurationMinutes,
};
