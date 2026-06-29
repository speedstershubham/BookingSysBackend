import bcrypt from 'bcrypt';
import AppError from '@/core/errors/app-error';
import postgresError from '@/core/errors/postgres-error';
import pagination from '@/core/types/pagination';
import type {
  PaginatedResult,
  PaginationParams,
} from '@/core/types/pagination.types';
import userRepository from '@/modules/users/repository/user.repository';
import type {
  CreateUserInput,
  UserPublicRecord,
  UserResponse,
} from '@/modules/users/types/user.types';

const toUserResponse = (user: UserPublicRecord): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBanned: user.isBanned,
  bannedAt: user.bannedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createUser = async (input: CreateUserInput): Promise<UserResponse> => {
  const now = new Date();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    const user = await userRepository.insertUser({
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return toUserResponse(user);
  } catch (error) {
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
};

const getUserById = async (id: string): Promise<UserResponse> => {
  const user = await userRepository.findUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toUserResponse(user);
};

const getUsers = async (
  params: PaginationParams,
): Promise<PaginatedResult<UserResponse>> => {
  const { users, total } = await userRepository.findUsers(params);

  return {
    items: users.map(toUserResponse),
    pagination: pagination.buildPagination(params, total),
  };
};

export default {
  createUser,
  getUserById,
  getUsers,
};
