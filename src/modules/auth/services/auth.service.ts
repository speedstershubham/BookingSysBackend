import bcrypt from 'bcrypt';
import { env } from '@/config/env';
import { signAccessToken } from '@/core/auth/jwt';
import {
  generateRefreshToken,
  hashToken,
} from '@/core/auth/token.utils';
import { AppError } from '@/core/errors/app-error';
import { isUniqueViolation } from '@/core/errors/postgres-error';
import authRepository from '@/modules/auth/repository/auth.repository';
import {
  blacklistAccessToken,
  insertRefreshToken,
  findValidRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshTokenByHash,
} from '@/modules/auth/repository/token.repository';
import type {
  AuthResponse,
  LoginInput,
  LogoutInput,
  RefreshInput,
  SignupInput,
  UpdateProfileInput,
} from '@/modules/auth/types/auth.types';
import userRepository from '@/modules/users/repository/user.repository';
import { getUserById } from '@/modules/users/services/user.service';
import type { UserResponse } from '@/modules/users/types/user.types';

function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
}

async function issueAuthTokens(user: UserResponse): Promise<AuthResponse> {
  const access = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'user' | 'admin',
  });

  const refreshToken = generateRefreshToken();
  await insertRefreshToken(
    user.id,
    hashToken(refreshToken),
    refreshTokenExpiresAt(),
  );

  return {
    user,
    accessToken: access.token,
    refreshToken,
    token: access.token,
  };
}

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  bannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
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

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const now = new Date();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    const user = await authRepository.createUserRecord({
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return issueAuthTokens(toUserResponse(user));
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await authRepository.findUserRecordByEmail(input.email.toLowerCase());

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

  if (user.isBanned) {
    throw new AppError(403, 'Account has been banned');
  }

  return issueAuthTokens(toUserResponse(user));
}

export async function refreshAccessToken(
  input: RefreshInput,
): Promise<{ accessToken: string; token: string }> {
  const tokenHash = hashToken(input.refreshToken);
  const stored = await findValidRefreshToken(tokenHash);

  if (!stored) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const user = await getUserById(stored.userId);

  if (user.isBanned) {
    throw new AppError(403, 'Account has been banned');
  }

  const access = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'user' | 'admin',
  });

  return {
    accessToken: access.token,
    token: access.token,
  };
}

export async function logout(
  auth: { userId: string; jti: string; expiresAt: Date },
  input: LogoutInput,
): Promise<void> {
  await blacklistAccessToken(auth.jti, auth.userId, auth.expiresAt);

  if (input.refreshToken) {
    await revokeRefreshTokenByHash(hashToken(input.refreshToken));
  } else {
    await revokeAllUserRefreshTokens(auth.userId);
  }
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserResponse> {
  const user = await userRepository.findUserAuthById(userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new AppError(400, 'Current password is required');
    }

    const valid = await bcrypt.compare(
      input.currentPassword,
      user.password,
    );

    if (!valid) {
      throw new AppError(401, 'Current password is incorrect');
    }
  }

  if (input.email && input.email.toLowerCase() !== user.email) {
    const existing = await authRepository.findUserRecordByEmail(input.email.toLowerCase());

    if (existing && existing.id !== userId) {
      throw new AppError(409, 'Email is already registered');
    }
  }

  try {
    const hashedPassword = input.newPassword
      ? await bcrypt.hash(input.newPassword, 10)
      : undefined;

    const updated = await userRepository.updateUserProfile(userId, {
      name: input.name?.trim(),
      email: input.email?.toLowerCase(),
      password: hashedPassword,
    });

    if (!updated) {
      throw new AppError(404, 'User not found');
    }

    return toUserResponse(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
}

export async function getAuthenticatedUser(
  userId: string,
): Promise<UserResponse> {
  return getUserById(userId);
}
