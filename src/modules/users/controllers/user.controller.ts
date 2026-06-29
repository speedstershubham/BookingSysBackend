import AppError from '@/core/errors/app-error';
import authMiddleware from '@/core/auth/auth.middleware';
import response from '@/core/http/response';
import userService from '@/modules/users/services/user.service';
import userValidation from '@/modules/users/validations/user.validation';

const getUserHandler = authMiddleware.withAuth(async (_req, params, auth) => {
  const { id } = userValidation.userIdSchema.parse(params);

  if (auth.userId !== id) {
    throw new AppError(403, 'Forbidden');
  }

  const user = await userService.getUserById(id);

  return response.jsonResponse(user);
});

export default {
  getUserHandler,
};
