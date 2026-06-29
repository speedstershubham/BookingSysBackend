import type { JwtPayload } from '@/core/auth/jwt.types';

export type AuthContext = JwtPayload & { expiresAt: Date };

export type AuthenticatedHandler = (
  req: Request,
  params: Record<string, string>,
  auth: AuthContext,
) => Promise<Response>;

export type AdminHandler = (
  req: Request,
  params: Record<string, string>,
  auth: AuthContext,
) => Promise<Response>;
