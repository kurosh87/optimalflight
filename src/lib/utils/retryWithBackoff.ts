/**
 * Retry utility with exponential backoff
 * Automatically retries failed operations with increasing delays
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Result of the function or null if all retries failed
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        console.error('[RetryWithBackoff] Non-retryable error:', error.message);
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt === maxRetries - 1) {
        console.error(`[RetryWithBackoff] Max retries (${maxRetries}) exceeded`);
        return null;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      console.log(
        `[RetryWithBackoff] Attempt ${attempt + 1}/${maxRetries} failed. ` +
        `Retrying in ${delay}ms... Error: ${error.message}`
      );

      await sleep(delay);
    }
  }

  return null;
}

/**
 * Default retry logic - retry on 5xx errors and 429 (rate limit)
 */
function defaultShouldRetry(error: any): boolean {
  const statusCode = error.response?.statusCode || error.statusCode;

  // Don't retry on client errors (except 429 rate limit)
  if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return false;
  }

  // Retry on server errors (5xx) and rate limits (429)
  if (statusCode >= 500 || statusCode === 429) {
    return true;
  }

  // Retry on network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Amadeus-specific retry logic
 */
export function amadeusRetryPolicy(error: any): boolean {
  const statusCode = error.response?.statusCode || error.statusCode;
  const errorCode = error.response?.data?.errors?.[0]?.code;

  // Don't retry on:
  // - 400 Bad Request (invalid parameters)
  // - 401 Unauthorized (will be handled by SDK token refresh)
  // - 404 Not Found
  // - 4926 (Invalid date - past dates not supported)
  if (statusCode === 400 || statusCode === 401 || statusCode === 404) {
    return false;
  }

  if (errorCode === '4926') {
    return false;
  }

  // Retry on:
  // - 429 Rate Limit
  // - 500+ Server Errors
  // - Network timeouts
  return statusCode === 429 || statusCode >= 500 ||
         error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry specifically for Amadeus API calls
 */
export async function retryAmadeusCall<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T | null> {
  return retryWithBackoff(fn, {
    maxRetries,
    initialDelay: 1000,
    maxDelay: 8000,
    shouldRetry: amadeusRetryPolicy,
  });
}
