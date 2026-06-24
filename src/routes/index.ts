import { createRouter } from '@/core/router/router';
import { adminRoutes } from '@/modules/admin/routes/admin.routes';
import { authRoutes } from '@/modules/auth/routes/auth.routes';
import { bookingRoutes } from '@/modules/bookings/routes/booking.routes';
import { movieRoutes } from '@/modules/movies/routes/movie.routes';
import { seatRoutes } from '@/modules/seats/routes/seat.routes';
import { userRoutes } from '@/modules/users/routes/user.routes';

export const handleRequest = createRouter([
  ...authRoutes,
  ...movieRoutes,
  ...seatRoutes,
  ...bookingRoutes,
  ...userRoutes,
  ...adminRoutes,
]);
