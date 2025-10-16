/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per IP address)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((value, key) => {
    if (value.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => store.delete(key));
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  window: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Default rate limit configurations for different API routes
 */
export const RateLimitPresets = {
  // Very strict: 5 requests per minute
  strict: { limit: 5, window: 60 * 1000 },

  // Moderate: 20 requests per minute
  moderate: { limit: 20, window: 60 * 1000 },

  // Generous: 60 requests per minute
  generous: { limit: 60, window: 60 * 1000 },

  // Search: 30 requests per minute (searches can be frequent)
  search: { limit: 30, window: 60 * 1000 },

  // Auth: 5 attempts per 15 minutes (prevent brute force)
  auth: { limit: 5, window: 15 * 60 * 1000 },

  // Mutations: 10 requests per minute (creates, updates, deletes)
  mutations: { limit: 10, window: 60 * 1000 },
};

/**
 * Rate limiter function
 * Returns an object indicating if the request should be allowed
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.moderate
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  // Get existing entry or create new one
  let entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + config.window,
    };
    store.set(key, entry);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get the client identifier (IP address or user ID)
 * Prioritizes user ID if authenticated, falls back to IP
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to anonymous
  return 'ip:anonymous';
}

/**
 * Middleware helper for rate limiting API routes
 * Usage:
 * ```
 * const limiter = createRateLimiter(RateLimitPresets.moderate);
 * const result = limiter(request, userId);
 * if (!result.success) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (request: Request, userId?: string): RateLimitResult => {
    const identifier = getClientIdentifier(request, userId);
    return rateLimit(identifier, config);
  };
}

/**
 * Create rate limit headers for API responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
