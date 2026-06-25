import AppError from '@/core/errors/app-error';
import type { SuccessPayload } from '@/core/http/http.types';
import { ZodError } from 'zod';

const jsonResponse = (
  data: SuccessPayload,
  status = 200,
): Response => Response.json({ success: true, data }, { status });

const errorResponse = (error: Error): Response => {
  if (error instanceof AppError) {
    return Response.json(
      { success: false, message: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        success: false,
        message: 'Validation failed',
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  return Response.json(
    { success: false, message: 'Internal server error' },
    { status: 500 },
  );
};

export default { jsonResponse, errorResponse };
