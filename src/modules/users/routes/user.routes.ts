import type { Route } from '@/core/router/router.types';
import userController from '@/modules/users/controllers/user.controller';

export default [
  {
    method: 'GET',
    path: '/api/users/:id',
    handler: userController.getUserHandler,
  },
] satisfies Route[];
