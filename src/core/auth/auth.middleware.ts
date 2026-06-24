import { verifyToken } from '@/core/auth/jwt';
import { isAccessTokenBlacklisted } from '@/modules/auth/repository/token.repository';
import { isUserBanned } from '@/modules/admin/repository/admin-user.repository';
import { AppError } from '@/core/errors/app-error';
import type { RouteHandler } from '@/core/router/router';
import type { JwtPayload } from '@/core/auth/jwt';

export type AuthContext = JwtPayload & { expiresAt: Date };

export function authenticate(req: Request): AuthContext {
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
}

async function assertAuthenticated(req: Request): Promise<AuthContext> {
  const auth = authenticate(req);

  if (await isAccessTokenBlacklisted(auth.jti)) {
    throw new AppError(401, 'Token has been revoked');
  }

  if (await isUserBanned(auth.userId)) {
    throw new AppError(403, 'Account has been banned');
  }

  return auth;
}

type AuthenticatedHandler = (
  req: Request,
  params: Record<string, string>,
  auth: AuthContext,
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (req, params) => {
    const auth = await assertAuthenticated(req);
    return handler(req, params, auth);
  };
}

type AdminHandler = (
  req: Request,
  params: Record<string, string>,
  auth: AuthContext,
) => Promise<Response>;

export function withAdmin(handler: AdminHandler): RouteHandler {
  return async (req, params) => {
    const auth = await assertAuthenticated(req);

    if (auth.role !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }

    return handler(req, params, auth);
  };
}
