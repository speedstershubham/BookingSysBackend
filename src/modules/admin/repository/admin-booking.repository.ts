import getDB from '@/database/postgres';
import type {
  AdminBookingRecord,
  AdminBookingRow,
  BookingsReport,
  BookingsReportFilters,
  ListBookingsFilters,
  OccupancyReport,
  OccupancyReportFilters,
  RevenueByDate,
  RevenueByMovie,
  RevenueReport,
  RevenueReportFilters,
} from '@/modules/admin/types/admin.types';

const db = await getDB();

const groupBookingRows = (rows: AdminBookingRow[]): AdminBookingRecord[] => {
  const bookings = new Map<string, AdminBookingRecord>();

  for (const row of rows) {
    const ticketPrice = Number(row.ticket_price);
    const existing = bookings.get(row.booking_id);

    if (!existing) {
      bookings.set(row.booking_id, {
        id: row.booking_id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        showtimeId: row.showtime_id,
        movieTitle: row.movie_title,
        hallName: row.hall_name,
        theatreName: row.theatre_name,
        startTime: row.start_time,
        status: row.status,
        refundStatus: row.refund_status,
        paidAmount: Number(row.paid_amount),
        cancelledAt: row.cancelled_at,
        seatCount: row.seat_id ? 1 : 0,
        ticketPrice,
        totalAmount: row.seat_id ? ticketPrice : Number(row.paid_amount),
        seats:
          row.seat_id && row.seat_number
            ? [{ id: row.seat_id, seatNumber: row.seat_number }]
            : [],
        createdAt: row.created_at,
      });
      continue;
    }

    if (row.seat_id && row.seat_number) {
      existing.seats.push({ id: row.seat_id, seatNumber: row.seat_number });
      existing.seatCount += 1;
      existing.totalAmount += ticketPrice;
    }
  }

  return [...bookings.values()];
};

const findAllBookings = async (
  filters: ListBookingsFilters,
): Promise<{ bookings: AdminBookingRecord[]; total: number }> => {
  const offset = (filters.page - 1) * filters.limit;
  const userId = filters.userId ?? null;
  const showtimeId = filters.showtimeId ?? null;
  const from = filters.from ?? null;
  const to = filters.to ?? null;

  const [countRow] = await db<{ count: number }[]>`
    SELECT COUNT(DISTINCT mb.id)::int AS count
    FROM movie_bookings mb
    WHERE (${userId}::uuid IS NULL OR mb.user_id = ${userId})
      AND (${showtimeId}::uuid IS NULL OR mb.showtime_id = ${showtimeId})
      AND (${from}::timestamptz IS NULL OR mb.created_at >= ${from})
      AND (${to}::timestamptz IS NULL OR mb.created_at <= ${to})
  `;

  const rows = await db<AdminBookingRow[]>`
    SELECT
      mb.id AS booking_id,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      st.id AS showtime_id,
      m.title AS movie_title,
      h.name AS hall_name,
      t.name AS theatre_name,
      st.start_time,
      st.ticket_price::text AS ticket_price,
      mb.status,
      mb.refund_status,
      mb.paid_amount::text AS paid_amount,
      mb.cancelled_at,
      mb.created_at,
      se.id AS seat_id,
      se.seat_number
    FROM movie_bookings mb
    JOIN users u ON u.id = mb.user_id
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    JOIN theatres t ON t.id = h.theatre_id
    LEFT JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    LEFT JOIN seats se ON se.id = mbs.seat_id
    WHERE (${userId}::uuid IS NULL OR mb.user_id = ${userId})
      AND (${showtimeId}::uuid IS NULL OR mb.showtime_id = ${showtimeId})
      AND (${from}::timestamptz IS NULL OR mb.created_at >= ${from})
      AND (${to}::timestamptz IS NULL OR mb.created_at <= ${to})
    ORDER BY mb.created_at DESC, se.seat_number ASC NULLS LAST
    LIMIT ${filters.limit}
    OFFSET ${offset}
  `;

  return {
    bookings: groupBookingRows(rows),
    total: countRow!.count,
  };
};

