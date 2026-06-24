import { sql } from '@/database/postgres';
import type { PaginationParams } from '@/core/types/pagination';
import {
  USER_AUTH_COLUMNS,
  USER_PUBLIC_COLUMNS,
} from '@/modules/users/repository/user.columns';
import type {
  InsertUserPayload,
  UserAuthRecord,
  UserAuthRow,
  UserPublicRecord,
  UserPublicRow,
} from '@/modules/users/types/user.types';

function mapPublicRow(row: UserPublicRow): UserPublicRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isBanned: row.is_banned,
    bannedAt: row.banned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuthRow(row: UserAuthRow): UserAuthRecord {
  return {
    ...mapPublicRow(row),
    password: row.password,
  };
}

export async function insertUser(
  payload: InsertUserPayload,
): Promise<UserPublicRecord> {
  const [user] = await sql<UserPublicRow[]>`
    INSERT INTO users (name, email, password, created_at, updated_at)
    VALUES (
      ${payload.name},
      ${payload.email},
      ${payload.password},
      ${payload.createdAt},
      ${payload.updatedAt}
    )
    RETURNING ${sql.unsafe(USER_PUBLIC_COLUMNS)}
  `;

  if (!user) {
    throw new Error('Failed to create user');
  }

  return mapPublicRow(user);
}

export async function findUserByEmailForAuth(
  email: string,
): Promise<UserAuthRecord | null> {
  const [user] = await sql<UserAuthRow[]>`
    SELECT ${sql.unsafe(USER_AUTH_COLUMNS)}
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return user ? mapAuthRow(user) : null;
}

export async function findUserById(
  id: string,
): Promise<UserPublicRecord | null> {
  const [user] = await sql<UserPublicRow[]>`
    SELECT ${sql.unsafe(USER_PUBLIC_COLUMNS)}
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return user ? mapPublicRow(user) : null;
}

export async function findUsers(
  params: PaginationParams,
): Promise<{ users: UserPublicRecord[]; total: number }> {
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM users
  `;
  const total = Number(countRow?.count ?? 0);

  const users = await sql<UserPublicRow[]>`
    SELECT ${sql.unsafe(USER_PUBLIC_COLUMNS)}
    FROM users
    ORDER BY created_at DESC
    LIMIT ${params.limit}
    OFFSET ${offset}
  `;

  return {
    users: users.map(mapPublicRow),
    total,
  };
}

export async function findUserAuthById(
  id: string,
): Promise<UserAuthRecord | null> {
  const [user] = await sql<UserAuthRow[]>`
    SELECT ${sql.unsafe(USER_AUTH_COLUMNS)}
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return user ? mapAuthRow(user) : null;
}

export async function updateUserProfile(
  id: string,
  input: { name?: string; email?: string; password?: string },
): Promise<UserPublicRecord | null> {
  const existing = await findUserAuthById(id);

  if (!existing) {
    return null;
  }

  const name = input.name ?? existing.name;
  const email = input.email ?? existing.email;
  const password = input.password ?? existing.password;

  const [user] = await sql<UserPublicRow[]>`
    UPDATE users
    SET
      name = ${name},
      email = ${email},
      password = ${password},
      updated_at = ${new Date()}
    WHERE id = ${id}
    RETURNING ${sql.unsafe(USER_PUBLIC_COLUMNS)}
  `;

  return user ? mapPublicRow(user) : null;
}
