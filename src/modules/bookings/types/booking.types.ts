export type BookingStatus = 'confirmed' | 'cancelled';

export type RefundStatus = 'none' | 'pending' | 'completed' | 'not_applicable';

export type CreateBookingInput = {
  showtimeId: string;
  seatIds: string[];
};

export type UpdateBookingInput = {
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
  status: BookingStatus;
  refundStatus: RefundStatus;
  paidAmount: number;
  cancelledAt: Date | null;
  seats: BookingSeatRecord[];
  createdAt: Date;
};

export type BookingDetailRow = {
  booking_id: string;
  showtime_id: string;
  movie_title: string;
  hall_name: string;
  start_time: Date;
  status: BookingStatus;
  refund_status: RefundStatus;
  paid_amount: string;
  cancelled_at: Date | null;
  created_at: Date;
  seat_id: string | null;
  seat_number: number | null;
};

export type CancelBookingResult = {
  id: string;
  status: BookingStatus;
  refundStatus: RefundStatus;
  cancelledAt: Date;
};
