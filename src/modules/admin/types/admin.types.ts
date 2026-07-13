export type TheatreRecord = {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TheatreWithHalls = TheatreRecord & {
  halls: HallAdminRecord[];
};

export type HallAdminRecord = {
  id: string;
  theatreId: string;
  theatreName: string;
  name: string;
  capacity: number;
  seatCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTheatreInput = {
  name: string;
  location: string;
};

export type UpdateTheatreInput = Partial<CreateTheatreInput>;

export type CreateHallInput = {
  theatreId: string;
  name: string;
  capacity: number;
};

export type UpdateHallInput = {
  name?: string;
  capacity?: number;
};

export type AdminBookingRow = {
  booking_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  showtime_id: string;
  movie_title: string;
  hall_name: string;
  theatre_name: string;
  start_time: Date;
  ticket_price: string;
  status: string;
  refund_status: string;
  paid_amount: string;
  cancelled_at: Date | null;
  created_at: Date;
  seat_id: string | null;
  seat_number: number | null;
};

export type AdminBookingRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  showtimeId: string;
  movieTitle: string;
  hallName: string;
  theatreName: string;
  startTime: Date;
  status: string;
  refundStatus: string;
  paidAmount: number;
  cancelledAt: Date | null;
  seatCount: number;
  ticketPrice: number;
  totalAmount: number;
  seats: { id: string; seatNumber: number }[];
  createdAt: Date;
};

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  bannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateUserRoleInput = {
  role: 'user' | 'admin';
};

export type UpdateUserBanInput = {
  banned: boolean;
};

export type RevenueReport = {
  from: string;
  to: string;
  totalBookings: number;
  totalSeatsSold: number;
  totalRevenue: number;
  byMovie: RevenueByMovie[];
  byDate: RevenueByDate[];
};

export type RevenueByMovie = {
  movieId: string;
  movieTitle: string;
  bookingCount: number;
  seatsSold: number;
  revenue: number;
};

export type RevenueByDate = {
  date: string;
  bookingCount: number;
  seatsSold: number;
  revenue: number;
};

export type ListBookingsFilters = {
  page: number;
  limit: number;
  userId?: string;
  showtimeId?: string;
  from?: Date;
  to?: Date;
};

export type ListHallsFilters = {
  page: number;
  limit: number;
  theatreId?: string;
};

export type RevenueReportFilters = {
  from?: Date;
  to?: Date;
};

export type OccupancyReportFilters = {
  movieId?: string;
  from?: Date;
  to?: Date;
};

export type OccupancyRecord = {
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  hallName: string;
  startTime: Date;
  totalSeats: number;
  bookedSeats: number;
  fillPercentage: number;
};

export type OccupancyReport = {
  from: string | null;
  to: string | null;
  movieId: string | null;
  items: OccupancyRecord[];
};

export type BookingsReportFilters = {
  from?: Date;
  to?: Date;
  userId?: string;
  movieId?: string;
  groupBy: 'day' | 'week' | 'month';
};

export type BookingsReportPeriod = {
  period: string;
  bookingCount: number;
  seatsSold: number;
};

export type BookingsReport = {
  from: string | null;
  to: string | null;
  groupBy: 'day' | 'week' | 'month';
  periods: BookingsReportPeriod[];
};
