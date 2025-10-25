/**
 * Kiwi.com Tequila API Client
 * With circuit breaker, caching, and error handling
 */

import {
  getCachedFlights,
  cacheFlights,
  getCacheStrategy,
  generateCacheKey,
  recordCacheHit,
  recordCacheMiss,
} from './cache';

// Circuit breaker state
let failureCount = 0;
let lastFailureTime: number | null = null;
const FAILURE_THRESHOLD = 5;
const COOLDOWN_PERIOD = 60 * 1000; // 60 seconds

export interface KiwiSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: 'M' | 'W' | 'C' | 'F'; // Economy, Premium Economy, Business, First
  maxStops?: number;
  currency?: string;
}

export interface KiwiFlightResult {
  id: string;
  price: number;
  currency: string;
  segments: Array<{
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    duration: number;
  }>;
  totalDuration: number;
  isVirtualInterline: boolean;
  guarantee: string;
}

/**
 * Check circuit breaker status
 */
function isCircuitOpen(): boolean {
  if (failureCount < FAILURE_THRESHOLD) return false;

  if (lastFailureTime && Date.now() - lastFailureTime < COOLDOWN_PERIOD) {
    return true; // Circuit open, cooling down
  }

  // Cooldown period passed, reset
  failureCount = 0;
  lastFailureTime = null;
  return false;
}

/**
 * Record API failure
 */
function recordFailure() {
  failureCount++;
  lastFailureTime = Date.now();

  if (failureCount >= FAILURE_THRESHOLD) {
    console.warn(`🔴 Circuit breaker opened after ${failureCount} failures`);
  }
}

/**
 * Reset circuit breaker on success
 */
function recordSuccess() {
  if (failureCount > 0) {
    console.log('✅ Circuit breaker reset after successful call');
  }
  failureCount = 0;
  lastFailureTime = null;
}

/**
 * Exponential backoff retry
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const backoffMs = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Retry ${i + 1}/${maxRetries} after ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error('All retries failed');
}

/**
 * Search flights with Kiwi API
 * Includes caching, circuit breaker, and retries
 */
export async function searchKiwiFlights(
  params: KiwiSearchParams
): Promise<KiwiFlightResult[]> {
  // Generate cache key
  const cacheKey = generateCacheKey(params);

  // Check cache first
  const cached = await getCachedFlights<KiwiFlightResult[]>(cacheKey);
  if (cached) {
    recordCacheHit();
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  recordCacheMiss();

  // Check circuit breaker
  if (isCircuitOpen()) {
    console.warn('⚠️ Circuit breaker is open, using stale cache if available');
    // TODO: Return stale cache with warning
    throw new Error('Circuit breaker is open - API temporarily unavailable');
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(
    params.origin,
    params.destination,
    params.departureDate
  );

  console.log(`🔍 Searching Kiwi API: ${params.origin} → ${params.destination}`);
  console.log(`   Cache strategy: ${strategy.tier} (TTL: ${strategy.ttl}s)`);

  try {
    // Call Kiwi API with retry logic
    const results = await retryWithBackoff(async () => {
      const response = await fetch('https://api.tequila.kiwi.com/v2/search', {
        method: 'GET',
        headers: {
          'apikey': process.env.KIWI_API_KEY!,
          'Content-Type': 'application/json',
        },
        // Build query params
        // TODO: Implement full Kiwi API request
      });

      if (!response.ok) {
        throw new Error(`Kiwi API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    });

    // Transform Kiwi response to our format
    const flights: KiwiFlightResult[] = []; // TODO: Transform response

    // Cache the results
    await cacheFlights(cacheKey, flights, strategy);

    recordSuccess();

    return flights;
  } catch (error) {
    recordFailure();
    console.error('Kiwi API error:', error);
    throw error;
  }
}

/**
 * Get circuit breaker status for monitoring
 */
export function getCircuitBreakerStatus() {
  return {
    isOpen: isCircuitOpen(),
    failureCount,
    lastFailureTime,
    threshold: FAILURE_THRESHOLD,
    cooldownPeriod: COOLDOWN_PERIOD,
  };
}
