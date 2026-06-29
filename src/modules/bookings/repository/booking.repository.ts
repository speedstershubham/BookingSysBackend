import { db } from '@/database/postgres';
import seatRepository from '@/modules/seats/repository/seat.repository';
import type {
  BookingDetailRow,
  CancelBookingResult,
} from '@/modules/bookings/types/booking.types';

const BOOKING_SELECT =
  'mb.id AS booking_id, st.id AS showtime_id, m.title AS movie_title, h.name AS hall_name, st.start_time, mb.status, mb.refund_status, mb.paid_amount::text AS paid_amount, mb.cancelled_at, mb.created_at, se.id AS seat_id, se.seat_number';

const insertBooking = async (
  userId: string,
  showtimeId: string,
  seatIds: string[],
): Promise<string> =>
  db.begin(async (tx) => {
    const [showtime] = await tx<{ ticket_price: string }[]>`
      SELECT ticket_price::text AS ticket_price
      FROM showtimes
      WHERE id = ${showtimeId}
      LIMIT 1
    `;

    if (!showtime) {
      throw new Error('SHOWTIME_NOT_FOUND');
    }

    const seats = await tx`
      SELECT se.id
      FROM seats se
      JOIN showtimes st ON st.hall_id = se.hall_id
      WHERE st.id = ${showtimeId}
        AND se.id IN ${tx(seatIds)}
    `;

    if (seats.length !== seatIds.length) {
      throw new Error('INVALID_SEATS');
    }

    await seatRepository.assertSeatsAvailableForBooking(
      tx,
      showtimeId,
      userId,
      seatIds,
    );

    const paidAmount = Number(showtime.ticket_price) * seatIds.length;

    const [booking] = await tx<{ id: string }[]>`
      INSERT INTO movie_bookings (user_id, showtime_id, paid_amount, status, refund_status)
      VALUES (${userId}, ${showtimeId}, ${paidAmount}, 'confirmed', 'none')
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

    await seatRepository.releaseSeatLocksForBooking(
      tx,
      showtimeId,
      userId,
      seatIds,
    );

    return booking.id;
  });

const findUserBookings = async (userId: string): Promise<BookingDetailRow[]> =>
  db`
    SELECT ${db.unsafe(BOOKING_SELECT)}
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    LEFT JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    LEFT JOIN seats se ON se.id = mbs.seat_id
    WHERE mb.user_id = ${userId}
    ORDER BY mb.created_at DESC, se.seat_number ASC NULLS LAST
  `;

const findBookingById = async (
  bookingId: string,
  userId: string,
): Promise<BookingDetailRow[]> =>
  db`
    SELECT ${db.unsafe(BOOKING_SELECT)}
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    LEFT JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    LEFT JOIN seats se ON se.id = mbs.seat_id
    WHERE mb.id = ${bookingId}
      AND mb.user_id = ${userId}
    ORDER BY se.seat_number ASC NULLS LAST
  `;

const cancelBookingById = async (
  bookingId: string,
  userId: string,
): Promise<CancelBookingResult> =>
  db.begin(async (tx) => {
    const [booking] = await tx<
      {
        id: string;
        status: string;
        start_time: Date;
        paid_amount: string;
      }[]
    >`
      SELECT mb.id, mb.status, st.start_time, mb.paid_amount::text AS paid_amount
      FROM movie_bookings mb
      JOIN showtimes st ON st.id = mb.showtime_id
      WHERE mb.id = ${bookingId}
        AND mb.user_id = ${userId}
      LIMIT 1
    `;

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    if (booking.status === 'cancelled') {
      throw new Error('BOOKING_ALREADY_CANCELLED');
    }

    if (booking.start_time.getTime() <= Date.now()) {
      throw new Error('SHOWTIME_STARTED');
    }

    const paidAmount = Number(booking.paid_amount);
    const refundStatus = paidAmount > 0 ? 'pending' : 'not_applicable';
    const cancelledAt = new Date();

    await tx`
      DELETE FROM movie_booking_seats
      WHERE booking_id = ${bookingId}
    `;

    await tx`
      UPDATE movie_bookings
      SET
        status = 'cancelled',
        refund_status = ${refundStatus},
        cancelled_at = ${cancelledAt},
        updated_at = ${cancelledAt}
      WHERE id = ${bookingId}
    `;

    return {
      id: bookingId,
      status: 'cancelled',
      refundStatus,
      cancelledAt,
    };
  });

const updateBookingSeats = async (
  userId: string,
  bookingId: string,
  seatIds: string[],
): Promise<string> =>
  db.begin(async (tx) => {
    const [booking] = await tx<
      { id: string; showtime_id: string; status: string; start_time: Date }[]
    >`
      SELECT mb.id, mb.showtime_id, mb.status, st.start_time
      FROM movie_bookings mb
      JOIN showtimes st ON st.id = mb.showtime_id
      WHERE mb.id = ${bookingId}
        AND mb.user_id = ${userId}
      LIMIT 1
    `;

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('BOOKING_NOT_ACTIVE');
    }

    if (booking.start_time.getTime() <= Date.now()) {
      throw new Error('SHOWTIME_STARTED');
    }

    const showtimeId = booking.showtime_id;

    const seats = await tx`
      SELECT se.id
      FROM seats se
      JOIN showtimes st ON st.hall_id = se.hall_id
      WHERE st.id = ${showtimeId}
        AND se.id IN ${tx(seatIds)}
    `;

    if (seats.length !== seatIds.length) {
      throw new Error('INVALID_SEATS');
    }

    await seatRepository.assertSeatsAvailableForBooking(
      tx,
      showtimeId,
      userId,
      seatIds,
      bookingId,
    );

    const [showtime] = await tx<{ ticket_price: string }[]>`
      SELECT ticket_price::text AS ticket_price
      FROM showtimes
      WHERE id = ${showtimeId}
      LIMIT 1
    `;

    const paidAmount = Number(showtime?.ticket_price ?? 0) * seatIds.length;

    await tx`
      DELETE FROM movie_booking_seats
      WHERE booking_id = ${bookingId}
    `;

    for (const seatId of seatIds) {
      await tx`
        INSERT INTO movie_booking_seats (booking_id, showtime_id, seat_id)
        VALUES (${bookingId}, ${showtimeId}, ${seatId})
      `;
    }

    await tx`
      UPDATE movie_bookings
      SET paid_amount = ${paidAmount}, updated_at = ${new Date()}
      WHERE id = ${bookingId}
    `;

    await seatRepository.releaseSeatLocksForBooking(
      tx,
      showtimeId,
      userId,
      seatIds,
    );

    return bookingId;
  });

export default {
  insertBooking,
  findUserBookings,
  findBookingById,
  cancelBookingById,
  updateBookingSeats,
};
