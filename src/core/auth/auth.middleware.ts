import AppError from '@/core/errors/app-error';
import jwt from '@/core/auth/jwt';
import type {
  AuthenticatedHandler,
  JwtPayload,
} from '@/core/auth/auth.types';
import type { RouteHandler } from '@/core/router/router.types';

const authenticate = (req: Request): JwtPayload => {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    return jwt.verifyToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

const withAuth = (
  handler: AuthenticatedHandler,
): RouteHandler => {
  return (req, params) => handler(req, params, authenticate(req));
};

export default { authenticate, withAuth };
