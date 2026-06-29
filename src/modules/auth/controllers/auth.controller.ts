import authMiddleware from '@/core/auth/auth.middleware';
import request from '@/core/http/request';
import response from '@/core/http/response';
import authService from '@/modules/auth/services/auth.service';
import authValidation from '@/modules/auth/validations/auth.validation';

const signupHandler = async (req: Request) => {
  const body = await request.parseJsonBody(req);
  const input = authValidation.signupSchema.parse(body);
  const result = await authService.signup(input);

  return response.jsonResponse(result, 201);
};

const loginHandler = async (req: Request) => {
  const body = await request.parseJsonBody(req);
  const input = authValidation.loginSchema.parse(body);
  const result = await authService.login(input);

  return response.jsonResponse(result);
};

const refreshHandler = async (req: Request) => {
  const body = await request.parseJsonBody(req);
  const input = authValidation.refreshSchema.parse(body);
  const result = await authService.refreshAccessToken(input);

  return response.jsonResponse(result);
};

const logoutHandler = authMiddleware.withAuth(async (req, _params, auth) => {
  const body = await request.parseJsonBody(req);
  const input = authValidation.logoutSchema.parse(body);
  await authService.logout(auth, input);

  return response.jsonResponse({ message: 'Logged out successfully' });
});

const meHandler = authMiddleware.withAuth(async (_req, _params, auth) => {
  const user = await authService.getAuthenticatedUser(auth.userId);

  return response.jsonResponse(user);
});

const updateProfileHandler = authMiddleware.withAuth(
  async (req, _params, auth) => {
    const body = await request.parseJsonBody(req);
    const input = authValidation.updateProfileSchema.parse(body);
    const user = await authService.updateProfile(auth.userId, input);

    return response.jsonResponse(user);
  },
);

export default {
  signupHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  updateProfileHandler,
};
