import bcrypt from 'bcrypt';
import { AppError } from '@/core/errors/app-error';
import {
  findAllUsers,
  findUserByEmail,
  findUserById,
  insertUser,
} from '@/modules/users/repository/user.repository';
import type {
  CreateUserInput,
  UserDocument,
  UserResponse,
} from '@/modules/users/types/user.types';

function toUserResponse(user: UserDocument): UserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(
  input: CreateUserInput,
): Promise<UserResponse> {
  const existingUser = await findUserByEmail(input.email.toLowerCase());

  if (existingUser) {
    throw new AppError(409, 'Email is already registered');
  }

  const now = new Date();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await insertUser({
    name: input.name.trim(),
    email: input.email.toLowerCase(),
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  return toUserResponse(user);
}

export async function getUserById(id: string): Promise<UserResponse> {
  const user = await findUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toUserResponse(user);
}

export async function getUsers(): Promise<UserResponse[]> {
  const users = await findAllUsers();
  return users.map(toUserResponse);
}
