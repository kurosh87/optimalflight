/**
 * Holistic Flight Search & Ranking API (ENHANCED with Filtering & Sorting)
 *
 * POST /api/flights/search-and-rank
 *
 * Searches Kiwi API for flights and ranks them using the holistic jetlag scorer
 * Combines circadian science, aircraft comfort, airline service, and routing strategy
 *
 * Request Body:
 * {
 *   // Required search params
 *   origin: string (IATA code, e.g., "JFK")
 *   destination: string (IATA code, e.g., "NRT")
 *   date: string (YYYY-MM-DD)
 *
 *   // Optional search params
 *   adults?: number (default: 1)
 *   cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
 *   maxResults?: number (default: 20)
 *
 *   // NEW: Filtering (UX-focused)
 *   filters?: {
 *     maxPrice?: number
 *     minPrice?: number
 *     pricePercentile?: 'cheap' | 'mid' | 'expensive' | 'all'
 *     maxDuration?: number (minutes)
 *     maxStops?: number
 *     directOnly?: boolean
 *     preferredArrivalTime?: { earliest: "HH:MM", latest: "HH:MM" }
 *     preferredDepartureTime?: { earliest: "HH:MM", latest: "HH:MM" }
 *     minJetlagScore?: number (0-100)
 *     maxRecoveryDays?: number
 *     preferredAirlines?: string[] (IATA codes)
 *     excludedAirlines?: string[]
 *     modernAircraftOnly?: boolean
 *   }
 *
 *   // NEW: Sorting
 *   sortBy?: 'jetlag-best' | 'price-low' | 'value-best' | 'duration-short' | ...
 * }
 *
 * Response includes:
 * - flights: Scored and ranked flights with price optimization data
 * - priceAnalysis: Best value, cheapest, best jetlag options
 * - filterStats: How many flights removed by each filter
 * - filterSuggestions: Smart recommendations for filtering UI
 * - summary: Aggregated insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { kiwiService } from '@/lib/services/kiwiSearch';
import { convertKiwiRoutesToCompleteFlights, type KiwiRoute } from '@/lib/ranking/kiwi-holistic-adapter';
import { scoreFlightHolistically, type HolisticFlightScore, type CompleteFlightOption } from '@/lib/ranking/holistic-scorer';
import { getCacheStats } from '@/lib/ranking/cache-manager';
import { analyzePriceJetlagTradeoffs, getPriceAwareRecommendation } from '@/lib/ranking/price-optimizer';
import { applyFilters, sortFlights, getFilterSuggestions, type FlightFilters, type SortOption } from '@/lib/ranking/flight-filters';

// Simple formatter (replaces workspace-specific helper)
const formatFlightResponseEnhanced = (flight: any, score: any, valueScore: any, priceCategory: any, priceAnalysis: any) => ({
  ...flight,
  holisticScore: score,
  valueScore,
  priceCategory,
  priceAnalysis
});

// PERFORMANCE & SECURITY IMPROVEMENTS
import { checkRateLimit, createRateLimitHeaders } from '@/lib/middleware/rate-limit';
import { flightCache, withCache } from '@/lib/cache/flight-cache';
import { queuedRequest } from '@/lib/queue/request-queue';
import { createJsonResponse, createErrorResponse, createRateLimitResponse, createValidationErrorResponse, createPayloadTooLargeResponse } from '@/lib/utils/response-helpers';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Request size limit: 100KB
const MAX_REQUEST_SIZE = 100 * 1024;

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

interface SearchRequest {
  origin: string;
  destination: string;
  date: string;
  adults?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  maxResults?: number;
  filters?: FlightFilters; // NEW: Optional filtering
  sortBy?: SortOption;     // NEW: Optional sorting
}

function validateRequest(body: any): { valid: boolean; error?: string; data?: SearchRequest } {
  if (!body.origin || typeof body.origin !== 'string') {
    return { valid: false, error: 'Missing or invalid field: origin (IATA code)' };
  }

  if (!body.destination || typeof body.destination !== 'string') {
    return { valid: false, error: 'Missing or invalid field: destination (IATA code)' };
  }

  if (!body.date || typeof body.date !== 'string') {
    return { valid: false, error: 'Missing or invalid field: date (YYYY-MM-DD)' };
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.date)) {
    return { valid: false, error: 'Invalid date format, expected YYYY-MM-DD' };
  }

  const cabinClasses = ['economy', 'premium_economy', 'business', 'first'];
  if (body.cabinClass && !cabinClasses.includes(body.cabinClass)) {
    return { valid: false, error: `Invalid cabinClass, must be one of: ${cabinClasses.join(', ')}` };
  }

  return {
    valid: true,
    data: {
      origin: body.origin.toUpperCase(),
      destination: body.destination.toUpperCase(),
      date: body.date,
      adults: body.adults || 1,
      cabinClass: body.cabinClass || 'economy',
      maxResults: Math.min(body.maxResults || 20, 50), // Cap at 50
      filters: body.filters,
      sortBy: body.sortBy,
    },
  };
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // =========================================================================
  // SECURITY: Rate Limiting
  // =========================================================================
  const rateLimitResult = checkRateLimit(request);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.allowed) {
    console.warn(`[RateLimit] IP blocked: ${request.headers.get('x-forwarded-for') || 'unknown'}`);
    return createRateLimitResponse(rateLimitResult.retryAfter!, rateLimitHeaders);
  }

  // =========================================================================
  // SECURITY: Request Size Limit
  // =========================================================================
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    console.warn(`[Security] Request too large: ${contentLength} bytes`);
    return createPayloadTooLargeResponse(MAX_REQUEST_SIZE / 1024, rateLimitHeaders);
  }

  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return createValidationErrorResponse(validation.error!, rateLimitHeaders);
    }

    const { origin, destination, date, adults, cabinClass, maxResults, filters, sortBy } = validation.data!;

    console.log(`[Search&Rank] ${origin} → ${destination} on ${date} (${cabinClass})`);
    if (filters) console.log('[Search&Rank] Filters applied:', filters);
    if (sortBy) console.log('[Search&Rank] Sort by:', sortBy);

    // =========================================================================
    // STEP 1: Search Kiwi API (WITH CACHING & QUEUING)
    // =========================================================================

    // Generate cache key from search parameters
    const cacheKey = flightCache.generateKey({
      origin,
      destination,
      date,
      adults,
      cabinClass,
      maxResults,
    });

    console.time('kiwi-search');
    const kiwiResults = await withCache(
      cacheKey,
      () =>
        queuedRequest(() =>
          kiwiService.searchFlights({
            fly_from: origin,
            fly_to: destination,
            date_from: date,
            date_to: date,
            adults: adults!,
            limit: maxResults!,
            sort: 'quality', // Get diverse options
          })
        )
    );
    console.timeEnd('kiwi-search');

    if (!kiwiResults || !kiwiResults.data || kiwiResults.data.length === 0) {
      return createJsonResponse({
        error: 'No flights found',
        message: `No flights available from ${origin} to ${destination} on ${date}`,
        flights: [],
        summary: {
          total: 0,
          optimal: 0,
          excellent: 0,
          good: 0,
          insights: [],
        },
      }, {
        status: 404,
        headers: rateLimitHeaders,
      });
    }

    console.log(`[Search&Rank] Found ${kiwiResults.data.length} flights from Kiwi`);

    // =========================================================================
    // STEP 2: Enrich with Database Intelligence
    // =========================================================================

    console.time('enrichment');
    let enrichedFlights: CompleteFlightOption[];

    try {
      enrichedFlights = await convertKiwiRoutesToCompleteFlights(
        kiwiResults.data as unknown as KiwiRoute[],
        cabinClass!
      );
      console.timeEnd('enrichment');
    } catch (enrichmentError) {
      console.error('[Search&Rank] Enrichment error:', enrichmentError);

      // Fallback: Return basic results without enrichment
      return NextResponse.json({
        error: 'Enrichment failed, returning basic results',
        flights: kiwiResults.data.slice(0, 10).map((flight: any, idx: number) => ({
          id: flight.id || `flight-${idx}`,
          jetlagScore: 50, // Neutral score
          recommendation: 'acceptable',
          estimatedRecoveryDays: 3,
          warning: 'Limited data available - scores may be inaccurate',
          flight: {
            origin: flight.flyFrom,
            destination: flight.flyTo,
            departure: flight.local_departure,
            arrival: flight.local_arrival,
            duration: Math.floor(flight.duration.total / 60),
            stops: flight.route.length - 1,
            price: flight.price,
            currency: flight.currency,
          },
        })),
        summary: {
          total: Math.min(kiwiResults.data.length, 10),
          optimal: 0,
          excellent: 0,
          good: 0,
          insights: ['Enrichment system temporarily unavailable - showing basic results'],
        },
      }, {
        status: 200,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          ...rateLimitHeaders,
        },
      });
    }

    // =========================================================================
    // STEP 3: Score with Holistic Scorer
    // =========================================================================

    console.time('scoring');
    const scoredFlights = enrichedFlights.map(flight => ({
      flight,
      score: scoreFlightHolistically(flight, enrichedFlights),
    }));
    console.timeEnd('scoring');

    // =========================================================================
    // STEP 4: Price vs Jetlag Analysis (NEW!)
    // =========================================================================

    console.time('price-analysis');
    const priceAnalysis = analyzePriceJetlagTradeoffs(scoredFlights);
    console.timeEnd('price-analysis');

    // Enrich each flight with value score and price category
    const enrichedWithPrice = scoredFlights.map(sf => ({
      ...sf,
      valueScore: priceAnalysis.flightCategories.get(sf.flight.id)?.valueScore || 0,
      priceCategory: priceAnalysis.flightCategories.get(sf.flight.id),
    }));

    // =========================================================================
    // STEP 5: Apply Filters (NEW!)
    // =========================================================================

    let filteredFlights = enrichedWithPrice;
    let filterStats = null;

    if (filters) {
      console.time('filtering');
      const filterResult = applyFilters(enrichedWithPrice, filters);
      filteredFlights = filterResult.filteredFlights;
      filterStats = filterResult.stats;
      console.timeEnd('filtering');
      console.log(`[Search&Rank] Filtered: ${filterStats.originalCount} → ${filterStats.filteredCount}`);
    }

    // =========================================================================
    // STEP 6: Apply Sorting (NEW!)
    // =========================================================================

    let rankedFlights = filteredFlights;

    if (sortBy) {
      console.time('sorting');
      rankedFlights = sortFlights(filteredFlights, sortBy);
      console.timeEnd('sorting');
      console.log(`[Search&Rank] Sorted by: ${sortBy}`);
    } else {
      // Default: Sort by jetlag score (best first)
      rankedFlights = filteredFlights.sort(
        (a, b) => b.score.overallJetlagScore - a.score.overallJetlagScore
      );
    }

    // =========================================================================
    // STEP 7: Generate Filter Suggestions for UX (NEW!)
    // =========================================================================

    const filterSuggestions = getFilterSuggestions(enrichedWithPrice);

    // =========================================================================
    // STEP 8: Generate Summary & Insights
    // =========================================================================

    const summary = generateSummary(rankedFlights);
    const insights = generateInsights(rankedFlights, origin, destination);

    // =========================================================================
    // STEP 9: Format Response (ENHANCED!)
    // =========================================================================

    const response = {
      success: true,
      flights: rankedFlights.map(({ flight, score, valueScore, priceCategory }) =>
        formatFlightResponseEnhanced(flight, score, valueScore, priceCategory, priceAnalysis)
      ),

      // NEW: Price optimization data (UX gold!)
      priceAnalysis: {
        cheapest: priceAnalysis.cheapestOption
          ? {
              id: priceAnalysis.cheapestOption.flight.id,
              price: priceAnalysis.cheapestOption.flight.price,
              jetlagScore: priceAnalysis.cheapestOption.score.overallJetlagScore,
            }
          : null,
        bestJetlag: priceAnalysis.bestJetlagOption
          ? {
              id: priceAnalysis.bestJetlagOption.flight.id,
              price: priceAnalysis.bestJetlagOption.flight.price,
              jetlagScore: priceAnalysis.bestJetlagOption.score.overallJetlagScore,
            }
          : null,
        bestValue: priceAnalysis.bestValueOption
          ? {
              id: priceAnalysis.bestValueOption.flight.id,
              price: priceAnalysis.bestValueOption.flight.price,
              jetlagScore: priceAnalysis.bestValueOption.score.overallJetlagScore,
              valueScore: priceAnalysis.flightCategories.get(priceAnalysis.bestValueOption.flight.id)?.valueScore,
            }
          : null,
        balanced: priceAnalysis.balancedOption
          ? {
              id: priceAnalysis.balancedOption.flight.id,
              price: priceAnalysis.balancedOption.flight.price,
              jetlagScore: priceAnalysis.balancedOption.score.overallJetlagScore,
            }
          : null,
        priceRange: priceAnalysis.priceRange,
        jetlagRange: priceAnalysis.jetlagRange,
      },

      // NEW: Filter statistics (UX feedback)
      filterStats: filterStats || {
        originalCount: enrichedWithPrice.length,
        filteredCount: enrichedWithPrice.length,
        removedByFilter: {},
      },

      // NEW: Smart filter suggestions (UX recommendations)
      filterSuggestions,

      summary: {
        ...summary,
        insights,
      },

      metadata: {
        searchedAt: new Date().toISOString(),
        route: `${origin} → ${destination}`,
        date,
        cabinClass,
        resultsCount: rankedFlights.length,
        filtersApplied: !!filters,
        sortedBy: sortBy || 'jetlag-best',
        processingTimeMs: Date.now() - startTime,
        cacheStats: getCacheStats(),
      },
    };

    const endTime = Date.now();
    console.log(`[Search&Rank] Complete in ${endTime - startTime}ms`);

    // =========================================================================
    // RETURN: Standardized response with all security headers + Content-Length
    // =========================================================================
    return createJsonResponse(response, {
      status: 200,
      headers: rateLimitHeaders,
      cacheControl: 'public, s-maxage=300, stale-while-revalidate=600', // Cache 5 min
    });

  } catch (error: any) {
    console.error('[Search&Rank] Error:', error);

    // =========================================================================
    // CLEANUP: Ensure resources are freed (helps prevent memory leaks)
    // =========================================================================
    if (global.gc) {
      try {
        global.gc();
      } catch (gcError) {
        // GC not available in this environment
      }
    }

    return createErrorResponse(
      error.message || 'Failed to search and rank flights',
      {
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        headers: rateLimitHeaders,
      }
    );
  }
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

function formatFlightResponse(flight: CompleteFlightOption, score: HolisticFlightScore) {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  return {
    id: flight.id,

    // Jetlag optimization data
    jetlagScore: Math.round(score.overallJetlagScore),
    recommendation: score.recommendation,
    estimatedRecoveryDays: parseFloat(score.estimatedRecoveryDays.toFixed(1)),

    // Score breakdown
    scores: {
      circadian: Math.round(score.circadianScore),
      comfort: Math.round(score.comfortScore),
      strategy: Math.round(score.strategyScore),
      efficiency: Math.round(score.efficiencyScore),
    },

    // Guidance
    strengths: score.strengths,
    weaknesses: score.weaknesses,
    criticalFactors: score.criticalFactors,
    recommendations: score.recommendations,

    // Tradeoff analysis
    tradeoffs: score.tradeoffs,

    // Scenario matching
    scenarios: score.scenarios,
    userPersona: score.userPersona,

    // Basic flight info
    flight: {
      origin: flight.origin,
      destination: flight.destination,
      departure: firstSegment.departureTime.toISOString(),
      arrival: lastSegment.arrivalTime.toISOString(),
      duration: flight.totalDurationMinutes,
      stops: flight.stops,
      price: flight.price,
      currency: flight.currency,

      // Enriched details
      segments: flight.segments.map(s => ({
        origin: s.origin,
        destination: s.destination,
        departure: s.departureTime.toISOString(),
        arrival: s.arrivalTime.toISOString(),
        flightNumber: s.flightNumber,
        aircraft: {
          type: s.aircraft.type,
          manufacturer: s.aircraft.manufacturer,
          sleepScore: s.aircraft.sleepScore,
          generation: s.aircraft.generation,
          cabinPressure: s.aircraft.cabinPressure,
          cabinHumidity: s.aircraft.cabinHumidity,
        },
        airline: {
          code: s.airline.code,
          name: s.airline.name,
          serviceQuality: s.airline.serviceQuality,
          jetlagScore: s.airline.jetlagOptimizationScore,
        },
        cabinClass: s.cabinClass,
      })),

      layovers: flight.layovers?.map(l => ({
        airport: l.airport,
        durationMinutes: l.durationMinutes,
        facilities: l.facilities,
      })),
    },
  };
}

function generateSummary(rankedFlights: Array<{ flight: CompleteFlightOption; score: HolisticFlightScore }>) {
  return {
    total: rankedFlights.length,
    optimal: rankedFlights.filter(f => f.score.recommendation === 'optimal').length,
    excellent: rankedFlights.filter(f => f.score.recommendation === 'excellent').length,
    good: rankedFlights.filter(f => f.score.recommendation === 'good').length,
    acceptable: rankedFlights.filter(f => f.score.recommendation === 'acceptable').length,
    poor: rankedFlights.filter(f => f.score.recommendation === 'poor').length,
    bestScore: rankedFlights[0]?.score.overallJetlagScore || 0,
    averageScore: rankedFlights.reduce((sum, f) => sum + f.score.overallJetlagScore, 0) / rankedFlights.length,
    bestRecoveryDays: rankedFlights[0]?.score.estimatedRecoveryDays || 0,
  };
}

function generateInsights(
  rankedFlights: Array<{ flight: CompleteFlightOption; score: HolisticFlightScore }>,
  origin: string,
  destination: string
): string[] {
  const insights: string[] = [];

  if (rankedFlights.length === 0) return insights;

  const best = rankedFlights[0];
  const worst = rankedFlights[rankedFlights.length - 1];

  // Recovery time spread
  const recoverySpread = worst.score.estimatedRecoveryDays - best.score.estimatedRecoveryDays;
  if (recoverySpread >= 1.5) {
    insights.push(
      `Best flight recovers ${recoverySpread.toFixed(1)} days faster than worst option`
    );
  }

  // Direct vs layover analysis
  const directFlights = rankedFlights.filter(f => f.flight.stops === 0);
  const layoverFlights = rankedFlights.filter(f => f.flight.stops > 0);

  if (directFlights.length > 0 && layoverFlights.length > 0) {
    const bestDirect = directFlights[0];
    const bestLayover = layoverFlights[0];

    if (bestLayover.score.overallJetlagScore > bestDirect.score.overallJetlagScore + 5) {
      insights.push(
        `Strategic layovers score ${(bestLayover.score.overallJetlagScore - bestDirect.score.overallJetlagScore).toFixed(0)} points higher than direct flights`
      );
    }
  }

  // Price vs jetlag tradeoff
  const withPrices = rankedFlights.filter(f => f.flight.price);
  if (withPrices.length > 1) {
    const cheapest = withPrices.reduce((min, f) =>
      (f.flight.price || Infinity) < (min.flight.price || Infinity) ? f : min
    );

    if (best.flight.id !== cheapest.flight.id && best.flight.price && cheapest.flight.price) {
      const priceDiff = best.flight.price - cheapest.flight.price;
      const recoveryDiff = cheapest.score.estimatedRecoveryDays - best.score.estimatedRecoveryDays;

      if (recoveryDiff > 0.5) {
        const dollarPerDay = priceDiff / recoveryDiff;
        insights.push(
          `Best jetlag option costs $${priceDiff.toFixed(0)} more but saves ${recoveryDiff.toFixed(1)} days recovery ($${dollarPerDay.toFixed(0)}/day)`
        );
      }
    }
  }

  // Direction-specific insight
  const direction = best.score.components.departureTimingScore > 50 ?
    (best.flight.segments[0].departureTime.getHours() >= 12 ? 'eastward' : 'westward') : 'unknown';

  if (direction !== 'unknown') {
    insights.push(
      `${direction === 'eastward' ? 'Eastward' : 'Westward'} travel detected - ${direction === 'eastward' ? 'overnight' : 'day'} flights recommended`
    );
  }

  return insights;
}
