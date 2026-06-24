import { AppError } from '@/core/errors/app-error';
import {
  buildPagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/core/types/pagination';
import {
  findAdminUserById,
  findAdminUsers,
  updateUserBanById,
  updateUserRoleById,
} from '@/modules/admin/repository/admin-user.repository';
import type {
  AdminUserRecord,
  UpdateUserBanInput,
  UpdateUserRoleInput,
} from '@/modules/admin/types/admin.types';

export async function getAdminUsers(
  params: PaginationParams,
): Promise<PaginatedResult<AdminUserRecord>> {
  const { users, total } = await findAdminUsers(params);

  return {
    items: users,
    pagination: buildPagination(params, total),
  };
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord> {
  const user = await findAdminUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function updateUserRole(
  id: string,
  input: UpdateUserRoleInput,
  actorId: string,
): Promise<AdminUserRecord> {
  if (id === actorId && input.role !== 'admin') {
    throw new AppError(400, 'You cannot demote your own admin account');
  }

  const user = await updateUserRoleById(id, input);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function updateUserBan(
  id: string,
  input: UpdateUserBanInput,
  actorId: string,
): Promise<AdminUserRecord> {
  if (id === actorId && input.banned) {
    throw new AppError(400, 'You cannot ban your own account');
  }

  const user = await findAdminUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === 'admin' && input.banned) {
    throw new AppError(400, 'Admin accounts cannot be banned');
  }

  const updated = await updateUserBanById(id, input);

  if (!updated) {
    throw new AppError(404, 'User not found');
  }

  return updated;
}
