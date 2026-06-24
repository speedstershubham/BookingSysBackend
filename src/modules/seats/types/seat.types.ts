export type SeatStatus = 'available' | 'locked' | 'booked';

export type HallSeatRecord = {
  id: string;
  seatNumber: number;
};

export type HallSeatsResponse = {
  hallId: string;
  hallName: string;
  capacity: number;
  seats: HallSeatRecord[];
};

export type ShowtimeSeatRecord = {
  id: string;
  seatNumber: number;
  status: SeatStatus;
  lockedByMe: boolean;
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
  seats: ShowtimeSeatRecord[];
};

export type UpdateSeatStatusInput = {
  seatIds: string[];
  status: 'locked' | 'available';
};

export type SeatLockRow = {
  seat_id: string;
  user_id: string;
  locked_until: Date;
};
