import { AppError } from '@/core/errors/app-error';
import {
  buildPagination,
  type PaginatedResult,
} from '@/core/types/pagination';
import {
  findAdminBookingById,
  findAllBookings,
  getBookingsReport,
  getOccupancyReport,
  getRevenueReport,
} from '@/modules/admin/repository/admin-booking.repository';
import type {
  AdminBookingRecord,
  BookingsReport,
  BookingsReportFilters,
  ListBookingsFilters,
  OccupancyReport,
  OccupancyReportFilters,
  RevenueReport,
  RevenueReportFilters,
} from '@/modules/admin/types/admin.types';

export async function getAllBookings(
  filters: ListBookingsFilters,
): Promise<PaginatedResult<AdminBookingRecord>> {
  const { bookings, total } = await findAllBookings(filters);

  return {
    items: bookings,
    pagination: buildPagination(filters, total),
  };
}

export async function getAdminBookingById(
  bookingId: string,
): Promise<AdminBookingRecord> {
  const booking = await findAdminBookingById(bookingId);

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  return booking;
}

export async function getRevenueReportData(
  filters: RevenueReportFilters,
): Promise<RevenueReport> {
  return getRevenueReport(filters);
}

export async function getOccupancyReportData(
  filters: OccupancyReportFilters,
): Promise<OccupancyReport> {
  return getOccupancyReport(filters);
}

export async function getBookingsReportData(
  filters: BookingsReportFilters,
): Promise<BookingsReport> {
  return getBookingsReport(filters);
}
