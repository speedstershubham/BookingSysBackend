import { withAuth } from '@/core/auth/auth.middleware';
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

export const signupHandler = async (req: Request) => {
  const body = await parseJsonBody<unknown>(req);
  const input = signupSchema.parse(body);
  const result = await signup(input);

  return jsonResponse(result, 201);
};

export const loginHandler = async (req: Request) => {
  const body = await parseJsonBody<unknown>(req);
  const input = loginSchema.parse(body);
  const result = await login(input);

  return jsonResponse(result);
};

export const meHandler = withAuth(async (_req, _params, auth) => {
  const user = await getAuthenticatedUser(auth.userId);

  return jsonResponse(user);
});
