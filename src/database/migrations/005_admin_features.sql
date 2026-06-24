-- theatres (venue / cinema location)
CREATE TABLE IF NOT EXISTS theatres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO theatres (name, location)
VALUES ('Main Cinema', 'Downtown')
ON CONFLICT (name) DO NOTHING;

-- link halls (screens) to theatres
ALTER TABLE halls
  ADD COLUMN IF NOT EXISTS theatre_id UUID REFERENCES theatres(id) ON DELETE RESTRICT;

UPDATE halls
SET theatre_id = (SELECT id FROM theatres ORDER BY created_at ASC LIMIT 1)
WHERE theatre_id IS NULL;

ALTER TABLE halls
  ALTER COLUMN theatre_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_halls_theatre_id ON halls(theatre_id);

-- ticket pricing for revenue
ALTER TABLE showtimes
  ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 500.00
  CHECK (ticket_price >= 0);

-- user ban support
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
