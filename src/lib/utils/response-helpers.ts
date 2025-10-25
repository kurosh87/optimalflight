/**
 * API Response Helpers
 *
 * Standardized response utilities with security headers, Content-Length, and rate limiting
 */

import { NextResponse } from 'next/server';

/**
 * Security headers to include in all responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
} as const;

/**
 * Create standardized JSON response with all security headers and Content-Length
 *
 * @param data - Response data
 * @param options - Response options (status, additional headers, cache control)
 * @returns NextResponse with proper headers
 */
export function createJsonResponse<T>(
  data: T,
  options?: {
    status?: number;
    headers?: Record<string, string>;
    cacheControl?: string;
  }
): NextResponse {
  const status = options?.status || 200;
  const body = JSON.stringify(data);
  const contentLength = Buffer.byteLength(body);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Content-Length': String(contentLength),
    ...SECURITY_HEADERS,
    ...(options?.cacheControl && { 'Cache-Control': options.cacheControl }),
    ...(options?.headers || {}),
  };

  return new NextResponse(body, {
    status,
    headers,
  });
}

/**
 * Create error response with standardized format
 *
 * @param error - Error message
 * @param options - Response options
 * @returns NextResponse with error format
 */
export function createErrorResponse(
  error: string,
  options?: {
    status?: number;
    code?: string;
    details?: Record<string, any>;
    headers?: Record<string, string>;
  }
): NextResponse {
  const status = options?.status || 500;

  return createJsonResponse(
    {
      success: false,
      error,
      ...(options?.code && { code: options.code }),
      ...(options?.details && { details: options.details }),
    },
    {
      status,
      headers: options?.headers,
    }
  );
}

/**
 * Create rate limit exceeded response
 *
 * @param retryAfter - Seconds until rate limit resets
 * @param headers - Additional headers (e.g., from rate limit middleware)
 * @returns NextResponse with 429 status
 */
export function createRateLimitResponse(
  retryAfter: number,
  headers?: Record<string, string>
): NextResponse {
  return createErrorResponse(
    'Too Many Requests',
    {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      headers: {
        'Retry-After': String(retryAfter),
        ...headers,
      },
    }
  );
}

/**
 * Create validation error response
 *
 * @param errors - Validation errors
 * @param headers - Additional headers
 * @returns NextResponse with 400 status
 */
export function createValidationErrorResponse(
  errors: string | string[] | Record<string, string>,
  headers?: Record<string, string>
): NextResponse {
  const errorMessage = Array.isArray(errors)
    ? errors.join(', ')
    : typeof errors === 'string'
    ? errors
    : Object.entries(errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');

  return createErrorResponse(
    'Validation failed',
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: {
        errors: Array.isArray(errors) ? errors : typeof errors === 'string' ? [errors] : errors,
      },
      headers,
    }
  );
}

/**
 * Create unauthorized response
 *
 * @param message - Optional custom message
 * @param headers - Additional headers
 * @returns NextResponse with 401 status
 */
export function createUnauthorizedResponse(
  message = 'Authentication required',
  headers?: Record<string, string>
): NextResponse {
  return createErrorResponse(
    message,
    {
      status: 401,
      code: 'UNAUTHORIZED',
      headers,
    }
  );
}

/**
 * Create forbidden response (authenticated but not authorized)
 *
 * @param message - Optional custom message
 * @param headers - Additional headers
 * @returns NextResponse with 403 status
 */
export function createForbiddenResponse(
  message = 'Access denied',
  headers?: Record<string, string>
): NextResponse {
  return createErrorResponse(
    message,
    {
      status: 403,
      code: 'FORBIDDEN',
      headers,
    }
  );
}

/**
 * Create not found response
 *
 * @param resource - Resource type (e.g., "Flight", "User")
 * @param headers - Additional headers
 * @returns NextResponse with 404 status
 */
export function createNotFoundResponse(
  resource = 'Resource',
  headers?: Record<string, string>
): NextResponse {
  return createErrorResponse(
    `${resource} not found`,
    {
      status: 404,
      code: 'NOT_FOUND',
      headers,
    }
  );
}

/**
 * Create payload too large response
 *
 * @param maxSize - Maximum allowed size in KB
 * @param headers - Additional headers
 * @returns NextResponse with 413 status
 */
export function createPayloadTooLargeResponse(
  maxSize = 100,
  headers?: Record<string, string>
): NextResponse {
  return createErrorResponse(
    'Payload too large',
    {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      details: {
        message: `Maximum request size is ${maxSize}KB`,
        maxSizeKB: maxSize,
      },
      headers,
    }
  );
}

/**
 * Example usage in API route:
 *
 * ```typescript
 * import {
 *   createJsonResponse,
 *   createErrorResponse,
 *   createValidationErrorResponse,
 *   createRateLimitResponse,
 * } from '@/lib/utils/response-helpers';
 * import { checkRateLimit, createRateLimitHeaders } from '@/lib/middleware/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   // Rate limiting
 *   const rateLimitResult = checkRateLimit(request);
 *   const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
 *
 *   if (!rateLimitResult.allowed) {
 *     return createRateLimitResponse(rateLimitResult.retryAfter!, rateLimitHeaders);
 *   }
 *
 *   // Validation
 *   const body = await request.json();
 *   if (!body.origin) {
 *     return createValidationErrorResponse('Missing field: origin', rateLimitHeaders);
 *   }
 *
 *   // Success
 *   const data = await processRequest(body);
 *   return createJsonResponse(
 *     data,
 *     {
 *       status: 200,
 *       headers: rateLimitHeaders,
 *       cacheControl: 'public, s-maxage=300, stale-while-revalidate=600',
 *     }
 *   );
 * }
 * ```
 */
