/**
 * Request ID Middleware
 *
 * Generates unique IDs for each request to enable:
 * - Request tracing across logs
 * - Debugging production issues
 * - Correlating frontend/backend errors
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Store request IDs in AsyncLocalStorage for access anywhere
import { AsyncLocalStorage } from 'async_hooks';

const requestIdStorage = new AsyncLocalStorage<string>();

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Get current request ID from context
 */
export function getRequestId(): string | undefined {
  return requestIdStorage.getStore();
}

/**
 * Middleware to add request ID to all requests
 *
 * Usage in middleware.ts:
 * ```typescript
 * import { withRequestId } from '@/lib/middleware/request-id';
 *
 * export function middleware(request: NextRequest) {
 *   return withRequestId(request, async (req) => {
 *     // Your middleware logic here
 *     return NextResponse.next();
 *   });
 * }
 * ```
 */
export async function withRequestId(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') || generateRequestId();

  return requestIdStorage.run(requestId, async () => {
    try {
      const response = await handler(request);

      // Add request ID to response headers for debugging
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      console.error(`[${requestId}] Request failed:`, error);
      throw error;
    }
  });
}

/**
 * Helper to add request ID to logs
 *
 * Usage in API routes:
 * ```typescript
 * import { logWithRequestId } from '@/lib/middleware/request-id';
 *
 * export async function POST(request: NextRequest) {
 *   const requestId = getRequestId();
 *   logWithRequestId(requestId, 'info', 'Processing payment');
 *
 *   // ... your code
 * }
 * ```
 */
export function logWithRequestId(requestId: string | undefined, message: string, data?: any) {
  const prefix = requestId ? `[${requestId.slice(0, 8)}]` : '[no-id]';
  console.log(`${prefix} ${message}`, data || '');
}

/**
 * Create logger with request ID automatically included
 */
export function createRequestLogger() {
  const requestId = getRequestId();

  return {
    info: (message: string, data?: any) => logWithRequestId(requestId, message, data),
    warn: (message: string, data?: any) => console.warn(`[${requestId?.slice(0, 8) || 'no-id'}] ${message}`, data),
    error: (message: string, data?: any) => console.error(`[${requestId?.slice(0, 8) || 'no-id'}] ${message}`, data),
  };
}

/**
 * Example usage in API route:
 *
 * ```typescript
 * import { getRequestId, createRequestLogger } from '@/lib/middleware/request-id';
 *
 * export async function POST(request: NextRequest) {
 *   const requestId = getRequestId();
 *   const log = createRequestLogger();
 *
 *   log.info('Search started', { origin: 'JFK', destination: 'LAX' });
 *
 *   try {
 *     const results = await searchFlights();
 *     log.info('Search completed', { count: results.length, duration: 234 });
 *     return Response.json(results);
 *   } catch (error) {
 *     log.error('Search failed', { error: error.message });
 *     throw error;
 *   }
 * }
 * ```
 *
 * Logs will look like:
 * [a1b2c3d4] Search started { origin: 'JFK', destination: 'LAX' }
 * [a1b2c3d4] Search completed { count: 12, duration: 234 }
 *
 * This makes it easy to trace a single request through all logs!
 */
