import type { SQL } from 'bun';

import { db } from '@/database/postgres';
import type {
  HallSeatsResponse,
  SeatLockRow,
  SeatStatus,
  ShowtimeSeatsResponse,
} from '@/modules/seats/types/seat.types';

type ShowtimeMeta = {
  showtime_id: string;
  movie_id: string;
  movie_title: string;
  hall_id: string;
  hall_name: string;
  capacity: number;
  start_time: Date;
  end_time: Date;
};

type SeatWithStatusRow = {
  id: string;
  seat_number: number;
  is_booked: boolean;
  locked_by_user_id: string | null;
  locked_until: Date | null;
};

const findHallById = async (
  hallId: string,
): Promise<{ id: string; name: string; capacity: number } | null> => {
  const [hall] = await db<{ id: string; name: string; capacity: number }[]>`
    SELECT id, name, capacity
    FROM halls
    WHERE id = ${hallId}
    LIMIT 1
  `;

  return hall ?? null;
};

const findHallSeats = async (
  hallId: string,
): Promise<HallSeatsResponse | null> => {
  const hall = await findHallById(hallId);

  if (!hall) {
    return null;
  }

  const seats = await db<{ id: string; seat_number: number }[]>`
    SELECT id, seat_number
    FROM seats
    WHERE hall_id = ${hallId}
    ORDER BY seat_number ASC
  `;

  return {
    hallId: hall.id,
    hallName: hall.name,
    capacity: hall.capacity,
    seats: seats.map((seat) => ({
      id: seat.id,
      seatNumber: seat.seat_number,
    })),
  };
};

const findShowtimeMeta = async (
  showtimeId: string,
): Promise<ShowtimeMeta | null> => {
  const [showtime] = await db<ShowtimeMeta[]>`
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

  return showtime ?? null;
};

const resolveSeatStatus = (
  row: SeatWithStatusRow,
  userId?: string,
): { status: SeatStatus; lockedByMe: boolean } => {
  if (row.is_booked) {
    return { status: 'booked', lockedByMe: false };
  }

  const isLocked =
    row.locked_by_user_id !== null &&
    row.locked_until !== null &&
    row.locked_until.getTime() > Date.now();

  if (isLocked) {
    return {
      status: 'locked',
      lockedByMe: userId !== undefined && row.locked_by_user_id === userId,
    };
  }

  return { status: 'available', lockedByMe: false };
};

const findShowtimeSeats = async (
  showtimeId: string,
  userId?: string,
): Promise<ShowtimeSeatsResponse | null> => {
  const showtime = await findShowtimeMeta(showtimeId);

  if (!showtime) {
    return null;
  }

  await db`
    DELETE FROM seat_locks
    WHERE showtime_id = ${showtimeId}
      AND locked_until <= NOW()
  `;

  const seats = await db<SeatWithStatusRow[]>`
    SELECT
      se.id,
      se.seat_number,
      EXISTS (
        SELECT 1
        FROM movie_booking_seats mbs
        JOIN movie_bookings mb ON mb.id = mbs.booking_id
        WHERE mbs.showtime_id = ${showtimeId}
          AND mbs.seat_id = se.id
          AND mb.status = 'confirmed'
      ) AS is_booked,
      sl.user_id AS locked_by_user_id,
      sl.locked_until
    FROM seats se
    LEFT JOIN seat_locks sl
      ON sl.seat_id = se.id
      AND sl.showtime_id = ${showtimeId}
      AND sl.locked_until > NOW()
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
    seats: seats.map((seat) => {
      const { status, lockedByMe } = resolveSeatStatus(seat, userId);

      return {
        id: seat.id,
        seatNumber: seat.seat_number,
        status,
        lockedByMe,
      };
    }),
  };
};

const findHallSeatsWithShowtimeStatus = async (
  hallId: string,
  showtimeId: string,
  userId?: string,
): Promise<
  | (HallSeatsResponse & {
      showtimeId: string;
      seats: ShowtimeSeatsResponse['seats'];
    })
  | null
> => {
  const hall = await findHallById(hallId);

  if (!hall) {
    return null;
  }

  const showtime = await findShowtimeMeta(showtimeId);

  if (!showtime || showtime.hall_id !== hallId) {
    return null;
  }

  const showtimeSeats = await findShowtimeSeats(showtimeId, userId);

  if (!showtimeSeats) {
    return null;
  }

  return {
    hallId: hall.id,
    hallName: hall.name,
    capacity: hall.capacity,
    showtimeId,
    seats: showtimeSeats.seats,
  };
};

