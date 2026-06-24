import type { Route } from '@/core/router/router';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  signupHandler,
  updateProfileHandler,
} from '@/modules/auth/controllers/auth.controller';

export const authRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/auth/signup',
    handler: signupHandler,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: loginHandler,
  },
  {
    method: 'POST',
    path: '/api/auth/refresh',
    handler: refreshHandler,
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    handler: logoutHandler,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    handler: meHandler,
  },
  {
    method: 'PATCH',
    path: '/api/auth/me',
    handler: updateProfileHandler,
  },
];
