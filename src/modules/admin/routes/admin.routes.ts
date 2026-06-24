import type { Route } from '@/core/router/router';
import {
  createHallHandler,
  createTheatreHandler,
  deleteHallHandler,
  deleteTheatreHandler,
  getAdminUserHandler,
  getBookingHandler,
  getHallHandler,
  getTheatreHandler,
  bookingsReportHandler,
  listAdminUsersHandler,
  listBookingsHandler,
  listHallsHandler,
  listTheatresHandler,
  occupancyReportHandler,
  regenerateSeatsHandler,
  revenueReportHandler,
  updateHallHandler,
  updateTheatreHandler,
  updateUserBanHandler,
  updateUserRoleHandler,
} from '@/modules/admin/controllers/admin.controller';

export const adminRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/admin/theatres',
    handler: listTheatresHandler,
  },
  {
    method: 'POST',
    path: '/api/admin/theatres',
    handler: createTheatreHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/theatres/:id',
    handler: getTheatreHandler,
  },
  {
    method: 'PATCH',
    path: '/api/admin/theatres/:id',
    handler: updateTheatreHandler,
  },
  {
    method: 'DELETE',
    path: '/api/admin/theatres/:id',
    handler: deleteTheatreHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/halls',
    handler: listHallsHandler,
  },
  {
    method: 'POST',
    path: '/api/admin/halls',
    handler: createHallHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/halls/:id',
    handler: getHallHandler,
  },
  {
    method: 'PATCH',
    path: '/api/admin/halls/:id',
    handler: updateHallHandler,
  },
  {
    method: 'POST',
    path: '/api/admin/halls/:id/seats/regenerate',
    handler: regenerateSeatsHandler,
  },
  {
    method: 'DELETE',
    path: '/api/admin/halls/:id',
    handler: deleteHallHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/bookings',
    handler: listBookingsHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/bookings/:id',
    handler: getBookingHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/reports/revenue',
    handler: revenueReportHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/reports/occupancy',
    handler: occupancyReportHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/reports/bookings',
    handler: bookingsReportHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/users',
    handler: listAdminUsersHandler,
  },
  {
    method: 'GET',
    path: '/api/admin/users/:id',
    handler: getAdminUserHandler,
  },
  {
    method: 'PATCH',
    path: '/api/admin/users/:id/role',
    handler: updateUserRoleHandler,
  },
  {
    method: 'PATCH',
    path: '/api/admin/users/:id/ban',
    handler: updateUserBanHandler,
  },
];
