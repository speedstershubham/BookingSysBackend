import { AppError } from '@/core/errors/app-error';
import { verifyToken, type JwtPayload } from '@/core/auth/jwt';

export function authenticate(req: Request): JwtPayload {
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
