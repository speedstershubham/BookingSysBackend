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

export type SeatRow = {
  id: string;
  seat_number: number;
  is_available: boolean;
};

export type SeatRecord = {
  id: string;
  seatNumber: number;
  isAvailable: boolean;
};

export type ShowtimeSeatsResponse = {
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  hallId: string;
  hallName: string;
  capacity: number;
  startTime: Date;
  endTime: Date;
  seats: SeatRecord[];
};

export type CreateBookingInput = {
  showtimeId: string;
  seatIds: string[];
};

export type BookingSeatRecord = {
  id: string;
  seatNumber: number;
};

export type BookingRecord = {
  id: string;
  showtimeId: string;
  movieTitle: string;
  hallName: string;
  startTime: Date;
  seats: BookingSeatRecord[];
  createdAt: Date;
};
