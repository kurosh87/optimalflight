/**
 * Unified Flight Search Service
 *
 * Orchestrates Kiwi + Amadeus APIs with comprehensive jetlag scoring
 * Architecture:
 * 1. Query routing (determine best API for request)
 * 2. Search execution (Kiwi for discovery, Amadeus for specific flights)
 * 3. Scoring (comprehensive jetlag algorithm)
 * 4. Ranking (sort by jetlag score)
 * 5. Caching (1-hour TTL for search results)
 */

import crypto from 'crypto';
import { kiwiService, type KiwiFlightOption } from './kiwiSearch';
import { searchFlightByNumber } from '@/lib/amadeus';
import { calculateComprehensiveJetlagScore, type FlightDetails, type CircadianContext, type JetlagScoreResult, type UserProfile } from '@/lib/ranking/comprehensive-jetlag-scorer';
import { db } from '@/lib/db';
import { flightSearchCache, apiUsageLogs, airports, aircraftRankings, airlineServiceRankings, airportJetlagFacilities } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface UnifiedSearchParams {
  from: string;              // City name or IATA code
  to: string;                // City name or IATA code
  departureDate?: string;    // YYYY-MM-DD
  flexibility?: 'exact' | '±3days' | '±7days' | 'anytime';
  maxStopovers?: number;
  preferDirect?: boolean;
  maxDuration?: number;      // hours
  userProfile?: UserProfile;
}

export interface ScoredFlight {
  // Flight details
  id: string;
  airline: string;
  flightNumber?: string;
  aircraft?: string;

  // Route
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: number;          // minutes

  // Connections
  stops: number;
  layovers?: Array<{
    airport: string;
    duration: number;        // minutes
  }>;

  // Pricing
  price: number;
  currency: string;
  bookingLink: string;

  // Jetlag Scores
  jetlagScore: number;       // 0-10 (our calculation)
  recoveryDays: number;
  severity: string;
  description: string;
  breakdown: {
    aircraft: number;
    airline: number;
    route: number;
    timing: number;
    airport: number;
    duration: number;
  };
  recommendations: string[];

  // Rankings
  rank: number;              // 1-based ranking

  // Source
  dataSource: 'kiwi' | 'amadeus';
  rawData: any;              // Original API response
}

export class UnifiedFlightSearchService {

  /**
   * Main search function - intelligently routes to Kiwi or Amadeus
   */
  async searchFlights(params: UnifiedSearchParams): Promise<ScoredFlight[]> {
    // Check cache first
    const cacheKey = this.generateCacheKey(params);
    const cached = await this.getCachedResults(cacheKey);

    if (cached) {
      console.log('[UnifiedSearch] Returning cached results');
      return cached;
    }

    // Use Kiwi for route discovery (better for optimization)
    console.log('[UnifiedSearch] Searching with Kiwi Tequila...');
    const searchStartTime = Date.now();

    try {
      const kiwiResults = await kiwiService.searchFlights({
        flyFrom: this.normalizeLocation(params.from),
        flyTo: this.normalizeLocation(params.to),
        dateFrom: params.departureDate || undefined,
        dateTo: this.calculateDateTo(params.departureDate, params.flexibility),
        maxStopovers: params.preferDirect ? 0 : (params.maxStopovers || 2),
        maxFlyDuration: params.maxDuration,
      });

      // Score and rank flights
      const scoredFlights = await this.scoreFlights(kiwiResults.data, params);

      // Sort by jetlag score (best first)
      scoredFlights.sort((a, b) => b.jetlagScore - a.jetlagScore);

      // Assign rankings
      scoredFlights.forEach((flight, index) => {
        flight.rank = index + 1;
      });

      // Cache results
      const searchDuration = Date.now() - searchStartTime;
      await this.cacheResults(cacheKey, scoredFlights, searchDuration, params);

      // Log API usage
      await this.logApiUsage('kiwi', 'search', params, scoredFlights.length, searchDuration);

      console.log(`[UnifiedSearch] Completed in ${searchDuration}ms - ${scoredFlights.length} flights scored`);

      return scoredFlights;
    } catch (error) {
      console.error('[UnifiedSearch] Search error:', error);
      throw error;
    }
  }

