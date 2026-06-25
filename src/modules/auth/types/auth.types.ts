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
  token: string;
};
