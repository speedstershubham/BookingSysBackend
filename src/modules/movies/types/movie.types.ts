export type MovieRow = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  genre: string;
  rating: string;
  created_at: Date;
  updated_at: Date;
};

export type MovieRecord = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  genre: string;
  rating: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HallSummary = {
  showtimeId: string;
  hallId: string;
  hallName: string;
  capacity: number;
  startTime: Date;
  endTime: Date;
};

export type MovieWithShowtimes = MovieRecord & {
  showtimes: HallSummary[];
};

export type MovieResponse = MovieRecord;
export type MovieDetailResponse = MovieWithShowtimes;

export type ShowtimeRecord = {
  id: string;
  movieId: string;
  hallId: string;
  startTime: Date;
  endTime: Date;
  ticketPrice: number;
};

export type ShowtimeDetailResponse = ShowtimeRecord & {
  movieTitle: string;
  hallName: string;
  capacity: number;
};

export type CreateMovieInput = {
  title: string;
  description: string;
  durationMinutes: number;
  genre: string;
  rating: string;
};

export type UpdateMovieInput = Partial<CreateMovieInput>;

export type CreateShowtimeInput = {
  movieId: string;
  hallId: string;
  startTime: Date;
  endTime?: Date;
  ticketPrice?: number;
};

export type UpdateShowtimeInput = {
  hallId?: string;
  startTime?: Date;
  ticketPrice?: number;
};

export type HallRecord = {
  id: string;
  name: string;
  capacity: number;
};
