import type RouterTypes from '@/core/router/router.types';
import authController from '@/modules/auth/controllers/auth.controller';

const authRoutes: RouterTypes.Route[] = [
  {
    method: 'POST',
    path: '/api/auth/signup',
    handler: authController.signupHandler,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: authController.loginHandler,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    handler: authController.meHandler,
  },
];

export default authRoutes;
