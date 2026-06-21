import { authenticate } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  loginSchema,
  signupSchema,
} from '@/modules/auth/validations/auth.validation';
import {
  getAuthenticatedUser,
  login,
  signup,
} from '@/modules/auth/services/auth.service';
import type { RouteHandler } from '@/core/router/router';

export const signupHandler: RouteHandler = async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = signupSchema.parse(body);
  const result = await signup(input);

  return jsonResponse(result, 201);
};

export const loginHandler: RouteHandler = async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = loginSchema.parse(body);
  const result = await login(input);

  return jsonResponse(result);
};

export const meHandler: RouteHandler = async (req) => {
  const { userId } = authenticate(req);
  const user = await getAuthenticatedUser(userId);

  return jsonResponse(user);
};
