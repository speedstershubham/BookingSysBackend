import { AppError } from '@/core/errors/app-error';
import { withAuth } from '@/core/auth/auth.middleware';
import { jsonResponse } from '@/core/http/response';
import {
  listUsersQuerySchema,
  userIdSchema,
} from '@/modules/users/validations/user.validation';
import {
  getUserById,
  getUsers,
} from '@/modules/users/services/user.service';

export const getUserHandler = withAuth(async (_req, params, auth) => {
  const { id } = userIdSchema.parse(params);

  if (auth.userId !== id) {
    throw new AppError(403, 'Forbidden');
  }

  const user = await getUserById(id);

  return jsonResponse(user);
});

export const listUsersHandler = withAuth(async (req) => {
  const url = new URL(req.url);
  const query = listUsersQuerySchema.parse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  const result = await getUsers(query);

  return jsonResponse(result);
});
