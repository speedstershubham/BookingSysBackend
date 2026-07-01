import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '@/config/env';
import type { JwtPayload } from '@/core/auth/auth.types';

const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export default { signToken, verifyToken };
