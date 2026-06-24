import bcrypt from 'bcrypt';
import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import {
  buildPagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/core/types/pagination';
import {
  findUserById,
  findUsers,
  insertUser,
} from '@/modules/users/repository/user.repository';
import type {
  CreateUserInput,
  UserPublicRecord,
  UserResponse,
} from '@/modules/users/types/user.types';

function toUserResponse(user: UserPublicRecord): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(
  input: CreateUserInput,
): Promise<UserResponse> {
  const now = new Date();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    const user = await insertUser({
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return toUserResponse(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
}

export async function getUserById(id: string): Promise<UserResponse> {
  const user = await findUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toUserResponse(user);
}

export async function getUsers(
  params: PaginationParams,
): Promise<PaginatedResult<UserResponse>> {
  const { users, total } = await findUsers(params);

  return {
    items: users.map(toUserResponse),
    pagination: buildPagination(params, total),
  };
}
