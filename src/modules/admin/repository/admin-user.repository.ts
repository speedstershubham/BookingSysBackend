import { db } from '@/database/postgres';
import type { PaginationParams } from '@/core/types/pagination';
import type {
  AdminUserRecord,
  UpdateUserBanInput,
  UpdateUserRoleInput,
} from '@/modules/admin/types/admin.types';

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_banned: boolean;
  banned_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function mapAdminUser(row: AdminUserRow): AdminUserRecord {
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

const ADMIN_USER_COLUMNS =
  'id, name, email, role, is_banned, banned_at, created_at, updated_at';

export async function findAdminUsers(
  params: PaginationParams,
): Promise<{ users: AdminUserRecord[]; total: number }> {
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM users
  `;

  const rows = await db<AdminUserRow[]>`
    SELECT ${db.unsafe(ADMIN_USER_COLUMNS)}
    FROM users
    ORDER BY created_at DESC
    LIMIT ${params.limit}
    OFFSET ${offset}
  `;

  return {
    users: rows.map(mapAdminUser),
    total: countRow!.count,
  };
}

export async function findAdminUserById(
  id: string,
): Promise<AdminUserRecord | null> {

  const [row] = await db<AdminUserRow[]>`
    SELECT ${db.unsafe(ADMIN_USER_COLUMNS)}
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return row ? mapAdminUser(row) : null;
}

export async function isUserBanned(userId: string): Promise<boolean> {

  const [row] = await db<{ is_banned: boolean }[]>`
    SELECT is_banned
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return row?.is_banned ?? false;
}

export async function updateUserRoleById(
  id: string,
  input: UpdateUserRoleInput,
): Promise<AdminUserRecord | null> {

  const [row] = await db<AdminUserRow[]>`
    UPDATE users
    SET role = ${input.role}, updated_at = ${new Date()}
    WHERE id = ${id}
    RETURNING ${db.unsafe(ADMIN_USER_COLUMNS)}
  `;

  return row ? mapAdminUser(row) : null;
}

export async function updateUserBanById(
  id: string,
  input: UpdateUserBanInput,
): Promise<AdminUserRecord | null> {
  const bannedAt = input.banned ? new Date() : null;

  const [row] = await db<AdminUserRow[]>`
    UPDATE users
    SET
      is_banned = ${input.banned},
      banned_at = ${bannedAt},
      updated_at = ${new Date()}
    WHERE id = ${id}
    RETURNING ${db.unsafe(ADMIN_USER_COLUMNS)}
  `;

  return row ? mapAdminUser(row) : null;
}
