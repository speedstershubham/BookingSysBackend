import type { UserResponse } from '@/modules/users/types/user.types';

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  /** @deprecated Use accessToken */
  token: string;
};

export type RefreshInput = {
  refreshToken: string;
};

export type LogoutInput = {
  refreshToken?: string;
};

export type UpdateProfileInput = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};
