import type { Route } from '@/core/router/router.types';
import authController from '@/modules/auth/controllers/auth.controller';

export default [
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
    method: 'POST',
    path: '/api/auth/refresh',
    handler: authController.refreshHandler,
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    handler: authController.logoutHandler,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    handler: authController.meHandler,
  },
  {
    method: 'PATCH',
    path: '/api/auth/me',
    handler: authController.updateProfileHandler,
  },
] satisfies Route[];
