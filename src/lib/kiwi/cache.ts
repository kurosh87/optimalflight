import { getRedisClient } from '@/lib/redis';
/**
 * Kiwi API 3-Tier Caching Strategy
 * Next.js Data Cache → Redis → Client Router Cache
 * Target: 70-90% cache hit rate
 */

import { cacheGet, cacheSet } from './cache-helpers';

// Popular route pairs for cache warming
const POPULAR_ROUTES = [
  ['JFK', 'LAX'], ['LAX', 'JFK'], // NYC-LA
  ['SFO', 'JFK'], ['JFK', 'SFO'], // SF-NYC
  ['JFK', 'LHR'], ['LHR', 'JFK'], // NYC-London
  ['LAX', 'NRT'], ['NRT', 'LAX'], // LA-Tokyo
  ['SFO', 'CDG'], ['CDG', 'SFO'], // SF-Paris
  ['ORD', 'LHR'], ['LHR', 'ORD'], // Chicago-London
  ['LAX', 'SYD'], ['SYD', 'LAX'], // LA-Sydney
  ['JFK', 'CDG'], ['CDG', 'JFK'], // NYC-Paris
  ['SFO', 'LHR'], ['LHR', 'SFO'], // SF-London
  ['LAX', 'LHR'], ['LHR', 'LAX'], // LA-London
];

export interface CacheStrategy {
  ttl: number; // seconds
  tier: 'hot' | 'warm' | 'cold' | 'realtime';
}

/**
 * Determine caching strategy based on route and departure date
 */
export function getCacheStrategy(
  origin: string,
  destination: string,
  departureDate: string
): CacheStrategy {
  const route = [origin, destination];
  const isPopular = POPULAR_ROUTES.some(
    ([o, d]) => o === origin && d === destination
  );

  const daysUntilDeparture = Math.floor(
    (new Date(departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // No cache for departures <24 hours (prices change rapidly)
  if (daysUntilDeparture < 1) {
    return { ttl: 0, tier: 'realtime' };
  }

  // Popular routes: 30-minute cache
  if (isPopular) {
    return { ttl: 30 * 60, tier: 'hot' };
  }

  // Standard routes: 10-minute cache
  return { ttl: 10 * 60, tier: 'warm' };
}

/**
 * Generate cache key for flight search
 */
export function generateCacheKey(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
}): string {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers = 1,
    cabinClass = 'economy',
  } = params;

  const key = `flights:${origin}-${destination}:${departureDate}:${returnDate || 'oneway'}:${passengers}:${cabinClass}`;

  return key;
}

/**
 * Get cached flight results
 */
export async function getCachedFlights<T>(cacheKey: string): Promise<T | null> {
  return cacheGet<T>(cacheKey);
}

/**
 * Cache flight results with appropriate TTL
 */
export async function cacheFlights(
  cacheKey: string,
  data: any,
  strategy: CacheStrategy
): Promise<void> {
  if (strategy.ttl === 0) return; // No cache for real-time

  await cacheSet(cacheKey, data, strategy.ttl);
}

/**
 * Invalidate cache for a specific route
 */
export async function invalidateRouteCache(
  origin: string,
  destination: string
): Promise<void> {
  const client = await getRedisClient(); if (!client) return;

  // Pattern match all variants of this route
  const pattern = `flights:${origin}-${destination}:*`;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

/**
 * Cache warming for popular routes
 * Run this daily to pre-populate cache
 */
export async function warmPopularRoutes(
  searchFunction: (origin: string, destination: string, date: string) => Promise<any>
): Promise<void> {
  console.log('🔥 Warming cache for popular routes...');

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  for (const [origin, destination] of POPULAR_ROUTES.slice(0, 20)) {
    try {
      const cacheKey = generateCacheKey({
        origin,
        destination,
        departureDate: dateStr,
      });

      // Check if already cached
      const cached = await getCachedFlights(cacheKey);
      if (cached) {
        console.log(`  ✓ ${origin}-${destination} already cached`);
        continue;
      }

      // Fetch and cache
      const results = await searchFunction(origin, destination, dateStr);

      const strategy = getCacheStrategy(origin, destination, dateStr);
      await cacheFlights(cacheKey, results, strategy);

      console.log(`  ✓ Cached ${origin}-${destination}`);

      // Rate limit: 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ✗ Failed to warm ${origin}-${destination}:`, error);
    }
  }

  console.log('✅ Cache warming complete');
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

let cacheHits = 0;
let cacheMisses = 0;

export function recordCacheHit() {
  cacheHits++;
}

export function recordCacheMiss() {
  cacheMisses++;
}

export function getCacheStats(): CacheStats {
  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: Math.round(hitRate * 100) / 100,
    totalRequests,
  };
}

export function resetCacheStats() {
  cacheHits = 0;
  cacheMisses = 0;
}
