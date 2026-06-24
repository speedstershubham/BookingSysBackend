import { withAuth } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  getHallSeats,
  getShowtimeSeats,
  updateSeatStatus,
} from '@/modules/seats/services/seat.service';
import {
  hallIdSchema,
  listHallSeatsQuerySchema,
  showtimeIdSchema,
  updateSeatStatusSchema,
} from '@/modules/seats/validations/seat.validation';

export const getHallSeatsHandler = withAuth(async (req, params, auth) => {
  const { id } = hallIdSchema.parse(params);
  const query = listHallSeatsQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  const seats = await getHallSeats(id, query.showtimeId, auth.userId);

  return jsonResponse(seats);
});

export const getShowtimeSeatsHandler = withAuth(async (_req, params, auth) => {
  const { id } = showtimeIdSchema.parse(params);
  const seats = await getShowtimeSeats(id, auth.userId);

  return jsonResponse(seats);
});

export const updateSeatStatusHandler = withAuth(async (req, params, auth) => {
  const { id } = showtimeIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateSeatStatusSchema.parse(body);
  const seats = await updateSeatStatus(auth.userId, id, input);

  return jsonResponse(seats);
});
