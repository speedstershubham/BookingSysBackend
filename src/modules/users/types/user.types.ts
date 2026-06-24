export type UserPublicRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_banned: boolean;
  banned_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserAuthRow = UserPublicRow & {
  password: string;
};

export type UserPublicRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  bannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserAuthRecord = UserPublicRecord & {
  password: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type UserResponse = UserPublicRecord;

export type UpdateUserProfileInput = {
  name?: string;
  email?: string;
  password?: string;
};

export type InsertUserPayload = {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};
