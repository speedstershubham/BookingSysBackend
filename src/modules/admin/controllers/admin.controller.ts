import authMiddleware from '@/core/auth/auth.middleware';
import httpRequest from '@/core/http/request';
import httpResponse from '@/core/http/response';
import adminValidation from '@/modules/admin/validations/admin.validation';
import adminBookingService from '@/modules/admin/services/admin-booking.service';
import hallAdminService from '@/modules/admin/services/hall-admin.service';
import adminUserService from '@/modules/admin/services/admin-user.service';
import theatreService from '@/modules/admin/services/theatre.service';

const { withAdmin } = authMiddleware;
const { parseJsonBody } = httpRequest;
const { jsonResponse } = httpResponse;

const parseQuery = (req: Request) =>
  Object.fromEntries(new URL(req.url).searchParams);

const listTheatresHandler = withAdmin(async () => {
  const theatres = await theatreService.getTheatres();
  return jsonResponse(theatres);
});

const getTheatreHandler = withAdmin(async (_req, params) => {
  const { id } = adminValidation.theatreIdSchema.parse(params);
  const theatre = await theatreService.getTheatreById(id);
  return jsonResponse(theatre);
});

const createTheatreHandler = withAdmin(async (req) => {
  const body = await parseJsonBody(req);
  const input = adminValidation.createTheatreSchema.parse(body);
  const theatre = await theatreService.createTheatre(input);
  return jsonResponse(theatre, 201);
});

const updateTheatreHandler = withAdmin(async (req, params) => {
  const { id } = adminValidation.theatreIdSchema.parse(params);
  const body = await parseJsonBody(req);
  const input = adminValidation.updateTheatreSchema.parse(body);
  const theatre = await theatreService.updateTheatre(id, input);
  return jsonResponse(theatre);
});

const deleteTheatreHandler = withAdmin(async (_req, params) => {
  const { id } = adminValidation.theatreIdSchema.parse(params);
  await theatreService.deleteTheatre(id);
  return jsonResponse({ message: 'Theatre deleted' });
});

const listHallsHandler = withAdmin(async (req) => {
  const query = adminValidation.listHallsQuerySchema.parse(parseQuery(req));
  const halls = await hallAdminService.getHalls(query);
  return jsonResponse(halls);
});

const getHallHandler = withAdmin(async (_req, params) => {
  const { id } = adminValidation.hallIdSchema.parse(params);
  const hall = await hallAdminService.getHallById(id);
  return jsonResponse(hall);
});

const createHallHandler = withAdmin(async (req) => {
  const body = await parseJsonBody(req);
  const input = adminValidation.createHallSchema.parse(body);
  const hall = await hallAdminService.createHall(input);
  return jsonResponse(hall, 201);
});

const updateHallHandler = withAdmin(async (req, params) => {
  const { id } = adminValidation.hallIdSchema.parse(params);
  const body = await parseJsonBody(req);
  const input = adminValidation.updateHallSchema.parse(body);
  const hall = await hallAdminService.updateHall(id, input);
  return jsonResponse(hall);
});

const regenerateSeatsHandler = withAdmin(async (req, params) => {
  const { id } = adminValidation.hallIdSchema.parse(params);
  const body = await parseJsonBody(req);
  const input = adminValidation.regenerateSeatsSchema.parse(body);
  const hall = await hallAdminService.regenerateSeats(id, input.capacity);
  return jsonResponse(hall);
});

const deleteHallHandler = withAdmin(async (_req, params) => {
  const { id } = adminValidation.hallIdSchema.parse(params);
  await hallAdminService.deleteHall(id);
  return jsonResponse({ message: 'Hall deleted' });
});

const listBookingsHandler = withAdmin(async (req) => {
  const query = adminValidation.listBookingsQuerySchema.parse(parseQuery(req));
  const bookings = await adminBookingService.getAllBookings(query);
  return jsonResponse(bookings);
});

const getBookingHandler = withAdmin(async (_req, params) => {
  const { id } = adminValidation.bookingIdSchema.parse(params);
  const booking = await adminBookingService.getAdminBookingById(id);
  return jsonResponse(booking);
});

const revenueReportHandler = withAdmin(async (req) => {
  const query = adminValidation.revenueReportQuerySchema.parse(parseQuery(req));
  const report = await adminBookingService.getRevenueReportData(query);
  return jsonResponse(report);
});

const occupancyReportHandler = withAdmin(async (req) => {
  const query = adminValidation.occupancyReportQuerySchema.parse(
    parseQuery(req),
  );
  const report = await adminBookingService.getOccupancyReportData(query);
  return jsonResponse(report);
});

const bookingsReportHandler = withAdmin(async (req) => {
  const query = adminValidation.bookingsReportQuerySchema.parse(
    parseQuery(req),
  );
  const report = await adminBookingService.getBookingsReportData(query);
  return jsonResponse(report);
});

const listAdminUsersHandler = withAdmin(async (req) => {
  const query = adminValidation.paginationQuerySchema.parse(parseQuery(req));
  const users = await adminUserService.getAdminUsers(query);
  return jsonResponse(users);
});

const getAdminUserHandler = withAdmin(async (_req, params) => {
  const { id } = adminValidation.userIdSchema.parse(params);
  const user = await adminUserService.getAdminUserById(id);
  return jsonResponse(user);
});

const updateUserRoleHandler = withAdmin(async (req, params, auth) => {
  const { id } = adminValidation.userIdSchema.parse(params);
  const body = await parseJsonBody(req);
  const input = adminValidation.updateUserRoleSchema.parse(body);
  const user = await adminUserService.updateUserRole(id, input, auth.userId);
  return jsonResponse(user);
});

const updateUserBanHandler = withAdmin(async (req, params, auth) => {
  const { id } = adminValidation.userIdSchema.parse(params);
  const body = await parseJsonBody(req);
  const input = adminValidation.updateUserBanSchema.parse(body);
  const user = await adminUserService.updateUserBan(id, input, auth.userId);
  return jsonResponse(user);
});

export default {
  listTheatresHandler,
  getTheatreHandler,
  createTheatreHandler,
  updateTheatreHandler,
  deleteTheatreHandler,
  listHallsHandler,
  getHallHandler,
  createHallHandler,
  updateHallHandler,
  regenerateSeatsHandler,
  deleteHallHandler,
  listBookingsHandler,
  getBookingHandler,
  revenueReportHandler,
  occupancyReportHandler,
  bookingsReportHandler,
  listAdminUsersHandler,
  getAdminUserHandler,
  updateUserRoleHandler,
  updateUserBanHandler,
};
