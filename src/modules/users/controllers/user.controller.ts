import AppError from '@/core/errors/app-error';
import authMiddleware from '@/core/auth/auth.middleware';
import response from '@/core/http/response';
import userValidation from '@/modules/users/validations/user.validation';
import userService from '@/modules/users/services/user.service';

const getUserHandler = authMiddleware.withAuth(async (_req, params, auth) => {
  const { id } = userValidation.userIdSchema.parse(params);

  if (auth.userId !== id) {
    throw new AppError(403, 'Forbidden');
  }

  const user = await userService.getUserById(id);

  return response.jsonResponse(user);
});

const listUsersHandler = authMiddleware.withAuth(async (req) => {
  const url = new URL(req.url);
  const query = userValidation.listUsersQuerySchema.parse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  const result = await userService.getUsers(query);

  return response.jsonResponse(result);
});

export default { getUserHandler, listUsersHandler };
