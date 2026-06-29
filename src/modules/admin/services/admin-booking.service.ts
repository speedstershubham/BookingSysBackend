import pagination from '@/core/types/pagination';
import type { PaginatedResult } from '@/core/types/pagination.types';
import AppError from '@/core/errors/app-error';
import adminBookingRepository from '@/modules/admin/repository/admin-booking.repository';
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

const getAllBookings = async (
  filters: ListBookingsFilters,
): Promise<PaginatedResult<AdminBookingRecord>> => {
  const { bookings, total } =
    await adminBookingRepository.findAllBookings(filters);

  return {
    items: bookings,
    pagination: pagination.buildPagination(filters, total),
  };
};

const getAdminBookingById = async (
  bookingId: string,
): Promise<AdminBookingRecord> => {
  const booking = await adminBookingRepository.findAdminBookingById(bookingId);

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  return booking;
};

const getRevenueReportData = async (
  filters: RevenueReportFilters,
): Promise<RevenueReport> => adminBookingRepository.getRevenueReport(filters);

const getOccupancyReportData = async (
  filters: OccupancyReportFilters,
): Promise<OccupancyReport> =>
  adminBookingRepository.getOccupancyReport(filters);

const getBookingsReportData = async (
  filters: BookingsReportFilters,
): Promise<BookingsReport> => adminBookingRepository.getBookingsReport(filters);

export default {
  getAllBookings,
  getAdminBookingById,
  getRevenueReportData,
  getOccupancyReportData,
  getBookingsReportData,
};