  /**
   * Lookup specific flight by number (use Amadeus)
   */
  async lookupFlightByNumber(
    flightNumber: string,
    date?: string,
    userProfile?: UserProfile
  ): Promise<ScoredFlight | null> {
    console.log(`[UnifiedSearch] Looking up flight ${flightNumber} with Amadeus...`);

    try {
      const amadeusResult = await searchFlightByNumber(flightNumber, date || new Date().toISOString().split('T')[0]);

      if (!amadeusResult) {
        return null;
      }

      // Score the flight
      const scored = await this.scoreFlights([{
        id: flightNumber,
        airline: amadeusResult.airline,
        origin: amadeusResult.originCode,
        destination: amadeusResult.destinationCode,
        departure: amadeusResult.departureTime,
        arrival: amadeusResult.arrivalTime,
        aircraft: amadeusResult.aircraft?.type,
        price: 0,
        bookingLink: '',
        dataSource: 'amadeus',
        rawData: amadeusResult,
      }], { from: amadeusResult.originCode, to: amadeusResult.destinationCode, userProfile });

      return scored[0] || null;
    } catch (error) {
      console.error('[UnifiedSearch] Flight lookup error:', error);
      return null;
    }
  }

  /**
   * Score flights with comprehensive jetlag algorithm
   */
  private async scoreFlights(
    flights: any[],
    params: Partial<UnifiedSearchParams>
  ): Promise<ScoredFlight[]> {
    const scored: ScoredFlight[] = [];

    for (const flight of flights) {
      try {
        // Parse flight details
        const flightDetails = this.parseFlightDetails(flight);

        // Get circadian context
        const circadian = await this.calculateCircadianContext(
          flightDetails.origin,
          flightDetails.destination,
          flightDetails.departure,
          flightDetails.arrival
        );

        // Look up aircraft, airline, airport scores from database
        const [aircraft, airline, originAirport, destAirport] = await Promise.all([
          this.getAircraftData(flightDetails.aircraft),
          this.getAirlineData(flightDetails.airline),
          this.getAirportData(flightDetails.origin),
          this.getAirportData(flightDetails.destination),
        ]);

        // Get layover airport if applicable
        const layoverAirport = flightDetails.layovers?.[0]
          ? await this.getAirportData(flightDetails.layovers[0].airport)
          : undefined;

        // Calculate comprehensive jetlag score
        const jetlagResult = calculateComprehensiveJetlagScore({
          flight: flightDetails,
          circadian,
          aircraft: aircraft || undefined,
          airline: airline || undefined,
          originAirport,
          destAirport,
          layoverAirport,
          userProfile: params.userProfile,
        });

        // Build scored flight object
        scored.push({
          id: flight.id || this.generateFlightId(flight),
          airline: flightDetails.airline,
          flightNumber: flightDetails.flightNumber,
          aircraft: flightDetails.aircraft,
          origin: flightDetails.origin,
          destination: flightDetails.destination,
          departure: flightDetails.departure,
          arrival: flightDetails.arrival,
          duration: flightDetails.duration,
          stops: flightDetails.stops,
          layovers: flightDetails.layovers,
          price: flight.price || 0,
          currency: flight.currency || 'USD',
          bookingLink: flight.deep_link || flight.bookingLink || '',
          jetlagScore: jetlagResult.score,
          recoveryDays: jetlagResult.recoveryDays,
          severity: jetlagResult.severity,
          description: jetlagResult.description,
          breakdown: jetlagResult.breakdown,
          recommendations: jetlagResult.recommendations,
          rank: 0, // Will be set after sorting
          dataSource: flight.dataSource || 'kiwi',
          rawData: flight,
        });
      } catch (error) {
        console.error('[UnifiedSearch] Error scoring flight:', error);
        // Skip flights that fail scoring
      }
    }

    return scored;
  }

  /**
   * Parse flight details from Kiwi or Amadeus format
   */
  private parseFlightDetails(flight: any): FlightDetails {
    // Handle Kiwi format
    if (flight.route && Array.isArray(flight.route)) {
      const firstLeg = flight.route[0];
      const lastLeg = flight.route[flight.route.length - 1];

      const layovers = flight.route.length > 1
        ? flight.route.slice(0, -1).map((leg: any, index: number) => {
            const nextLeg = flight.route[index + 1];
            const layoverDuration =
              (new Date(nextLeg.local_departure).getTime() -
               new Date(leg.local_arrival).getTime()) / 60000; // minutes

            return {
              airport: leg.flyTo,
              duration: layoverDuration,
            };
          })
        : [];

      return {
        flightNumber: firstLeg.flight_no ? `${firstLeg.airline}${firstLeg.flight_no}` : '',
        airline: firstLeg.airline,
        aircraft: firstLeg.equipment,
        origin: firstLeg.flyFrom,
        destination: lastLeg.flyTo,
        departure: firstLeg.local_departure,
        arrival: lastLeg.local_arrival,
        duration: flight.duration?.total ? flight.duration.total / 60 : 0,
        stops: flight.route.length - 1,
        layovers,
      };
    }

    // Handle Amadeus/simplified format
    return {
      flightNumber: flight.flightNumber || '',
      airline: flight.airline,
      aircraft: flight.aircraft,
      origin: flight.origin,
      destination: flight.destination,
      departure: flight.departure,
      arrival: flight.arrival,
      duration: flight.duration || 0,
      stops: flight.stops || 0,
      layovers: flight.layovers,
    };
  }

