export const Collections = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  SERVICES: 'services',
} as const;

export type CollectionName =
  (typeof Collections)[keyof typeof Collections];
