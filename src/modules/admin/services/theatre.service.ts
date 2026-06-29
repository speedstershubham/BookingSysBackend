import AppError from '@/core/errors/app-error';
import postgresError from '@/core/errors/postgres-error';
import theatreRepository from '@/modules/admin/repository/theatre.repository';
import type {
  CreateTheatreInput,
  TheatreRecord,
  TheatreWithHalls,
  UpdateTheatreInput,
} from '@/modules/admin/types/admin.types';

const getTheatres = async (): Promise<TheatreRecord[]> =>
  theatreRepository.findTheatres();

const getTheatreById = async (id: string): Promise<TheatreWithHalls> => {
  const theatre = await theatreRepository.findTheatreWithHalls(id);

  if (!theatre) {
    throw new AppError(404, 'Theatre not found');
  }

  return theatre;
};

const createTheatre = async (
  input: CreateTheatreInput,
): Promise<TheatreRecord> => {
  try {
    return await theatreRepository.insertTheatre(input);
  } catch (error) {
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(409, 'A theatre with this name already exists');
    }

    throw error;
  }
};

const updateTheatre = async (
  id: string,
  input: UpdateTheatreInput,
): Promise<TheatreRecord> => {
  try {
    const theatre = await theatreRepository.updateTheatreById(id, input);

    if (!theatre) {
      throw new AppError(404, 'Theatre not found');
    }

    return theatre;
  } catch (error) {
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(409, 'A theatre with this name already exists');
    }

    throw error;
  }
};

const deleteTheatre = async (id: string): Promise<void> => {
  await getTheatreById(id);

  const hallCount = await theatreRepository.countTheatreHalls(id);

  if (hallCount > 0) {
    throw new AppError(
      409,
      'Cannot delete theatre with existing screens. Remove halls first.',
    );
  }

  const deleted = await theatreRepository.deleteTheatreById(id);

  if (!deleted) {
    throw new AppError(404, 'Theatre not found');
  }
};

const assertTheatreExists = async (id: string): Promise<void> => {
  const theatre = await theatreRepository.findTheatreById(id);

  if (!theatre) {
    throw new AppError(404, 'Theatre not found');
  }
};

export default {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  assertTheatreExists,
};
