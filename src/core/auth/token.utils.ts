import { createHash, randomBytes } from 'node:crypto';

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const generateRefreshToken = (): string => randomBytes(48).toString('hex');

const generateJti = (): string => randomBytes(16).toString('hex');

export default { hashToken, generateRefreshToken, generateJti };
