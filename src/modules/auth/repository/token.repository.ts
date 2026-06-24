import { sql } from '@/database/postgres';

export async function blacklistAccessToken(
  jti: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  await sql`
    INSERT INTO token_blacklist (jti, user_id, expires_at)
    VALUES (${jti}, ${userId}, ${expiresAt})
    ON CONFLICT (jti) DO NOTHING
  `;
}

export async function isAccessTokenBlacklisted(jti: string): Promise<boolean> {
  const [row] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM token_blacklist
      WHERE jti = ${jti}
        AND expires_at > NOW()
    ) AS exists
  `;

  return row?.exists ?? false;
}

export async function insertRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;
}

export async function findValidRefreshToken(
  tokenHash: string,
): Promise<{ userId: string; id: string } | null> {
  const [row] = await sql<{ user_id: string; id: string }[]>`
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
}

export async function revokeRefreshTokenByHash(
  tokenHash: string,
): Promise<void> {
  await sql`
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
  `;
}

export async function revokeAllUserRefreshTokens(
  userId: string,
): Promise<void> {
  await sql`
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = ${userId}
      AND revoked_at IS NULL
  `;
}
