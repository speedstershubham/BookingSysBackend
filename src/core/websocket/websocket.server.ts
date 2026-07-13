import type { Server, ServerWebSocket } from 'bun';

import jwt from '@/core/auth/jwt';
import type {
  WebSocketClientData,
  WebSocketClientMessage,
  WebSocketServerMessage,
} from '@/core/websocket/websocket.types';
import adminUserRepository from '@/modules/admin/repository/admin-user.repository';
import tokenRepository from '@/modules/auth/repository/token.repository';

let server: Server<WebSocketClientData> | null = null;

const connections = new Set<ServerWebSocket<WebSocketClientData>>();

const setServer = (instance: Server<WebSocketClientData>): void => {
  server = instance;
};

const authenticateToken = async (token: string | null): Promise<string> => {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const auth = jwt.verifyToken(token);

  if (await tokenRepository.isAccessTokenBlacklisted(auth.jti)) {
    throw new Error('Unauthorized');
  }

  if (await adminUserRepository.isUserBanned(auth.userId)) {
    throw new Error('Forbidden');
  }

  return auth.userId;
};

const handleOpen = (ws: ServerWebSocket<WebSocketClientData>): void => {
  connections.add(ws);
};

const handleMessage = (
  ws: ServerWebSocket<WebSocketClientData>,
  message: string | Buffer,
): void => {
  try {
    const payload = JSON.parse(
      typeof message === 'string' ? message : message.toString(),
    ) as WebSocketClientMessage;

    if (payload.type === 'subscribe' && payload.showtimeId) {
      if (ws.data.subscribedShowtimeId) {
        ws.unsubscribe(`showtime:${ws.data.subscribedShowtimeId}`);
      }

      ws.data.subscribedShowtimeId = payload.showtimeId;
      ws.subscribe(`showtime:${payload.showtimeId}`);
      return;
    }

    if (payload.type === 'unsubscribe' && ws.data.subscribedShowtimeId) {
      ws.unsubscribe(`showtime:${ws.data.subscribedShowtimeId}`);
      ws.data.subscribedShowtimeId = undefined;
    }
  } catch {
    ws.send(
      JSON.stringify({ type: 'error', message: 'Invalid message format' }),
    );
  }
};

const handleClose = (ws: ServerWebSocket<WebSocketClientData>): void => {
  connections.delete(ws);
};

const broadcastSeatsUpdated = (showtimeId: string, seatIds: string[]): void => {
  const payload: WebSocketServerMessage = {
    type: 'seats_updated',
    showtimeId,
    seatIds,
  };

  server?.publish(`showtime:${showtimeId}`, JSON.stringify(payload));
};

const websocketHandlers = {
  open: handleOpen,
  message: handleMessage,
  close: handleClose,
};

export default {
  setServer,
  authenticateToken,
  websocketHandlers,
  broadcastSeatsUpdated,
};