  /**
   * Calculate circadian context (timezone shift, direction, etc.)
   */
  private async calculateCircadianContext(
    originCode: string,
    destCode: string,
    departure: string,
    arrival: string
  ): Promise<CircadianContext> {
    // Get airport data for timezone info
    const [origin, dest] = await Promise.all([
      db.select().from(airports).where(eq(airports.iataCode, originCode)).limit(1),
      db.select().from(airports).where(eq(airports.iataCode, destCode)).limit(1),
    ]);

    const originAirport = origin[0];
    const destAirport = dest[0];

    // Calculate timezone shift
    const originOffset = this.getTimezoneOffset(originAirport?.timezone || 'UTC');
    const destOffset = this.getTimezoneOffset(destAirport?.timezone || 'UTC');
    const hoursDiff = Math.abs(destOffset - originOffset);

    // Determine direction
    let direction: 'eastbound' | 'westbound' | 'neutral' = 'neutral';
    if (hoursDiff > 2) {
      direction = destOffset > originOffset ? 'eastbound' : 'westbound';
    }

    // Check if crosses dateline
    const crossesDateline =
      (originAirport?.longitude || 0) > 150 && (destAirport?.longitude || 0) < -150 ||
      (originAirport?.longitude || 0) < -150 && (destAirport?.longitude || 0) > 150;

    // Extract local hours
    const depDate = new Date(departure);
    const arrDate = new Date(arrival);
    const departureLocalHour = depDate.getUTCHours();
    const arrivalLocalHour = arrDate.getUTCHours();

    return {
      timezoneShift: hoursDiff,
      direction,
      crossesDateline,
      departureTime: `${depDate.getHours().toString().padStart(2, '0')}:${depDate.getMinutes().toString().padStart(2, '0')}`,
      arrivalTime: `${arrDate.getHours().toString().padStart(2, '0')}:${arrDate.getMinutes().toString().padStart(2, '0')}`,
      departureLocalHour,
      arrivalLocalHour,
    };
  }

  /**
   * Get timezone offset in hours
   */
  private getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      return (tz.getTime() - utc.getTime()) / 3600000;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get aircraft data from database
   */
  private async getAircraftData(aircraftCode?: string) {
    if (!aircraftCode) return null;

    const result = await db.select()
      .from(aircraftRankings)
      .where(eq(aircraftRankings.iataCode, aircraftCode))
      .limit(1);

    const aircraft = result[0];
    if (!aircraft || !aircraft.generation) return null;

    // Map generation to jetlagScore
    const generationScoreMap: Record<string, number> = {
      'nextgen': 10,
      'modern': 7,
      'legacy': 4,
      'old': 2,
      'exclude': 1,
    };

    const jetlagScore = generationScoreMap[aircraft.generation] || 5;

    return {
      iataCode: aircraft.iataCode,
      generation: aircraft.generation as 'nextgen' | 'modern' | 'legacy' | 'old' | 'exclude',
      jetlagScore,
    };
  }

  /**
   * Get airline data from database
   * Filters out defunct airlines to show only active ones
   */
  private async getAirlineData(airlineCode: string) {
    const result = await db.select()
      .from(airlineServiceRankings)
      .where(
        and(
          eq(airlineServiceRankings.iataCode, airlineCode),
          eq(airlineServiceRankings.airlineStatus, 'active')  // Only active airlines
        )
      )
      .limit(1);

    const airline = result[0];
    if (!airline) return null;

    return {
      iataCode: airline.iataCode,
      airlineName: airline.airlineName,
      mealQualityRating: airline.mealQualityRating || undefined,
      mealTimingFlexibility: airline.mealTimingFlexibility || undefined,
      providesSleepKits: airline.providesSleepKits || undefined,
      sleepKitQuality: airline.sleepKitQuality as any,
      cabinCrewTrainingScore: airline.cabinCrewTrainingScore || undefined,
      onTimePerformancePercent: airline.onTimePerformancePercent || undefined,
      delayMinutesAvg: airline.delayMinutesAvg || undefined,
      cancellationRatePercent: airline.cancellationRatePercent || undefined,
      offersJetlagMenu: airline.offersJetlagMenu || undefined,
      lightManagementStrategy: airline.lightManagementStrategy || undefined,
      sleepOptimizationPrograms: airline.sleepOptimizationPrograms || undefined,
      melatoninAvailable: airline.melatoninAvailable || undefined,
      seatComfortRating: airline.seatComfortRating || undefined,
      entertainmentQuality: airline.entertainmentQuality || undefined,
    };
  }

