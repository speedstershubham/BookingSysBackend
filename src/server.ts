import '@/database/postgres';
import env from '@/config/env';
import cors from '@/core/http/cors';
import logger from '@/core/logger/logger';
import websocketServer from '@/core/websocket/websocket.server';
import handleRequest from '@/routes/index';

const bootstrap = async () => {
  try {
    const server = Bun.serve({
      port: Number(env.PORT),
      hostname: '0.0.0.0',
      async fetch(req, bunServer) {
        const url = new URL(req.url);

        if (req.method === 'OPTIONS') {
          return cors.preflightResponse();
        }

        if (url.pathname === '/ws') {
          try {
            const token = url.searchParams.get('token');
            const userId = await websocketServer.authenticateToken(token);
            const upgraded = bunServer.upgrade(req, {
              data: { userId },
            });

            if (upgraded) {
              return undefined;
            }

            return cors.withCors(
              new Response('WebSocket upgrade failed', { status: 500 }),
            );
          } catch {
            return cors.withCors(new Response('Unauthorized', { status: 401 }));
          }
        }

        if (url.pathname === '/health' && req.method === 'GET') {
          return cors.withCors(
            Response.json({
              success: true,
              message: 'Server is healthy',
            }),
          );
        }

        const response = await handleRequest(req);

        if (response) {
          return cors.withCors(response);
        }

        return cors.withCors(new Response('Not Found', { status: 404 }));
      },
      websocket: websocketServer.websocketHandlers,
    });

    websocketServer.setServer(server);

    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`🔌 WebSocket available at ws://localhost:${env.PORT}/ws`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error);
    } else {
      logger.error(new Error(String(error)));
    }
    process.exit(1);
  }
};

void bootstrap();