const findAdminBookingById = async (
  bookingId: string,
): Promise<AdminBookingRecord | null> => {
  const rows = await db<AdminBookingRow[]>`
    SELECT
      mb.id AS booking_id,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      st.id AS showtime_id,
      m.title AS movie_title,
      h.name AS hall_name,
      t.name AS theatre_name,
      st.start_time,
      st.ticket_price::text AS ticket_price,
      mb.status,
      mb.refund_status,
      mb.paid_amount::text AS paid_amount,
      mb.cancelled_at,
      mb.created_at,
      se.id AS seat_id,
      se.seat_number
    FROM movie_bookings mb
    JOIN users u ON u.id = mb.user_id
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    JOIN theatres t ON t.id = h.theatre_id
    LEFT JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    LEFT JOIN seats se ON se.id = mbs.seat_id
    WHERE mb.id = ${bookingId}
    ORDER BY se.seat_number ASC NULLS LAST
  `;

  if (rows.length === 0) {
    return null;
  }

  return groupBookingRows(rows)[0] ?? null;
};

const getRevenueReport = async (
  filters: RevenueReportFilters,
): Promise<RevenueReport> => {
  const from = filters.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = filters.to ?? new Date();

  const [summary] = await db<
    {
      total_bookings: number;
      total_seats: number;
      total_revenue: string;
    }[]
  >`
    SELECT
      COUNT(DISTINCT mb.id)::int AS total_bookings,
      COUNT(mbs.id)::int AS total_seats,
      COALESCE(SUM(st.ticket_price), 0)::text AS total_revenue
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    WHERE mb.status = 'confirmed'
      AND mb.created_at >= ${from}
      AND mb.created_at <= ${to}
  `;

  const byMovie = await db<
    {
      movie_id: string;
      movie_title: string;
      booking_count: number;
      seats_sold: number;
      revenue: string;
    }[]
  >`
    SELECT
      m.id AS movie_id,
      m.title AS movie_title,
      COUNT(DISTINCT mb.id)::int AS booking_count,
      COUNT(mbs.id)::int AS seats_sold,
      COALESCE(SUM(st.ticket_price), 0)::text AS revenue
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    WHERE mb.status = 'confirmed'
      AND mb.created_at >= ${from}
      AND mb.created_at <= ${to}
    GROUP BY m.id, m.title
    ORDER BY revenue DESC
  `;

  const byDate = await db<
    {
      date: string;
      booking_count: number;
      seats_sold: number;
      revenue: string;
    }[]
  >`
    SELECT
      DATE(mb.created_at)::text AS date,
      COUNT(DISTINCT mb.id)::int AS booking_count,
      COUNT(mbs.id)::int AS seats_sold,
      COALESCE(SUM(st.ticket_price), 0)::text AS revenue
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    WHERE mb.status = 'confirmed'
      AND mb.created_at >= ${from}
      AND mb.created_at <= ${to}
    GROUP BY DATE(mb.created_at)
    ORDER BY date ASC
  `;

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totalBookings: summary!.total_bookings,
    totalSeatsSold: summary!.total_seats,
    totalRevenue: Number(summary!.total_revenue),
    byMovie: byMovie.map(
      (row): RevenueByMovie => ({
        movieId: row.movie_id,
        movieTitle: row.movie_title,
        bookingCount: row.booking_count,
        seatsSold: row.seats_sold,
        revenue: Number(row.revenue),
      }),
    ),
    byDate: byDate.map(
      (row): RevenueByDate => ({
        date: row.date,
        bookingCount: row.booking_count,
        seatsSold: row.seats_sold,
        revenue: Number(row.revenue),
      }),
    ),
  };
};

