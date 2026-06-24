import type { Route } from '@/core/router/router';
import {
  getUserHandler,
  listUsersHandler,
} from '@/modules/users/controllers/user.controller';

export const userRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/users',
    handler: listUsersHandler,
  },
  {
    method: 'GET',
    path: '/api/users/:id',
    handler: getUserHandler,
  },
];
