import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { generateJti } from '@/core/auth/token.utils';

export type UserRole = 'user' | 'admin';

export type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
  jti: string;
};

export type VerifiedToken = JwtPayload & {
  expiresAt: Date;
};

export function signAccessToken(payload: Omit<JwtPayload, 'jti'>): {
  token: string;
  jti: string;
  expiresAt: Date;
} {
  const jti = generateJti();
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'];
  const token = jwt.sign({ ...payload, jti }, env.JWT_SECRET, { expiresIn });
  const decoded = jwt.decode(token) as { exp: number };

  return {
    token,
    jti,
    expiresAt: new Date(decoded.exp * 1000),
  };
}

export function verifyToken(token: string): VerifiedToken {
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload & {
    exp: number;
  };

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    jti: payload.jti,
    expiresAt: new Date(payload.exp * 1000),
  };
}

/** @deprecated Use signAccessToken */
export function signToken(payload: Omit<JwtPayload, 'jti'>): string {
  return signAccessToken(payload).token;
}
