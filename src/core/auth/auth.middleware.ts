import jwt from '@/core/auth/jwt';
import type {
  AdminHandler,
  AuthContext,
  AuthenticatedHandler,
} from '@/core/auth/auth.middleware.types';
import type { RouteHandler } from '@/core/router/router.types';
import AppError from '@/core/errors/app-error';
import tokenRepository from '@/modules/auth/repository/token.repository';
import adminUserRepository from '@/modules/admin/repository/admin-user.repository';

const { verifyToken } = jwt;

const authenticate = (req: Request): AuthContext => {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    return verifyToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

const assertAuthenticated = async (req: Request): Promise<AuthContext> => {
  const auth = authenticate(req);

  if (await tokenRepository.isAccessTokenBlacklisted(auth.jti)) {
    throw new AppError(401, 'Token has been revoked');
  }

  if (await adminUserRepository.isUserBanned(auth.userId)) {
    throw new AppError(403, 'Account has been banned');
  }

  return auth;
};

const withAuth =
  (handler: AuthenticatedHandler): RouteHandler =>
  async (req, params) => {
    const auth = await assertAuthenticated(req);
    return handler(req, params, auth);
  };

const withAdmin =
  (handler: AdminHandler): RouteHandler =>
  async (req, params) => {
    const auth = await assertAuthenticated(req);

    if (auth.role !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }

    return handler(req, params, auth);
  };

export default { authenticate, withAuth, withAdmin };