const getOccupancyReport = async (
  filters: OccupancyReportFilters,
): Promise<OccupancyReport> => {
  const movieId = filters.movieId ?? null;
  const from = filters.from ?? null;
  const to = filters.to ?? null;

  const rows = await db<
    {
      showtime_id: string;
      movie_id: string;
      movie_title: string;
      hall_name: string;
      start_time: Date;
      total_seats: number;
      booked_seats: number;
    }[]
  >`
    SELECT
      st.id AS showtime_id,
      m.id AS movie_id,
      m.title AS movie_title,
      h.name AS hall_name,
      st.start_time,
      h.capacity AS total_seats,
      COUNT(mbs.id)::int AS booked_seats
    FROM showtimes st
    JOIN movies m ON m.id = st.movie_id
    JOIN halls h ON h.id = st.hall_id
    LEFT JOIN movie_bookings mb
      ON mb.showtime_id = st.id
      AND mb.status = 'confirmed'
    LEFT JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    WHERE (${movieId}::uuid IS NULL OR m.id = ${movieId})
      AND (${from}::timestamptz IS NULL OR st.start_time >= ${from})
      AND (${to}::timestamptz IS NULL OR st.start_time <= ${to})
    GROUP BY st.id, m.id, m.title, h.name, st.start_time, h.capacity
    ORDER BY st.start_time ASC
  `;

  return {
    from: from?.toISOString() ?? null,
    to: to?.toISOString() ?? null,
    movieId,
    items: rows.map((row) => {
      const bookedSeats = row.booked_seats;
      const totalSeats = row.total_seats;

      return {
        showtimeId: row.showtime_id,
        movieId: row.movie_id,
        movieTitle: row.movie_title,
        hallName: row.hall_name,
        startTime: row.start_time,
        totalSeats,
        bookedSeats,
        fillPercentage:
          totalSeats > 0
            ? Math.round((bookedSeats / totalSeats) * 10000) / 100
            : 0,
      };
    }),
  };
};

const bookingsReportTrunc = (
  groupBy: BookingsReportFilters['groupBy'],
): string => {
  switch (groupBy) {
    case 'week':
      return 'week';
    case 'month':
      return 'month';
    default:
      return 'day';
  }
};

const getBookingsReport = async (
  filters: BookingsReportFilters,
): Promise<BookingsReport> => {
  const from = filters.from ?? null;
  const to = filters.to ?? null;
  const userId = filters.userId ?? null;
  const movieId = filters.movieId ?? null;
  const trunc = bookingsReportTrunc(filters.groupBy);

  type ReportRow = { period: Date; booking_count: number; seats_sold: number };

  const filtersClause = db`
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    JOIN movies m ON m.id = st.movie_id
    LEFT JOIN movie_booking_seats mbs ON mbs.booking_id = mb.id
    WHERE mb.status = 'confirmed'
      AND (${from}::timestamptz IS NULL OR mb.created_at >= ${from})
      AND (${to}::timestamptz IS NULL OR mb.created_at <= ${to})
      AND (${userId}::uuid IS NULL OR mb.user_id = ${userId})
      AND (${movieId}::uuid IS NULL OR m.id = ${movieId})
  `;

  let rows: ReportRow[];

  if (trunc === 'week') {
    rows = await db<ReportRow[]>`
      SELECT
        DATE_TRUNC('week', mb.created_at) AS period,
        COUNT(DISTINCT mb.id)::int AS booking_count,
        COUNT(mbs.id)::int AS seats_sold
      ${filtersClause}
      GROUP BY period
      ORDER BY period ASC
    `;
  } else if (trunc === 'month') {
    rows = await db<ReportRow[]>`
      SELECT
        DATE_TRUNC('month', mb.created_at) AS period,
        COUNT(DISTINCT mb.id)::int AS booking_count,
        COUNT(mbs.id)::int AS seats_sold
      ${filtersClause}
      GROUP BY period
      ORDER BY period ASC
    `;
  } else {
    rows = await db<ReportRow[]>`
      SELECT
        DATE_TRUNC('day', mb.created_at) AS period,
        COUNT(DISTINCT mb.id)::int AS booking_count,
        COUNT(mbs.id)::int AS seats_sold
      ${filtersClause}
      GROUP BY period
      ORDER BY period ASC
    `;
  }

  return {
    from: from?.toISOString() ?? null,
    to: to?.toISOString() ?? null,
    groupBy: filters.groupBy,
    periods: rows.map((row) => ({
      period: row.period.toISOString(),
      bookingCount: row.booking_count,
      seatsSold: row.seats_sold,
    })),
  };
};

export default {
  findAllBookings,
  findAdminBookingById,
  getRevenueReport,
  getOccupancyReport,
  getBookingsReport,
};
