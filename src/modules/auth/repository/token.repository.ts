import { db } from '@/database/postgres';

const blacklistAccessToken = async (
  jti: string,
  userId: string,
  expiresAt: Date,
): Promise<void> => {
  await db`
    INSERT INTO token_blacklist (jti, user_id, expires_at)
    VALUES (${jti}, ${userId}, ${expiresAt})
    ON CONFLICT (jti) DO NOTHING
  `;
};

const isAccessTokenBlacklisted = async (jti: string): Promise<boolean> => {
  const [row] = await db<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM token_blacklist
      WHERE jti = ${jti}
        AND expires_at > NOW()
    ) AS exists
  `;

  return row?.exists ?? false;
};

const insertRefreshToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> => {
  await db`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;
};

const findValidRefreshToken = async (
  tokenHash: string,
): Promise<{ userId: string; id: string } | null> => {
  const [row] = await db<{ user_id: string; id: string }[]>`
    SELECT user_id, id
    FROM refresh_tokens
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  return { userId: row.user_id, id: row.id };
};

const revokeRefreshTokenByHash = async (tokenHash: string): Promise<void> => {
  await db`
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
  `;
};

const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await db`
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = ${userId}
      AND revoked_at IS NULL
  `;
};

export default {
  blacklistAccessToken,
  isAccessTokenBlacklisted,
  insertRefreshToken,
  findValidRefreshToken,
  revokeRefreshTokenByHash,
  revokeAllUserRefreshTokens,
};
