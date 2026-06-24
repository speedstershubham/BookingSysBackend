import bcrypt from 'bcrypt';
import { signToken } from '@/core/auth/jwt';
import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import {
  createUserRecord,
  findUserRecordByEmail,
} from '@/modules/auth/repository/auth.repository';
import type {
  AuthResponse,
  LoginInput,
  SignupInput,
} from '@/modules/auth/types/auth.types';
import { getUserById } from '@/modules/users/services/user.service';
import type { UserResponse } from '@/modules/users/types/user.types';

function toAuthResponse(user: UserResponse, token: string): AuthResponse {
  return { user, token };
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const now = new Date();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    const user = await createUserRecord({
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken({ userId: user.id, email: user.email });

    return toAuthResponse(user, token);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await findUserRecordByEmail(input.email.toLowerCase());

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(
    input.password,
    user.password,
  );

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({ userId: user.id, email: user.email });

  return toAuthResponse(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  );
}

export async function getAuthenticatedUser(
  userId: string,
): Promise<UserResponse> {
  return getUserById(userId);
}
