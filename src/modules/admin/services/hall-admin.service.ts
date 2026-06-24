import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import {
  buildPagination,
  type PaginatedResult,
} from '@/core/types/pagination';
import {
  countHallShowtimeBookings,
  countHallShowtimes,
  deleteHallById,
  findHallAdminById,
  findHalls,
  insertHall,
  regenerateHallSeats,
  updateHallById,
} from '@/modules/admin/repository/hall-admin.repository';
import { assertTheatreExists } from '@/modules/admin/services/theatre.service';
import type {
  CreateHallInput,
  HallAdminRecord,
  ListHallsFilters,
  UpdateHallInput,
} from '@/modules/admin/types/admin.types';

export async function getHalls(
  filters: ListHallsFilters,
): Promise<PaginatedResult<HallAdminRecord>> {
  if (filters.theatreId) {
    await assertTheatreExists(filters.theatreId);
  }

  const { halls, total } = await findHalls(filters);

  return {
    items: halls,
    pagination: buildPagination(filters, total),
  };
}

export async function getHallById(id: string): Promise<HallAdminRecord> {
  const hall = await findHallAdminById(id);

  if (!hall) {
    throw new AppError(404, 'Hall not found');
  }

  return hall;
}

export async function createHall(input: CreateHallInput): Promise<HallAdminRecord> {
  await assertTheatreExists(input.theatreId);

  try {
    return await insertHall(input);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'A screen with this name already exists');
    }

    throw error;
  }
}

export async function updateHall(
  id: string,
  input: UpdateHallInput,
): Promise<HallAdminRecord> {
  if (Object.keys(input).length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  try {
    return await updateHallById(id, input);
  } catch (error) {
    return handleHallError(error);
  }
}

export async function regenerateSeats(
  hallId: string,
  capacity?: number,
): Promise<HallAdminRecord> {
  try {
    return await regenerateHallSeats(hallId, capacity);
  } catch (error) {
    return handleHallError(error);
  }
}

export async function deleteHall(id: string): Promise<void> {
  await getHallById(id);

  const bookingCount = await countHallShowtimeBookings(id);

  if (bookingCount > 0) {
    throw new AppError(
      409,
      'Cannot delete screen with existing bookings',
    );
  }

  const showtimeCount = await countHallShowtimes(id);

  if (showtimeCount > 0) {
    throw new AppError(
      409,
      'Cannot delete screen with existing showtimes',
    );
  }

  const deleted = await deleteHallById(id);

  if (!deleted) {
    throw new AppError(404, 'Hall not found');
  }
}

function handleHallError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'HALL_NOT_FOUND') {
      throw new AppError(404, 'Hall not found');
    }

    if (error.message === 'SEATS_IN_USE') {
      throw new AppError(
        409,
        'Cannot reduce capacity — some seats have active bookings',
      );
    }
  }

  if (isUniqueViolation(error)) {
    throw new AppError(409, 'A screen with this name already exists');
  }

  throw error;
}
