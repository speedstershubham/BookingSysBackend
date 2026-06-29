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
