import bcrypt from 'bcrypt';
import database from '@/database/database';
import Tables from '@/database/tables';
import userColumns from '@/modules/users/repository/user.columns';
import type { PaginationParams } from '@/core/types/pagination';
import type {
  InsertUserPayload,
  UserAuthRecord,
  UserAuthRow,
  UserPublicRecord,
  UserPublicRow,
} from '@/modules/users/types/user.types';

const mapPublicRow = (row: UserPublicRow): UserPublicRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  isBanned: row.is_banned,
  bannedAt: row.banned_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAuthRow = (row: UserAuthRow): UserAuthRecord => ({
  ...mapPublicRow(row),
  password: row.password,
});

const insertUser = async (
  payload: InsertUserPayload,
): Promise<UserPublicRecord> => {
  const { id } = await database.insert({
    table: Tables.USERS,
    data: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    },
  });

  const user = await database.findOne<UserPublicRow>({
    table: Tables.USERS,
    columns: userColumns.USER_PUBLIC_COLUMNS,
    where: { id },
  });

  if (!user) {
    throw new Error('Failed to create user');
  }

  return mapPublicRow(user);
};

const findUserByEmailForAuth = async (
  email: string,
): Promise<UserAuthRecord | null> => {
  const user = await database.findOne<UserAuthRow>({
    table: Tables.USERS,
    columns: userColumns.USER_AUTH_COLUMNS,
    where: { email: email.toLowerCase() },
  });

  return user ? mapAuthRow(user) : null;
};

const findUserById = async (id: string): Promise<UserPublicRecord | null> => {
  const user = await database.findOne<UserPublicRow>({
    table: Tables.USERS,
    columns: userColumns.USER_PUBLIC_COLUMNS,
    where: { id },
  });

  return user ? mapPublicRow(user) : null;
};

const findUsers = async (
  params: PaginationParams,
): Promise<{ users: UserPublicRecord[]; total: number }> => {
  const offset = (params.page - 1) * params.limit;

  const total = await database.count({ table: Tables.USERS });

  const users = await database.findMany<UserPublicRow>({
    table: Tables.USERS,
    columns: userColumns.USER_PUBLIC_COLUMNS,
    orderBy: 'created_at DESC',
    limit: params.limit,
    offset,
  });

  return {
    users: users.map(mapPublicRow),
    total,
  };
};

const findUserAuthById = async (
  id: string,
): Promise<UserAuthRecord | null> => {
  const user = await database.findOne<UserAuthRow>({
    table: Tables.USERS,
    columns: userColumns.USER_AUTH_COLUMNS,
    where: { id },
  });

  return user ? mapAuthRow(user) : null;
};

const updateUserProfile = async (
  id: string,
  input: { name?: string; email?: string; password?: string },
): Promise<UserPublicRecord | null> => {
  const existing = await findUserAuthById(id);

  if (!existing) {
    return null;
  }

  const user = await database.update<UserPublicRow>({
    table: Tables.USERS,
    data: {
      name: input.name ?? existing.name,
      email: input.email ?? existing.email,
      password: input.password ?? existing.password,
      updated_at: new Date(),
    },
    where: { id },
    returning: userColumns.USER_PUBLIC_COLUMNS,
  });

  return user ? mapPublicRow(user) : null;
};

export default {
  insertUser,
  findUserByEmailForAuth,
  findUserById,
  findUsers,
  findUserAuthById,
  updateUserProfile,
};
