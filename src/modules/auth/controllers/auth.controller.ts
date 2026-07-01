import authMiddleware from '@/core/auth/auth.middleware';
import request from '@/core/http/request';
import response from '@/core/http/response';
import authValidation from '@/modules/auth/validations/auth.validation';
import authService from '@/modules/auth/services/auth.service';

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

const meHandler = authMiddleware.withAuth(async (_req, _params, auth) => {
  const user = await authService.getAuthenticatedUser(auth.userId);

  return response.jsonResponse(user);
});

export default { signupHandler, loginHandler, meHandler };
