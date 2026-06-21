import { AppError } from '@/core/errors/app-error';
import { ZodError } from 'zod';

type SuccessPayload = Record<string, unknown> | unknown[];

export function jsonResponse(
  data: SuccessPayload,
  status = 200,
): Response {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(error: unknown): Response {
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
}
