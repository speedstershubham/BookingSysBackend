import { env } from '@/config/env';
import { AppError } from '@/core/errors/app-error';
import {
  findHallSeats,
  findHallSeatsWithShowtimeStatus,
  findShowtimeSeats,
  lockSeats,
  unlockSeats,
} from '@/modules/seats/repository/seat.repository';
import type {
  HallSeatsResponse,
  ShowtimeSeatsResponse,
  UpdateSeatStatusInput,
} from '@/modules/seats/types/seat.types';
import {
  getHallById,
  getShowtimeById,
} from '@/modules/movies/services/movie.service';

type HallSeatsWithStatusResponse = HallSeatsResponse & {
  showtimeId?: string;
  seats: HallSeatsResponse['seats'] | ShowtimeSeatsResponse['seats'];
};

export async function getHallSeats(
  hallId: string,
  showtimeId?: string,
  userId?: string,
): Promise<HallSeatsWithStatusResponse> {
  await getHallById(hallId);

  if (showtimeId) {
    await getShowtimeById(showtimeId);

    const seats = await findHallSeatsWithShowtimeStatus(
      hallId,
      showtimeId,
      userId,
    );

    if (!seats) {
      throw new AppError(
        400,
        'Showtime does not belong to this hall',
      );
    }

    return seats;
  }

  const hallSeats = await findHallSeats(hallId);

  if (!hallSeats) {
    throw new AppError(404, 'Hall not found');
  }

  return hallSeats;
}

export async function getShowtimeSeats(
  showtimeId: string,
  userId?: string,
): Promise<ShowtimeSeatsResponse> {
  await getShowtimeById(showtimeId);

  const showtime = await findShowtimeSeats(showtimeId, userId);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
}

export async function updateSeatStatus(
  userId: string,
  showtimeId: string,
  input: UpdateSeatStatusInput,
): Promise<ShowtimeSeatsResponse> {
  const uniqueSeatIds = [...new Set(input.seatIds)];

  if (uniqueSeatIds.length !== input.seatIds.length) {
    throw new AppError(400, 'Duplicate seats are not allowed');
  }

  await getShowtimeById(showtimeId);

  try {
    if (input.status === 'locked') {
      const lockedUntil = new Date(
        Date.now() + env.SEAT_LOCK_TTL_MINUTES * 60_000,
      );
      await lockSeats(showtimeId, userId, uniqueSeatIds, lockedUntil);
    } else {
      await unlockSeats(showtimeId, userId, uniqueSeatIds);
    }
  } catch (error) {
    handleSeatStatusError(error);
  }

  return getShowtimeSeats(showtimeId, userId);
}

function handleSeatStatusError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof Error) {
    if (error.message === 'INVALID_SEATS') {
      throw new AppError(400, 'One or more seats are invalid for this showtime');
    }

    if (error.message === 'SEATS_UNAVAILABLE') {
      throw new AppError(409, 'One or more seats are already booked');
    }

    if (error.message === 'SEATS_LOCKED') {
      throw new AppError(409, 'One or more seats are locked by another user');
    }
  }

  throw error;
}

export function isSeatSelectable(
  seat: ShowtimeSeatsResponse['seats'][number],
  currentSeatIds: string[] = [],
): boolean {
  if (currentSeatIds.includes(seat.id)) {
    return true;
  }

  return seat.status === 'available' || (seat.status === 'locked' && seat.lockedByMe);
}
