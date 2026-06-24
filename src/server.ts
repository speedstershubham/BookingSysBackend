import postgres from '@/database/postgres';
import env from '@/config/env';
import logger from '@/core/logger/logger';
import handleRequest from '@/routes/index';

const bootstrap = async () => {
  try {
    await postgres.connectDB();

    Bun.serve({
      port: Number(env.PORT),
      hostname: '0.0.0.0',
      async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === '/health' && req.method === 'GET') {
          return Response.json({
            success: true,
            message: 'Server is healthy',
          });
        }

        const response = await handleRequest(req);

        if (response) {
          return response;
        }

        return new Response('Not Found', { status: 404 });
      },
    });

    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

void bootstrap();
