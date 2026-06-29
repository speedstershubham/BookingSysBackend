import authMiddleware from '@/core/auth/auth.middleware';
import request from '@/core/http/request';
import response from '@/core/http/response';
import seatService from '@/modules/seats/services/seat.service';
import seatValidation from '@/modules/seats/validations/seat.validation';

const getHallSeatsHandler = authMiddleware.withAuth(
  async (req, params, auth) => {
    const { id } = seatValidation.hallIdSchema.parse(params);
    const query = seatValidation.listHallSeatsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const seats = await seatService.getHallSeats(
      id,
      query.showtimeId,
      auth.userId,
    );

    return response.jsonResponse(seats);
  },
);

const getShowtimeSeatsHandler = authMiddleware.withAuth(
  async (_req, params, auth) => {
    const { id } = seatValidation.showtimeIdSchema.parse(params);
    const seats = await seatService.getShowtimeSeats(id, auth.userId);

    return response.jsonResponse(seats);
  },
);

const updateSeatStatusHandler = authMiddleware.withAuth(
  async (req, params, auth) => {
    const { id } = seatValidation.showtimeIdSchema.parse(params);
    const body = await request.parseJsonBody(req);
    const input = seatValidation.updateSeatStatusSchema.parse(body);
    const seats = await seatService.updateSeatStatus(auth.userId, id, input);

    return response.jsonResponse(seats);
  },
);

export default {
  getHallSeatsHandler,
  getShowtimeSeatsHandler,
  updateSeatStatusHandler,
};
