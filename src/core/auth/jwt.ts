import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '@/config/env';
import type AuthTypes from '@/core/auth/auth.types';

const signToken = (payload: AuthTypes.JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

const verifyToken = (token: string): AuthTypes.JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as AuthTypes.JwtPayload;

export default { signToken, verifyToken };
