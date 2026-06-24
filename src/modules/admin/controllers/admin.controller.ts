import { withAdmin } from '@/core/auth/auth.middleware';
import { parseJsonBody } from '@/core/http/request';
import { jsonResponse } from '@/core/http/response';
import {
  bookingIdSchema,
  createHallSchema,
  createTheatreSchema,
  bookingsReportQuerySchema,
  hallIdSchema,
  listBookingsQuerySchema,
  listHallsQuerySchema,
  occupancyReportQuerySchema,
  paginationQuerySchema,
  regenerateSeatsSchema,
  revenueReportQuerySchema,
  theatreIdSchema,
  updateHallSchema,
  updateTheatreSchema,
  updateUserBanSchema,
  updateUserRoleSchema,
  userIdSchema,
} from '@/modules/admin/validations/admin.validation';
import {
  getAdminBookingById,
  getAllBookings,
  getBookingsReportData,
  getOccupancyReportData,
  getRevenueReportData,
} from '@/modules/admin/services/admin-booking.service';
import {
  createHall,
  deleteHall,
  getHallById,
  getHalls,
  regenerateSeats,
  updateHall,
} from '@/modules/admin/services/hall-admin.service';
import {
  getAdminUserById,
  getAdminUsers,
  updateUserBan,
  updateUserRole,
} from '@/modules/admin/services/admin-user.service';
import {
  createTheatre,
  deleteTheatre,
  getTheatreById,
  getTheatres,
  updateTheatre,
} from '@/modules/admin/services/theatre.service';

function parseQuery(req: Request) {
  return Object.fromEntries(new URL(req.url).searchParams);
}

export const listTheatresHandler = withAdmin(async () => {
  const theatres = await getTheatres();
  return jsonResponse(theatres);
});

export const getTheatreHandler = withAdmin(async (_req, params) => {
  const { id } = theatreIdSchema.parse(params);
  const theatre = await getTheatreById(id);
  return jsonResponse(theatre);
});

export const createTheatreHandler = withAdmin(async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createTheatreSchema.parse(body);
  const theatre = await createTheatre(input);
  return jsonResponse(theatre, 201);
});

export const updateTheatreHandler = withAdmin(async (req, params) => {
  const { id } = theatreIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateTheatreSchema.parse(body);
  const theatre = await updateTheatre(id, input);
  return jsonResponse(theatre);
});

export const deleteTheatreHandler = withAdmin(async (_req, params) => {
  const { id } = theatreIdSchema.parse(params);
  await deleteTheatre(id);
  return jsonResponse({ message: 'Theatre deleted' });
});

export const listHallsHandler = withAdmin(async (req) => {
  const query = listHallsQuerySchema.parse(parseQuery(req));
  const halls = await getHalls(query);
  return jsonResponse(halls);
});

export const getHallHandler = withAdmin(async (_req, params) => {
  const { id } = hallIdSchema.parse(params);
  const hall = await getHallById(id);
  return jsonResponse(hall);
});

export const createHallHandler = withAdmin(async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const input = createHallSchema.parse(body);
  const hall = await createHall(input);
  return jsonResponse(hall, 201);
});

export const updateHallHandler = withAdmin(async (req, params) => {
  const { id } = hallIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateHallSchema.parse(body);
  const hall = await updateHall(id, input);
  return jsonResponse(hall);
});

export const regenerateSeatsHandler = withAdmin(async (req, params) => {
  const { id } = hallIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = regenerateSeatsSchema.parse(body);
  const hall = await regenerateSeats(id, input.capacity);
  return jsonResponse(hall);
});

export const deleteHallHandler = withAdmin(async (_req, params) => {
  const { id } = hallIdSchema.parse(params);
  await deleteHall(id);
  return jsonResponse({ message: 'Hall deleted' });
});

export const listBookingsHandler = withAdmin(async (req) => {
  const query = listBookingsQuerySchema.parse(parseQuery(req));
  const bookings = await getAllBookings(query);
  return jsonResponse(bookings);
});

export const getBookingHandler = withAdmin(async (_req, params) => {
  const { id } = bookingIdSchema.parse(params);
  const booking = await getAdminBookingById(id);
  return jsonResponse(booking);
});

export const revenueReportHandler = withAdmin(async (req) => {
  const query = revenueReportQuerySchema.parse(parseQuery(req));
  const report = await getRevenueReportData(query);
  return jsonResponse(report);
});

export const occupancyReportHandler = withAdmin(async (req) => {
  const query = occupancyReportQuerySchema.parse(parseQuery(req));
  const report = await getOccupancyReportData(query);
  return jsonResponse(report);
});

export const bookingsReportHandler = withAdmin(async (req) => {
  const query = bookingsReportQuerySchema.parse(parseQuery(req));
  const report = await getBookingsReportData(query);
  return jsonResponse(report);
});

export const listAdminUsersHandler = withAdmin(async (req) => {
  const query = paginationQuerySchema.parse(parseQuery(req));
  const users = await getAdminUsers(query);
  return jsonResponse(users);
});

export const getAdminUserHandler = withAdmin(async (_req, params) => {
  const { id } = userIdSchema.parse(params);
  const user = await getAdminUserById(id);
  return jsonResponse(user);
});

export const updateUserRoleHandler = withAdmin(async (req, params, auth) => {
  const { id } = userIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateUserRoleSchema.parse(body);
  const user = await updateUserRole(id, input, auth.userId);
  return jsonResponse(user);
});

export const updateUserBanHandler = withAdmin(async (req, params, auth) => {
  const { id } = userIdSchema.parse(params);
  const body = await parseJsonBody<unknown>(req);
  const input = updateUserBanSchema.parse(body);
  const user = await updateUserBan(id, input, auth.userId);
  return jsonResponse(user);
});
