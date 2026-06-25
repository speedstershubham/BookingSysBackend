import bcrypt from 'bcrypt';
import jwt from '@/core/auth/jwt';
import AppError from '@/core/errors/app-error';
import postgresError from '@/core/errors/postgres-error';
import authRepository from '@/modules/auth/repository/auth.repository';
import type {
  AuthResponse,
  LoginInput,
  SignupInput,
} from '@/modules/auth/types/auth.types';
import userService from '@/modules/users/services/user.service';
import type {
  UserPublicRecord,
  UserResponse,
} from '@/modules/users/types/user.types';

const toAuthResponse = (
  user: UserResponse,
  token: string,
): AuthResponse => ({
  user,
  token,
});

const toUserResponse = (user: UserPublicRecord): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signup = async (input: SignupInput): Promise<AuthResponse> => {
  try {
    const user = await authRepository.createUserRecord(input);

    const token = jwt.signToken({ userId: user.id, email: user.email });

    return toAuthResponse(toUserResponse(user), token);
  } catch (error) {
    if (error instanceof Error && postgresError.isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
};

const login = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await authRepository.findUserRecordByEmail(input.email);

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

  const token = jwt.signToken({ userId: user.id, email: user.email });

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
};

const getAuthenticatedUser = async (
  userId: string,
): Promise<UserResponse> => userService.getUserById(userId);

export default { signup, login, getAuthenticatedUser };
