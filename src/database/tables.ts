export const Tables = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  MOVIES: 'movies',
  THEATRES: 'theatres',
  HALLS: 'halls',
  SHOWTIMES: 'showtimes',
  SEATS: 'seats',
  SEAT_LOCKS: 'seat_locks',
  TOKEN_BLACKLIST: 'token_blacklist',
  REFRESH_TOKENS: 'refresh_tokens',
  MOVIE_BOOKINGS: 'movie_bookings',
  MOVIE_BOOKING_SEATS: 'movie_booking_seats',
} as const;

export type TableName = (typeof Tables)[keyof typeof Tables];
