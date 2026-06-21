import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  createUserSchema,
  listUsersQuerySchema,
  userIdSchema,
} from '@/modules/users/validations/user.validation';
import {
  createUser,
  getUserById,
  getUsers,
} from '@/modules/users/services/user.service';
import type { RouteHandler } from '@/core/router/router';

export const createUserHandler: RouteHandler = async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createUserSchema.parse(body);
  const user = await createUser(input);

  return jsonResponse(user, 201);
};

export const getUserHandler: RouteHandler = async (_req, params) => {
  const { id } = userIdSchema.parse(params);
  const user = await getUserById(id);

  return jsonResponse(user);
};

export const listUsersHandler: RouteHandler = async (req) => {
  const url = new URL(req.url);
  const query = listUsersQuerySchema.parse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  const result = await getUsers(query);

  return jsonResponse(result);
};
