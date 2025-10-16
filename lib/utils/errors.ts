/**
 * Error handling utilities
 * Custom error classes and error response formatting
 */

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Base application error class
 * Extends Error with additional properties for API responses
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace in V8 engines (Chrome, Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Validation error (400)
 * Used for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error (401)
 * Used when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error (403)
 * Used when user lacks permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error (404)
 * Used when a resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict error (409)
 * Used when an operation conflicts with current state (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Rate limit error (429)
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

/**
 * Database error (500)
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * External service error (502/503)
 * Used when external API calls fail
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service unavailable') {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if an error is an authorization error
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

// ============================================================================
// Error Response Formatting
// ============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    stack?: string;
  };
}

/**
 * Format any error into a standard API response
 * Sanitizes error messages and stack traces in production
 */
export function formatErrorResponse(
  error: unknown,
  includeStack: boolean = process.env.NODE_ENV === 'development'
): ErrorResponse {
  // Handle AppError instances
  if (isAppError(error)) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details }),
        ...(includeStack && error.stack && { stack: error.stack }),
      },
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        ...(includeStack && error.stack && { stack: error.stack }),
      },
    };
  }

  // Handle unknown error types
  return {
    error: {
      message: String(error) || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    },
  };
}

/**
 * Extract HTTP status code from an error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Safely execute an async function and catch errors
 * Returns [error, result] tuple (similar to Go error handling)
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[Error | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error)), null];
  }
}

/**
 * Safely execute a sync function and catch errors
 * Returns [error, result] tuple
 */
export function safeTry<T>(fn: () => T): [Error | null, T | null] {
  try {
    const result = fn();
    return [null, result];
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error)), null];
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Wrap an async function with error handling
 * Useful for API route handlers
 */
export function catchAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | ErrorResponse> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
}

// ============================================================================
// Supabase Error Handling
// ============================================================================

/**
 * Parse Supabase error and convert to AppError
 */
export function handleSupabaseError(error: any): AppError {
  // Check for specific Supabase error codes
  if (error.code === 'PGRST116') {
    // Row not found
    return new NotFoundError('Resource');
  }

  if (error.code === '23505') {
    // Unique constraint violation
    return new ConflictError('Resource already exists', {
      constraint: error.details,
    });
  }

  if (error.code === '23503') {
    // Foreign key violation
    return new ValidationError('Invalid reference', {
      constraint: error.details,
    });
  }

  if (error.code === '42501') {
    // Insufficient privilege (RLS policy violation)
    return new AuthorizationError('Access denied');
  }

  if (error.message?.includes('JWT')) {
    // JWT/auth related errors
    return new AuthenticationError('Invalid or expired session');
  }

  // Generic database error
  return new DatabaseError(error.message || 'Database operation failed', {
    code: error.code,
    details: error.details,
  });
}

/**
 * Wrap a Supabase query with error handling
 */
export async function withSupabaseErrorHandling<T>(
  queryPromise: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryPromise;

  if (error) {
    throw handleSupabaseError(error);
  }

  if (data === null) {
    throw new NotFoundError();
  }

  return data;
}

// ============================================================================
// Validation Error Helpers
// ============================================================================

/**
 * Format Zod validation errors into a readable format
 */
export function formatZodError(error: any): ValidationError {
  if (!error.errors || !Array.isArray(error.errors)) {
    return new ValidationError('Validation failed');
  }

  const details = error.errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return new ValidationError('Validation failed', details);
}

/**
 * Create a validation error with field-specific messages
 */
export function createValidationError(
  fields: Record<string, string>
): ValidationError {
  const details = Object.entries(fields).map(([field, message]) => ({
    field,
    message,
  }));

  return new ValidationError('Validation failed', details);
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log error with context (useful for debugging)
 * In production, this should integrate with a logging service
 */
export function logError(
  error: unknown,
  context?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', {
      message: getErrorMessage(error),
      error: error instanceof Error ? error : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  } else {
    // In production, send to logging service (e.g., Sentry, LogRocket)
    console.error(getErrorMessage(error), context);
  }
}

/**
 * Create an error logger middleware for API routes
 */
export function createErrorLogger(context: Record<string, any>) {
  return (error: unknown) => {
    logError(error, context);
  };
}
