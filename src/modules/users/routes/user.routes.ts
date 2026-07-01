import type { Route } from '@/core/router/router.types';
import userController from '@/modules/users/controllers/user.controller';

const userRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/users',
    handler: userController.listUsersHandler,
  },
  {
    method: 'GET',
    path: '/api/users/:id',
    handler: userController.getUserHandler,
  },
];

export default userRoutes;
