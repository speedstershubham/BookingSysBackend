import bcrypt from 'bcrypt';
import getDB from '@/database/postgres';
import userColumns from '@/modules/users/repository/user.columns';
import type { PaginationParams } from '@/core/types/pagination.types';
import type {
  InsertUserPayload,
  UserAuthRecord,
  UserAuthRow,
  UserPublicRecord,
  UserPublicRow,
  CreateUserInput,
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
  const db = await getDB();
  const [user] = await db<UserPublicRow[]>`
    INSERT INTO users (name, email, password, created_at, updated_at)
    VALUES (
      ${payload.name},
      ${payload.email},
      ${payload.password},
      ${payload.createdAt},
      ${payload.updatedAt}
    )
    RETURNING ${db.unsafe(userColumns.USER_PUBLIC_COLUMNS)}
  `;

  if (!user) {
    throw new Error('Failed to create user');
  }

  return mapPublicRow(user);
};

const findUserByEmailForAuth = async (
  email: string,
): Promise<UserAuthRecord | null> => {
  const db = await getDB();
  const [user] = await db<UserAuthRow[]>`
    SELECT ${db.unsafe(userColumns.USER_AUTH_COLUMNS)}
    FROM users
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `;

  return user ? mapAuthRow(user) : null;
};

const findUserById = async (id: string): Promise<UserPublicRecord | null> => {
  const db = await getDB();
  const [user] = await db<UserPublicRow[]>`
    SELECT ${db.unsafe(userColumns.USER_PUBLIC_COLUMNS)}
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return user ? mapPublicRow(user) : null;
};

const findUsers = async (
  params: PaginationParams,
): Promise<{ users: UserPublicRecord[]; total: number }> => {
  const db = await getDB();
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await db<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM users
  `;
  const total = Number(countRow?.count ?? 0);

  const users = await db<UserPublicRow[]>`
    SELECT ${db.unsafe(userColumns.USER_PUBLIC_COLUMNS)}
    FROM users
    ORDER BY created_at DESC
    LIMIT ${params.limit}
    OFFSET ${offset}
  `;

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
