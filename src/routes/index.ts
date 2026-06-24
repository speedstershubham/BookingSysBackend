import createRouter from '@/core/router/router';
import authRoutes from '@/modules/auth/routes/auth.routes';
import userRoutes from '@/modules/users/routes/user.routes';

const handleRequest = createRouter([...authRoutes, ...userRoutes]);

export default handleRequest;
