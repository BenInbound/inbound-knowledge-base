import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PostgrestError } from '@supabase/supabase-js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  statusCode: number;
}

/**
 * Global error handler for API routes
 * Converts various error types into consistent JSON responses
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase/Postgrest errors
  if (isPostgrestError(error)) {
    const statusCode = getPostgrestStatusCode(error.code);
    return NextResponse.json(
      {
        error: 'Database Error',
        message: error.message || 'A database error occurred',
        code: error.code,
        details: error.details,
        statusCode,
      },
      { status: statusCode }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const statusCode = 500;
    return NextResponse.json(
      {
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        statusCode,
      },
      { status: statusCode }
    );
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
    { status: 500 }
  );
}

/**
 * Type guard for Postgrest errors
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Map Postgrest error codes to HTTP status codes
 */
function getPostgrestStatusCode(code: string): number {
  const codeMap: Record<string, number> = {
    // Authentication errors
    PGRST301: 401, // JWT expired
    PGRST302: 401, // JWT invalid

    // Authorization errors
    '42501': 403, // Insufficient privileges
    PGRST200: 403, // Permission denied

    // Not found errors
    PGRST116: 404, // No rows found
    '23503': 404, // Foreign key violation (referenced record not found)

    // Validation errors
    '23505': 409, // Unique violation
    '23514': 400, // Check violation
    PGRST102: 400, // Invalid query parameter

    // Rate limiting
    PGRST123: 429, // Too many requests
  };

  return codeMap[code] || 500;
}

/**
 * Wrapper for API route handlers that automatically catches and handles errors
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Common API error factories
 */
export const ApiErrors = {
  badRequest: (message: string, code?: string) =>
    new ApiError(400, message, code || 'BAD_REQUEST'),

  unauthorized: (message = 'Unauthorized', code?: string) =>
    new ApiError(401, message, code || 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden', code?: string) =>
    new ApiError(403, message, code || 'FORBIDDEN'),

  notFound: (resource: string, code?: string) =>
    new ApiError(404, `${resource} not found`, code || 'NOT_FOUND'),

  conflict: (message: string, code?: string) =>
    new ApiError(409, message, code || 'CONFLICT'),

  tooManyRequests: (message = 'Too many requests', code?: string) =>
    new ApiError(429, message, code || 'RATE_LIMIT_EXCEEDED'),

  internal: (message = 'Internal server error', code?: string) =>
    new ApiError(500, message, code || 'INTERNAL_ERROR'),
};
