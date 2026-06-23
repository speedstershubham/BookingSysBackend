export const Tables = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  MOVIES: 'movies',
  HALLS: 'halls',
  SHOWTIMES: 'showtimes',
  SEATS: 'seats',
  MOVIE_BOOKINGS: 'movie_bookings',
  MOVIE_BOOKING_SEATS: 'movie_booking_seats',
} as const;

export type TableName = (typeof Tables)[keyof typeof Tables];
