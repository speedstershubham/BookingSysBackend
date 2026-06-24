import postgres from '@/database/postgres';
import userColumns from '@/modules/users/repository/user.columns';
import type PaginationTypes from '@/core/types/pagination.types';
import type UserTypes from '@/modules/users/types/user.types';

const mapPublicRow = (row: UserTypes.UserPublicRow): UserTypes.UserPublicRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAuthRow = (row: UserTypes.UserAuthRow): UserTypes.UserAuthRecord => ({
  ...mapPublicRow(row),
  password: row.password,
});

const insertUser = async (
  payload: UserTypes.InsertUserPayload,
): Promise<UserTypes.UserPublicRecord> => {
  const [user] = await postgres.sql<UserTypes.UserPublicRow[]>`
    INSERT INTO users (name, email, password, created_at, updated_at)
    VALUES (
      ${payload.name},
      ${payload.email},
      ${payload.password},
      ${payload.createdAt},
      ${payload.updatedAt}
    )
    RETURNING ${postgres.sql.unsafe(userColumns.USER_PUBLIC_COLUMNS)}
  `;

  if (!user) {
    throw new Error('Failed to create user');
  }

  return mapPublicRow(user);
};

const findUserByEmailForAuth = async (
  email: string,
): Promise<UserTypes.UserAuthRecord | null> => {
  const [user] = await postgres.sql<UserTypes.UserAuthRow[]>`
    SELECT ${postgres.sql.unsafe(userColumns.USER_AUTH_COLUMNS)}
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return user ? mapAuthRow(user) : null;
};

const findUserById = async (
  id: string,
): Promise<UserTypes.UserPublicRecord | null> => {
  const [user] = await postgres.sql<UserTypes.UserPublicRow[]>`
    SELECT ${postgres.sql.unsafe(userColumns.USER_PUBLIC_COLUMNS)}
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return user ? mapPublicRow(user) : null;
};

const findUsers = async (
  params: PaginationTypes.PaginationParams,
): Promise<{ users: UserTypes.UserPublicRecord[]; total: number }> => {
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await postgres.sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM users
  `;
  const total = Number(countRow?.count ?? 0);

  const users = await postgres.sql<UserTypes.UserPublicRow[]>`
    SELECT ${postgres.sql.unsafe(userColumns.USER_PUBLIC_COLUMNS)}
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
  insertUser,
  findUserByEmailForAuth,
  findUserById,
  findUsers,
};
