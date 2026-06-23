import { createRouter } from '@/core/router/router';
import { authRoutes } from '@/modules/auth/routes/auth.routes';
import { movieRoutes } from '@/modules/movies/routes/movie.routes';
import { userRoutes } from '@/modules/users/routes/user.routes';

export const handleRequest = createRouter([
  ...authRoutes,
  ...movieRoutes,
  ...userRoutes,
]);