  /**
   * Get airport quality data
   */
  private async getAirportData(airportCode: string) {
    const result = await db.select()
      .from(airportJetlagFacilities)
      .where(eq(airportJetlagFacilities.iataCode, airportCode))
      .limit(1);

    const airport = result[0];
    if (!airport) return undefined;

    return {
      code: airportCode,
      hasRecoveryFacilities: airport.hasSleepPods || airport.hasShowerFacilities || false,
      stressScore: airport.stressScore,
      jetlagSupportScore: airport.jetlagSupportScore,
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(params: UnifiedSearchParams): string {
    const str = JSON.stringify({
      from: params.from,
      to: params.to,
      date: params.departureDate,
      flex: params.flexibility,
    });
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Get cached results
   */
  private async getCachedResults(cacheKey: string): Promise<ScoredFlight[] | null> {
    try {
      const cached = await db.select()
        .from(flightSearchCache)
        .where(
          and(
            eq(flightSearchCache.searchHash, cacheKey),
            gt(flightSearchCache.expiresAt, new Date())
          )
        )
        .limit(1);

      if (cached.length === 0) return null;

      return JSON.parse(cached[0].results);
    } catch (error) {
      console.error('[UnifiedSearch] Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Cache results
   */
  private async cacheResults(
    cacheKey: string,
    results: ScoredFlight[],
    searchDurationMs: number,
    params: UnifiedSearchParams
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

      await db.insert(flightSearchCache).values({
        id: crypto.randomUUID(),
        searchHash: cacheKey,
        origin: params.from,
        destination: params.to,
        departureDate: params.departureDate || null,
        flexibility: params.flexibility || null,
        dataSource: 'kiwi',
        results: JSON.stringify(results),
        resultCount: results.length,
        searchDurationMs,
        expiresAt,
      }).onConflictDoUpdate({
        target: flightSearchCache.searchHash,
        set: {
          results: JSON.stringify(results),
          resultCount: results.length,
          searchDurationMs,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('[UnifiedSearch] Cache storage error:', error);
    }
  }

  /**
   * Log API usage
   */
  private async logApiUsage(
    provider: 'kiwi' | 'amadeus',
    endpoint: string,
    params: any,
    resultCount: number,
    durationMs: number
  ): Promise<void> {
    try {
      await db.insert(apiUsageLogs).values({
        id: crypto.randomUUID(),
        apiProvider: provider,
        endpoint,
        requestParams: JSON.stringify(params),
        responseStatus: 200,
        responseDuration: durationMs,
        creditsUsed: provider === 'kiwi' ? 1 : undefined,
      });
    } catch (error) {
      console.error('[UnifiedSearch] API usage logging error:', error);
    }
  }

  /**
   * Normalize location (handle city names, airport codes)
   */
  private normalizeLocation(location: string): string {
    // If it's already an IATA code (3 letters), return as-is
    if (/^[A-Z]{3}$/.test(location)) {
      return location;
    }

    // Otherwise, prefix with 'city:' for Kiwi
    return `city:${location}`;
  }

  /**
   * Calculate date range based on flexibility
   */
  private calculateDateTo(dateFrom?: string, flexibility?: string): string | undefined {
    if (!dateFrom || !flexibility || flexibility === 'exact') {
      return dateFrom;
    }

    const date = new Date(dateFrom);

    if (flexibility === '±3days') {
      date.setDate(date.getDate() + 6);
    } else if (flexibility === '±7days') {
      date.setDate(date.getDate() + 14);
    } else if (flexibility === 'anytime') {
      date.setDate(date.getDate() + 60);
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Generate unique flight ID
   */
  private generateFlightId(flight: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(flight))
      .digest('hex')
      .substring(0, 16);
  }
}

// Export singleton
export const unifiedFlightSearch = new UnifiedFlightSearchService();
