import AppError from '@/core/errors/app-error';
import pagination from '@/core/types/pagination';
import type {
  PaginatedResult,
  PaginationParams,
} from '@/core/types/pagination.types';
import adminUserRepository from '@/modules/admin/repository/admin-user.repository';
import type {
  AdminUserRecord,
  UpdateUserBanInput,
  UpdateUserRoleInput,
} from '@/modules/admin/types/admin.types';

const getAdminUsers = async (
  params: PaginationParams,
): Promise<PaginatedResult<AdminUserRecord>> => {
  const { users, total } = await adminUserRepository.findAdminUsers(params);

  return {
    items: users,
    pagination: pagination.buildPagination(params, total),
  };
};

const getAdminUserById = async (id: string): Promise<AdminUserRecord> => {
  const user = await adminUserRepository.findAdminUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

const updateUserRole = async (
  id: string,
  input: UpdateUserRoleInput,
  actorId: string,
): Promise<AdminUserRecord> => {
  if (id === actorId && input.role !== 'admin') {
    throw new AppError(400, 'You cannot demote your own admin account');
  }

  const user = await adminUserRepository.updateUserRoleById(id, input);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

const updateUserBan = async (
  id: string,
  input: UpdateUserBanInput,
  actorId: string,
): Promise<AdminUserRecord> => {
  if (id === actorId && input.banned) {
    throw new AppError(400, 'You cannot ban your own account');
  }

  const user = await adminUserRepository.findAdminUserById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === 'admin' && input.banned) {
    throw new AppError(400, 'Admin accounts cannot be banned');
  }

  const updated = await adminUserRepository.updateUserBanById(id, input);

  if (!updated) {
    throw new AppError(404, 'User not found');
  }

  return updated;
};

export default {
  getAdminUsers,
  getAdminUserById,
  updateUserRole,
  updateUserBan,
};
