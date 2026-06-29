import env from '@/config/env';
import AppError from '@/core/errors/app-error';
import postgresError from '@/core/errors/postgres-error';
import bookingRepository from '@/modules/bookings/repository/booking.repository';
import type {
  BookingDetailRow,
  BookingRecord,
  CancelBookingResult,
  CreateBookingInput,
  UpdateBookingInput,
} from '@/modules/bookings/types/booking.types';
import seatRepository from '@/modules/seats/repository/seat.repository';
import seatService from '@/modules/seats/services/seat.service';

const mapBookingRows = (rows: BookingDetailRow[]): BookingRecord => {
  const first = rows[0];

  if (!first) {
    throw new AppError(500, 'Failed to load booking');
  }

  const seats = rows
    .filter((row) => row.seat_id !== null && row.seat_number !== null)
    .map((row) => ({
      id: row.seat_id!,
      seatNumber: row.seat_number!,
    }));

  return {
    id: first.booking_id,
    showtimeId: first.showtime_id,
    movieTitle: first.movie_title,
    hallName: first.hall_name,
    startTime: first.start_time,
    status: first.status,
    refundStatus: first.refund_status,
    paidAmount: Number(first.paid_amount),
    cancelledAt: first.cancelled_at,
    createdAt: first.created_at,
    seats,
  };
};

const groupBookingRows = (rows: BookingDetailRow[]): BookingRecord[] => {
  const bookings = new Map<string, BookingRecord>();

  for (const row of rows) {
    const existing = bookings.get(row.booking_id);

    if (!existing) {
      bookings.set(row.booking_id, mapBookingRows([row]));
      continue;
    }

    if (row.seat_id && row.seat_number) {
      existing.seats.push({
        id: row.seat_id,
        seatNumber: row.seat_number,
      });
    }
  }

  return [...bookings.values()];
};

const assertShowtimeNotStarted = (startTime: Date): void => {
  if (startTime.getTime() <= Date.now()) {
    throw new AppError(400, 'Showtime has already started');
  }
};

const handleBookingMutationError = (error: Error): never => {
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

  if (error.message === 'BOOKING_NOT_FOUND') {
    throw new AppError(404, 'Booking not found');
  }

  if (error.message === 'BOOKING_ALREADY_CANCELLED') {
    throw new AppError(400, 'Booking is already cancelled');
  }

  if (error.message === 'BOOKING_NOT_ACTIVE') {
    throw new AppError(400, 'Booking is not active');
  }

  if (error.message === 'SHOWTIME_STARTED') {
    throw new AppError(400, 'Showtime has already started');
  }

  if (error.message === 'SHOWTIME_NOT_FOUND') {
    throw new AppError(404, 'Showtime not found');
  }

  if (postgresError.isUniqueViolation(error)) {
    throw new AppError(409, 'One or more seats are already booked');
  }

  throw error;
};

const saveBooking = async (
  userId: string,
  showtimeId: string,
  seatIds: string[],
): Promise<BookingRecord> => {
  const uniqueSeatIds = [...new Set(seatIds)];

  if (uniqueSeatIds.length !== seatIds.length) {
    throw new AppError(400, 'Duplicate seats are not allowed');
  }

  const showtime = await seatService.getShowtimeSeats(showtimeId, userId);
  assertShowtimeNotStarted(showtime.startTime);

  const unavailableSeats = showtime.seats.filter(
    (seat) =>
      uniqueSeatIds.includes(seat.id) && !seatService.isSeatSelectable(seat),
  );

  if (unavailableSeats.length > 0) {
    throw new AppError(
      409,
      `Seats unavailable: ${unavailableSeats.map((s) => s.seatNumber).join(', ')}`,
    );
  }

  try {
    const bookingId = await bookingRepository.insertBooking(
      userId,
      showtimeId,
      uniqueSeatIds,
    );
    const booking = await bookingRepository.findBookingById(bookingId, userId);

    if (booking.length === 0) {
      throw new AppError(500, 'Failed to create booking');
    }

    return mapBookingRows(booking);
  } catch (error) {
    if (error instanceof Error) {
      return handleBookingMutationError(error);
    }

    throw error;
  }
};

const createBooking = async (
  userId: string,
  input: CreateBookingInput,
): Promise<BookingRecord> =>
  saveBooking(userId, input.showtimeId, input.seatIds);

const getBookingById = async (
  userId: string,
  bookingId: string,
): Promise<BookingRecord> => {
  const rows = await bookingRepository.findBookingById(bookingId, userId);

  if (rows.length === 0) {
    throw new AppError(404, 'Booking not found');
  }

  return mapBookingRows(rows);
};

const getMyBookings = async (userId: string): Promise<BookingRecord[]> => {
  const rows = await bookingRepository.findUserBookings(userId);
  return groupBookingRows(rows);
};

const cancelBooking = async (
  userId: string,
  bookingId: string,
): Promise<CancelBookingResult> => {
  try {
    return await bookingRepository.cancelBookingById(bookingId, userId);
  } catch (error) {
    if (error instanceof Error) {
      return handleBookingMutationError(error);
    }

    throw error;
  }
};

const updateBooking = async (
  userId: string,
  bookingId: string,
  input: UpdateBookingInput,
): Promise<BookingRecord> => {
  const uniqueSeatIds = [...new Set(input.seatIds)];

  if (uniqueSeatIds.length !== input.seatIds.length) {
    throw new AppError(400, 'Duplicate seats are not allowed');
  }

  const existing = await bookingRepository.findBookingById(bookingId, userId);

  if (existing.length === 0) {
    throw new AppError(404, 'Booking not found');
  }

  const first = existing[0]!;

  if (first.status !== 'confirmed') {
    throw new AppError(400, 'Only confirmed bookings can be updated');
  }

  assertShowtimeNotStarted(first.start_time);

  const showtimeId = first.showtime_id;
  const currentSeatIds = existing
    .map((row) => row.seat_id)
    .filter((id): id is string => id !== null);

  const showtime = await seatService.getShowtimeSeats(showtimeId, userId);

  const unavailableSeats = showtime.seats.filter(
    (seat) =>
      uniqueSeatIds.includes(seat.id) &&
      !seatService.isSeatSelectable(seat, currentSeatIds),
  );

  if (unavailableSeats.length > 0) {
    throw new AppError(
      409,
      `Seats unavailable: ${unavailableSeats.map((s) => s.seatNumber).join(', ')}`,
    );
  }

  try {
    const lockedUntil = new Date(
      Date.now() + env.SEAT_LOCK_TTL_MINUTES * 60_000,
    );
    await seatRepository.lockSeats(
      showtimeId,
      userId,
      uniqueSeatIds,
      lockedUntil,
    );
    await bookingRepository.updateBookingSeats(
      userId,
      bookingId,
      uniqueSeatIds,
    );

    const updated = await bookingRepository.findBookingById(bookingId, userId);

    if (updated.length === 0) {
      throw new AppError(500, 'Failed to update booking');
    }

    return mapBookingRows(updated);
  } catch (error) {
    if (error instanceof Error) {
      return handleBookingMutationError(error);
    }

    throw error;
  }
};

export default {
  createBooking,
  getBookingById,
  getMyBookings,
  cancelBooking,
  updateBooking,
};
