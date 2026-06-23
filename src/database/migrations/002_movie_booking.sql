-- movies
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  genre VARCHAR(100) NOT NULL DEFAULT '',
  rating VARCHAR(10) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- halls (each hall has a fixed seat capacity)
CREATE TABLE IF NOT EXISTS halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  capacity INT NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- showtimes: a movie playing in a hall at a given time
CREATE TABLE IF NOT EXISTS showtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (movie_id, hall_id, start_time)
);

-- seats generated per hall (1 .. capacity)
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  seat_number INT NOT NULL CHECK (seat_number > 0),
  UNIQUE (hall_id, seat_number)
);

-- movie seat bookings
CREATE TABLE IF NOT EXISTS movie_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES movie_bookings(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  UNIQUE (showtime_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_hall_id ON showtimes(hall_id);
CREATE INDEX IF NOT EXISTS idx_seats_hall_id ON seats(hall_id);
CREATE INDEX IF NOT EXISTS idx_movie_bookings_user_id ON movie_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_bookings_showtime_id ON movie_bookings(showtime_id);

-- seed sample halls
INSERT INTO halls (name, capacity) VALUES
  ('Hall A', 10),
  ('Hall B', 15),
  ('Hall C', 20)
ON CONFLICT (name) DO NOTHING;

-- generate seats for each hall
INSERT INTO seats (hall_id, seat_number)
SELECT h.id, gs.seat_number
FROM halls h
CROSS JOIN LATERAL generate_series(1, h.capacity) AS gs(seat_number)
ON CONFLICT (hall_id, seat_number) DO NOTHING;

-- seed sample movies
INSERT INTO movies (title, description, duration_minutes, genre, rating)
SELECT v.title, v.description, v.duration_minutes, v.genre, v.rating
FROM (
  VALUES
    (
      'Inception',
      'A thief who steals secrets through dreams is offered a chance to plant an idea instead.',
      148,
      'Sci-Fi',
      'PG-13'
    ),
    (
      'The Dark Knight',
      'Batman faces the Joker, a criminal mastermind who plunges Gotham into chaos.',
      152,
      'Action',
      'PG-13'
    ),
    (
      'Interstellar',
      'Explorers travel through a wormhole in space to ensure humanity survival.',
      169,
      'Sci-Fi',
      'PG-13'
    )
) AS v(title, description, duration_minutes, genre, rating)
WHERE NOT EXISTS (
  SELECT 1 FROM movies m WHERE m.title = v.title
);

-- seed showtimes (only if not already present)
INSERT INTO showtimes (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, st.start_time, st.end_time
FROM (
  VALUES
    ('Inception', 'Hall A', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 148 minutes'),
    ('Inception', 'Hall B', NOW() + INTERVAL '1 day 3 hours', NOW() + INTERVAL '1 day 3 hours 148 minutes'),
    ('The Dark Knight', 'Hall A', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 152 minutes'),
    ('The Dark Knight', 'Hall C', NOW() + INTERVAL '2 days 5 hours', NOW() + INTERVAL '2 days 5 hours 152 minutes'),
    ('Interstellar', 'Hall B', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 169 minutes'),
    ('Interstellar', 'Hall C', NOW() + INTERVAL '3 days 4 hours', NOW() + INTERVAL '3 days 4 hours 169 minutes')
) AS st(movie_title, hall_name, start_time, end_time)
JOIN movies m ON m.title = st.movie_title
JOIN halls h ON h.name = st.hall_name
WHERE NOT EXISTS (
  SELECT 1
  FROM showtimes existing
  WHERE existing.movie_id = m.id
    AND existing.hall_id = h.id
    AND existing.start_time = st.start_time
);
