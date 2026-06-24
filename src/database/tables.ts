export const Tables = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  SERVICES: 'services',
} as const;

export type TableName = (typeof Tables)[keyof typeof Tables];
