import { createRouter } from '@/core/router/router';
import { userRoutes } from '@/modules/users/routes/user.routes';

export const handleRequest = createRouter([...userRoutes]);
