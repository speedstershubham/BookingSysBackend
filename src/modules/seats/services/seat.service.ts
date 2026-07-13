import env from '@/config/env';
import AppError from '@/core/errors/app-error';
import websocketServer from '@/core/websocket/websocket.server';
import movieService from '@/modules/movies/services/movie.service';
import seatRepository from '@/modules/seats/repository/seat.repository';
import type {
  HallSeatsResponse,
  ShowtimeSeatsResponse,
  UpdateSeatStatusInput,
} from '@/modules/seats/types/seat.types';

type HallSeatsWithStatusResponse = HallSeatsResponse & {
  showtimeId?: string;
  seats: HallSeatsResponse['seats'] | ShowtimeSeatsResponse['seats'];
};

const handleSeatStatusError = (error: Error): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (error.message === 'INVALID_SEATS') {
    throw new AppError(400, 'One or more seats are invalid for this showtime');
  }

  if (error.message === 'SEATS_UNAVAILABLE') {
    throw new AppError(409, 'One or more seats are already booked');
  }

  if (error.message === 'SEATS_LOCKED') {
    throw new AppError(409, 'One or more seats are locked by another user');
  }

  throw error;
};

const isSeatSelectable = (
  seat: ShowtimeSeatsResponse['seats'][number],
  currentSeatIds: string[] = [],
): boolean => {
  if (currentSeatIds.includes(seat.id)) {
    return true;
  }

  return (
    seat.status === 'available' || (seat.status === 'locked' && seat.lockedByMe)
  );
};

const getShowtimeSeats = async (
  showtimeId: string,
  userId?: string,
): Promise<ShowtimeSeatsResponse> => {
  await movieService.getShowtimeById(showtimeId);

  const showtime = await seatRepository.findShowtimeSeats(showtimeId, userId);

  if (!showtime) {
    throw new AppError(404, 'Showtime not found');
  }

  return showtime;
};

const getHallSeats = async (
  hallId: string,
  showtimeId?: string,
  userId?: string,
): Promise<HallSeatsWithStatusResponse> => {
  await movieService.getHallById(hallId);

  if (showtimeId) {
    await movieService.getShowtimeById(showtimeId);

    const seats = await seatRepository.findHallSeatsWithShowtimeStatus(
      hallId,
      showtimeId,
      userId,
    );

    if (!seats) {
      throw new AppError(400, 'Showtime does not belong to this hall');
    }

    return seats;
  }

  const hallSeats = await seatRepository.findHallSeats(hallId);

  if (!hallSeats) {
    throw new AppError(404, 'Hall not found');
  }

  return hallSeats;
};

const updateSeatStatus = async (
  userId: string,
  showtimeId: string,
  input: UpdateSeatStatusInput,
): Promise<ShowtimeSeatsResponse> => {
  const uniqueSeatIds = [...new Set(input.seatIds)];

  if (uniqueSeatIds.length !== input.seatIds.length) {
    throw new AppError(400, 'Duplicate seats are not allowed');
  }

  await movieService.getShowtimeById(showtimeId);

  try {
    if (input.status === 'locked') {
      const lockedUntil = new Date(
        Date.now() + env.SEAT_LOCK_TTL_MINUTES * 60_000,
      );
      await seatRepository.lockSeats(
        showtimeId,
        userId,
        uniqueSeatIds,
        lockedUntil,
      );
    } else {
      await seatRepository.unlockSeats(showtimeId, userId, uniqueSeatIds);
    }
  } catch (error) {
    if (error instanceof Error) {
      handleSeatStatusError(error);
    }

    throw error;
  }

  websocketServer.broadcastSeatsUpdated(showtimeId, uniqueSeatIds);

  return getShowtimeSeats(showtimeId, userId);
};

export default {
  getHallSeats,
  getShowtimeSeats,
  updateSeatStatus,
  isSeatSelectable,
};
