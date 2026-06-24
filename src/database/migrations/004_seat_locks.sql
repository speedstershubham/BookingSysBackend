CREATE TABLE IF NOT EXISTS seat_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locked_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (showtime_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_seat_locks_showtime_id ON seat_locks(showtime_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_locked_until ON seat_locks(locked_until);
