import type { Route } from '@/core/router/router';
import {
  createUserHandler,
  getUserHandler,
  listUsersHandler,
} from '@/modules/users/controllers/user.controller';

export const userRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/users',
    handler: createUserHandler,
  },
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
