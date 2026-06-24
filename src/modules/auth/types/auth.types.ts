import type UserTypes from '@/modules/users/types/user.types';

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
  user: UserTypes.UserResponse;
  token: string;
};
