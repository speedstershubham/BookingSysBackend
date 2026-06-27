import bcrypt from 'bcrypt';
import database from '@/database/database';
import Tables from '@/database/tables';
import userColumns from '@/modules/users/repository/user.columns';
import type { PaginationParams } from '@/core/types/pagination.types';
import type {
  CreateUserInput,
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
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAuthRow = (row: UserAuthRow): UserAuthRecord => ({
  ...mapPublicRow(row),
  password: row.password,
});

const createUser = async (
  input: CreateUserInput,
): Promise<UserPublicRecord> => {
  const now = new Date();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  return insertUser({
    name: input.name.trim(),
    email: input.email.toLowerCase(),
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });
};

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

  return mapPublicRow({
    id,
    name: payload.name,
    email: payload.email,
    created_at: payload.createdAt,
    updated_at: payload.updatedAt,
  });
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

export default {
  createUser,
  insertUser,
  findUserByEmailForAuth,
  findUserById,
  findUsers,
};
