import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import {
  countTheatreHalls,
  deleteTheatreById,
  findTheatreById,
  findTheatreWithHalls,
  findTheatres,
  insertTheatre,
  updateTheatreById,
} from '@/modules/admin/repository/theatre.repository';
import type {
  CreateTheatreInput,
  TheatreRecord,
  TheatreWithHalls,
  UpdateTheatreInput,
} from '@/modules/admin/types/admin.types';

export async function getTheatres(): Promise<TheatreRecord[]> {
  return findTheatres();
}

export async function getTheatreById(id: string): Promise<TheatreWithHalls> {
  const theatre = await findTheatreWithHalls(id);

  if (!theatre) {
    throw new AppError(404, 'Theatre not found');
  }

  return theatre;
}

export async function createTheatre(
  input: CreateTheatreInput,
): Promise<TheatreRecord> {
  try {
    return await insertTheatre(input);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'A theatre with this name already exists');
    }

    throw error;
  }
}

export async function updateTheatre(
  id: string,
  input: UpdateTheatreInput,
): Promise<TheatreRecord> {
  try {
    const theatre = await updateTheatreById(id, input);

    if (!theatre) {
      throw new AppError(404, 'Theatre not found');
    }

    return theatre;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'A theatre with this name already exists');
    }

    throw error;
  }
}

export async function deleteTheatre(id: string): Promise<void> {
  await getTheatreById(id);

  const hallCount = await countTheatreHalls(id);

  if (hallCount > 0) {
    throw new AppError(
      409,
      'Cannot delete theatre with existing screens. Remove halls first.',
    );
  }

  const deleted = await deleteTheatreById(id);

  if (!deleted) {
    throw new AppError(404, 'Theatre not found');
  }
}

export async function assertTheatreExists(id: string): Promise<void> {
  const theatre = await findTheatreById(id);

  if (!theatre) {
    throw new AppError(404, 'Theatre not found');
  }
}
