import type { Route } from '@/core/router/router';
import {
  getUserHandler,
} from '@/modules/users/controllers/user.controller';

export const userRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/users/:id',
    handler: getUserHandler,
  },
];
