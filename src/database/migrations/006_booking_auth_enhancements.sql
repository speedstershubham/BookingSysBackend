-- booking lifecycle
ALTER TABLE movie_bookings
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('confirmed', 'cancelled'));

ALTER TABLE movie_bookings
  ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) NOT NULL DEFAULT 'none'
  CHECK (refund_status IN ('none', 'pending', 'completed', 'not_applicable'));

ALTER TABLE movie_bookings
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0
  CHECK (paid_amount >= 0);

ALTER TABLE movie_bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_movie_bookings_status ON movie_bookings(status);

-- access token blacklist (by JWT jti)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti VARCHAR(64) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- refresh tokens (opaque, stored hashed)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
