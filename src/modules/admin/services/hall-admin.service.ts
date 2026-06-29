import AppError from '@/core/errors/app-error';
import postgresError from '@/core/errors/postgres-error';
import pagination from '@/core/types/pagination';
import type { PaginatedResult } from '@/core/types/pagination.types';
import hallAdminRepository from '@/modules/admin/repository/hall-admin.repository';
import theatreService from '@/modules/admin/services/theatre.service';
import type {
  CreateHallInput,
  HallAdminRecord,
  ListHallsFilters,
  UpdateHallInput,
} from '@/modules/admin/types/admin.types';

const handleHallError = (error: Error): never => {
  if (error.message === 'HALL_NOT_FOUND') {
    throw new AppError(404, 'Hall not found');
  }

  if (error.message === 'SEATS_IN_USE') {
    throw new AppError(
      409,
      'Cannot reduce capacity — some seats have active bookings',
    );
  }

  if (postgresError.isUniqueViolation(error)) {
    throw new AppError(409, 'A screen with this name already exists');
  }

  throw error;
};

const getHalls = async (
  filters: ListHallsFilters,
): Promise<PaginatedResult<HallAdminRecord>> => {
  if (filters.theatreId) {
    await theatreService.assertTheatreExists(filters.theatreId);
  }

  const { halls, total } = await hallAdminRepository.findHalls(filters);

  return {
    items: halls,
    pagination: pagination.buildPagination(filters, total),
  };
};

const getHallById = async (id: string): Promise<HallAdminRecord> => {
  const hall = await hallAdminRepository.findHallAdminById(id);

  if (!hall) {
    throw new AppError(404, 'Hall not found');
  }

  return hall;
};

const createHall = async (input: CreateHallInput): Promise<HallAdminRecord> => {
  await theatreService.assertTheatreExists(input.theatreId);

  try {
    return await hallAdminRepository.insertHall(input);
  } catch (error) {
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(409, 'A screen with this name already exists');
    }

    throw error;
  }
};

const updateHall = async (
  id: string,
  input: UpdateHallInput,
): Promise<HallAdminRecord> => {
  if (Object.keys(input).length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  try {
    return await hallAdminRepository.updateHallById(id, input);
  } catch (error) {
    if (error instanceof Error) {
      return handleHallError(error);
    }

    throw error;
  }
};

const regenerateSeats = async (
  hallId: string,
  capacity?: number,
): Promise<HallAdminRecord> => {
  try {
    return await hallAdminRepository.regenerateHallSeats(hallId, capacity);
  } catch (error) {
    if (error instanceof Error) {
      return handleHallError(error);
    }

    throw error;
  }
};

const deleteHall = async (id: string): Promise<void> => {
  await getHallById(id);

  const bookingCount = await hallAdminRepository.countHallShowtimeBookings(id);

  if (bookingCount > 0) {
    throw new AppError(409, 'Cannot delete screen with existing bookings');
  }

  const showtimeCount = await hallAdminRepository.countHallShowtimes(id);

  if (showtimeCount > 0) {
    throw new AppError(409, 'Cannot delete screen with existing showtimes');
  }

  const deleted = await hallAdminRepository.deleteHallById(id);

  if (!deleted) {
    throw new AppError(404, 'Hall not found');
  }
};

export default {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  regenerateSeats,
  deleteHall,
};
