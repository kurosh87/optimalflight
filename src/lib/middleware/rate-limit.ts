/**
 * Rate Limiting Middleware
 *
 * Prevents abuse by limiting requests per IP address
 * Configuration: 10 requests per minute per IP
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitStore>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

/**
 * Clean up expired entries every 5 minutes to prevent memory leaks
 * IMPORTANT: Store interval ID to prevent duplicate intervals in dev mode
 */
let cleanupInterval: NodeJS.Timeout | null = null;

if (!cleanupInterval) {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let deletedCount = 0;

    for (const [ip, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(ip);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[RateLimit] Cleaned up ${deletedCount} expired entries. Store size: ${rateLimitStore.size}`);
    }
  }, 5 * 60 * 1000);
}

/**
 * Extract IP address from request
 */
function getClientIP(request: Request): string {
  // Try common headers for proxied requests
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(request: Request): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const ip = getClientIP(request);
  const now = Date.now();

  // Get or create rate limit entry
  let rateLimitData = rateLimitStore.get(ip);

  // If no entry or window expired, create new window
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(ip, rateLimitData);
  }

  // Increment request count
  rateLimitData.count++;

  // Check if limit exceeded
  if (rateLimitData.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimitData.resetTime,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - rateLimitData.count,
    resetTime: rateLimitData.resetTime,
  };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withRateLimit<T>(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const rateLimitResult = checkRateLimit(request);
    const headers = createRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }

    // Execute handler and add rate limit headers to response
    const response = await handler(request);

    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    // Add rate limit headers
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  };
}
