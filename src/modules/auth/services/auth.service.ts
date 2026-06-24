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
import type UserTypes from '@/modules/users/types/user.types';

const toAuthResponse = (
  user: UserTypes.UserResponse,
  token: string,
): AuthResponse => ({
  user,
  token,
});

const signup = async (input: SignupInput): Promise<AuthResponse> => {
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

    const token = jwt.signToken({ userId: user.id, email: user.email });

    return toAuthResponse(user, token);
  } catch (error) {
    if (postgresError.isUniqueViolation(error)) {
      throw new AppError(409, 'Email is already registered');
    }

    throw error;
  }
};

const login = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await authRepository.findUserRecordByEmail(
    input.email.toLowerCase(),
  );

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
): Promise<UserTypes.UserResponse> => userService.getUserById(userId);

export default { signup, login, getAuthenticatedUser };
