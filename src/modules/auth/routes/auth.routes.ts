import type { Route } from '@/core/router/router';
import {
  loginHandler,
  meHandler,
  signupHandler,
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
    method: 'GET',
    path: '/api/auth/me',
    handler: meHandler,
  },
];
