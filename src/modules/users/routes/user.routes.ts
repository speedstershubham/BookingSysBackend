import type RouterTypes from '@/core/router/router.types';
import userController from '@/modules/users/controllers/user.controller';

const userRoutes: RouterTypes.Route[] = [
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
