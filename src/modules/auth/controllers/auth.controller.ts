import { withAuth } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  signupSchema,
  updateProfileSchema,
} from '@/modules/auth/validations/auth.validation';
import {
  getAuthenticatedUser,
  login,
  logout,
  refreshAccessToken,
  signup,
  updateProfile,
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

export const refreshHandler = async (req: Request) => {
  const body = await parseJsonBody<unknown>(req);
  const input = refreshSchema.parse(body);
  const result = await refreshAccessToken(input);

  return jsonResponse(result);
};

export const logoutHandler = withAuth(async (req, _params, auth) => {
  const body = await parseJsonBody<unknown>(req);
  const input = logoutSchema.parse(body);
  await logout(auth, input);

  return jsonResponse({ message: 'Logged out successfully' });
});

export const meHandler = withAuth(async (_req, _params, auth) => {
  const user = await getAuthenticatedUser(auth.userId);

  return jsonResponse(user);
});

export const updateProfileHandler = withAuth(async (req, _params, auth) => {
  const body = await parseJsonBody<unknown>(req);
  const input = updateProfileSchema.parse(body);
  const user = await updateProfile(auth.userId, input);

  return jsonResponse(user);
});