const lockSeats = async (
  showtimeId: string,
  userId: string,
  seatIds: string[],
  lockedUntil: Date,
): Promise<void> => {
  await db.begin(async (tx) => {
    const [showtime] = await tx<{ hall_id: string }[]>`
      SELECT hall_id
      FROM showtimes
      WHERE id = ${showtimeId}
      LIMIT 1
    `;

    if (!showtime) {
      throw new Error('SHOWTIME_NOT_FOUND');
    }

    const seats = await tx<{ id: string }[]>`
      SELECT id
      FROM seats
      WHERE hall_id = ${showtime.hall_id}
        AND id IN ${tx(seatIds)}
    `;

    if (seats.length !== seatIds.length) {
      throw new Error('INVALID_SEATS');
    }

    const booked = await tx<{ seat_id: string }[]>`
      SELECT mbs.seat_id
      FROM movie_booking_seats mbs
      JOIN movie_bookings mb ON mb.id = mbs.booking_id
      WHERE mbs.showtime_id = ${showtimeId}
        AND mbs.seat_id IN ${tx(seatIds)}
        AND mb.status = 'confirmed'
    `;

    if (booked.length > 0) {
      throw new Error('SEATS_UNAVAILABLE');
    }

    const locks = await tx<SeatLockRow[]>`
      SELECT seat_id, user_id, locked_until
      FROM seat_locks
      WHERE showtime_id = ${showtimeId}
        AND seat_id IN ${tx(seatIds)}
        AND locked_until > NOW()
    `;

    const blocked = locks.filter((lock) => lock.user_id !== userId);

    if (blocked.length > 0) {
      throw new Error('SEATS_LOCKED');
    }

    for (const seatId of seatIds) {
      await tx`
        INSERT INTO seat_locks (showtime_id, seat_id, user_id, locked_until)
        VALUES (${showtimeId}, ${seatId}, ${userId}, ${lockedUntil})
        ON CONFLICT (showtime_id, seat_id)
        DO UPDATE SET
          user_id = EXCLUDED.user_id,
          locked_until = EXCLUDED.locked_until,
          created_at = NOW()
        WHERE seat_locks.user_id = ${userId}
          OR seat_locks.locked_until <= NOW()
      `;
    }
  });
};

const unlockSeats = async (
  showtimeId: string,
  userId: string,
  seatIds: string[],
): Promise<number> => {
  const result = await db`
    DELETE FROM seat_locks
    WHERE showtime_id = ${showtimeId}
      AND user_id = ${userId}
      AND seat_id IN ${db(seatIds)}
  `;

  return result.count;
};

const assertSeatsAvailableForBooking = async (
  tx: SQL,
  showtimeId: string,
  userId: string,
  seatIds: string[],
  excludeBookingId?: string,
): Promise<void> => {
  const booked = excludeBookingId
    ? await tx<{ seat_id: string }[]>`
        SELECT mbs.seat_id
        FROM movie_booking_seats mbs
        JOIN movie_bookings mb ON mb.id = mbs.booking_id
        WHERE mbs.showtime_id = ${showtimeId}
          AND mbs.seat_id IN ${tx(seatIds)}
          AND mb.status = 'confirmed'
          AND mbs.booking_id <> ${excludeBookingId}
      `
    : await tx<{ seat_id: string }[]>`
        SELECT mbs.seat_id
        FROM movie_booking_seats mbs
        JOIN movie_bookings mb ON mb.id = mbs.booking_id
        WHERE mbs.showtime_id = ${showtimeId}
          AND mbs.seat_id IN ${tx(seatIds)}
          AND mb.status = 'confirmed'
      `;

  if (booked.length > 0) {
    throw new Error('SEATS_UNAVAILABLE');
  }

  const locks = await tx<SeatLockRow[]>`
    SELECT seat_id, user_id, locked_until
    FROM seat_locks
    WHERE showtime_id = ${showtimeId}
      AND seat_id IN ${tx(seatIds)}
      AND locked_until > NOW()
  `;

  const blocked = locks.filter((lock) => lock.user_id !== userId);

  if (blocked.length > 0) {
    throw new Error('SEATS_LOCKED');
  }
};

const releaseSeatLocksForBooking = async (
  tx: SQL,
  showtimeId: string,
  userId: string,
  seatIds: string[],
): Promise<void> => {
  await tx`
    DELETE FROM seat_locks
    WHERE showtime_id = ${showtimeId}
      AND user_id = ${userId}
      AND seat_id IN ${tx(seatIds)}
  `;
};

export default {
  findHallById,
  findHallSeats,
  findShowtimeSeats,
  findHallSeatsWithShowtimeStatus,
  lockSeats,
  unlockSeats,
  assertSeatsAvailableForBooking,
  releaseSeatLocksForBooking,
};
