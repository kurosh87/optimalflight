/**
 * Kiwi API → Holistic Scorer Integration Adapter (Optimized)
 *
 * Transforms Kiwi API responses into CompleteFlightOption objects
 * with LLM-generated database intelligence
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Batch queries (60+ queries → 4 queries)
 * - In-memory caching with LRU cache
 * - 3-tier fallback strategy (DB → Generate → Defaults)
 * - Never fails on missing data
 */

import { db } from '@/lib/db';
import {
  aircraftRankings,
  airlineServiceRankings,
  airportJetlagFacilities,
  airports
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type {
  CompleteFlightOption,
  FlightSegmentComplete,
  AircraftCharacteristics,
  AirlineCharacteristics,
} from './holistic-scorer';

// Import optimization modules
import { batchGetFlightEnrichmentData } from './batch-queries';
import {
  getCachedAircraft,
  setCachedAircraft,
  getCachedAirline,
  setCachedAirline,
  getCachedAirport,
  setCachedAirport,
  recordCacheHit,
  recordCacheMiss,
  type AirportData,
} from './cache-manager';
import {
  getDefaultAircraft,
  getDefaultAirline,
  getDefaultAirportFacilities,
  createFallbackResult,
  logFallbackUsage,
  type FallbackResult,
} from './fallback-strategies';

// ENHANCED: Import airport intelligence from jetlag_facts table
import { getAirportIntelligence } from '@/lib/airport-intel/airport-intelligence';
import { airportIntelToFacilities } from '@/lib/airport-intel/holistic-integration';

// ============================================================================
// OPTIMIZED DATABASE MAPPERS WITH CACHING & FALLBACKS
// ============================================================================

/**
 * Map aircraft from database to holistic scorer format
 * With 3-tier fallback: Cache → DB → Defaults
 */
export async function getAircraftCharacteristics(
  iataCode: string
): Promise<FallbackResult<AircraftCharacteristics>> {
  // TIER 1: Check cache first
  const cached = getCachedAircraft(iataCode);
  if (cached) {
    recordCacheHit('aircraft');
    return createFallbackResult(cached, 'database');
  }

  recordCacheMiss('aircraft');

  // TIER 2: Query database
  try {
    const dbRecord = await db
      .select()
      .from(aircraftRankings)
      .where(eq(aircraftRankings.iataCode, iataCode))
      .limit(1);

    if (dbRecord.length > 0) {
      const record = dbRecord[0];
      const characteristics = mapDbToAircraft(record);

      // Cache for future
      setCachedAircraft(iataCode, characteristics);
      logFallbackUsage('aircraft', iataCode, 'database');

      return createFallbackResult(characteristics, 'database');
    }
  } catch (error) {
    console.error(`[Adapter] DB error for aircraft ${iataCode}:`, error);
  }

  // TIER 3: Use smart defaults
  const defaults = getDefaultAircraft(iataCode);
  setCachedAircraft(iataCode, defaults); // Cache defaults too
  logFallbackUsage('aircraft', iataCode, 'default');

  return createFallbackResult(
    defaults,
    'default',
    `Aircraft ${iataCode} not in database, using conservative defaults`
  );
}

/**
 * Map airline from database to holistic scorer format
 * With 3-tier fallback: Cache → DB → Defaults
 */
export async function getAirlineCharacteristics(
  iataCode: string
): Promise<FallbackResult<AirlineCharacteristics>> {
  // TIER 1: Cache
  const cached = getCachedAirline(iataCode);
  if (cached) {
    recordCacheHit('airlines');
    return createFallbackResult(cached, 'database');
  }

  recordCacheMiss('airlines');

  // TIER 2: Database
  try {
    const dbRecord = await db
      .select()
      .from(airlineServiceRankings)
      .where(eq(airlineServiceRankings.iataCode, iataCode))
      .limit(1);

    if (dbRecord.length > 0) {
      const record = dbRecord[0];
      const characteristics = mapDbToAirline(record);

      setCachedAirline(iataCode, characteristics);
      logFallbackUsage('airline', iataCode, 'database');

      return createFallbackResult(characteristics, 'database');
    }
  } catch (error) {
    console.error(`[Adapter] DB error for airline ${iataCode}:`, error);
  }

  // TIER 3: Defaults
  const defaults = getDefaultAirline(iataCode);
  setCachedAirline(iataCode, defaults);
  logFallbackUsage('airline', iataCode, 'default');

  return createFallbackResult(
    defaults,
    'default',
    `Airline ${iataCode} not in database, using regional defaults`
  );
}

/**
 * Get airport facilities and timezone
 * ENHANCED: Now uses GPT-5 airport intelligence from jetlag_facts table
 * With 4-tier fallback: Cache → GPT-5 Intelligence → Legacy DB → Defaults
 */
export async function getAirportFacilities(
  iataCode: string
): Promise<FallbackResult<AirportData>> {
  // TIER 1: Cache
  const cached = getCachedAirport(iataCode);
  if (cached) {
    recordCacheHit('airports');
    return createFallbackResult(cached, 'database');
  }

  recordCacheMiss('airports');

  // TIER 2: GPT-5 Airport Intelligence (NEW - prioritized over legacy data)
  try {
    const intelligence = await getAirportIntelligence(iataCode);

    if (intelligence) {
      // Get timezone from airports table
      const airportRecord = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, iataCode))
        .limit(1);

      const timezone = airportRecord[0]?.timezone || 'UTC';

      // Convert intelligence to AirportData format using holistic integration
      const facilitiesFromIntel = airportIntelToFacilities(intelligence);

      const airportData: AirportData = {
        timezone,
        airportQualityScore: facilitiesFromIntel.jetlagSupportScore,
        facilities: {
          // Core recovery facilities from GPT-5 intelligence
          sleepPods: facilitiesFromIntel.sleepPods,
          showers: facilitiesFromIntel.showers,
          outdoorAccess: facilitiesFromIntel.quietZones || false, // GPT-5 doesn't have outdoor data yet, use quiet zones as proxy
          loungeAccess: facilitiesFromIntel.loungeAccess,
          quietZones: facilitiesFromIntel.quietZones,

          // Additional recovery facilities from GPT-5
          gyms: facilitiesFromIntel.gyms,
          spas: facilitiesFromIntel.spas,
          meditationRooms: facilitiesFromIntel.meditationRooms,
          healthyFoodAvailable: facilitiesFromIntel.healthyFoodAvailable,

          // Quality metrics from GPT-5 (ENHANCED - actual lounge quality scores!)
          loungeQuality: facilitiesFromIntel.loungeQuality, // 0-10 scale from GPT-5
          naturalLightQuality: facilitiesFromIntel.naturalLightQuality,

          // Stress factors from GPT-5 connection complexity
          securityWaitMinutes: facilitiesFromIntel.securityWaitMinutes,
          terminalDistanceMeters: facilitiesFromIntel.terminalDistanceMeters,
          noiseLevel: facilitiesFromIntel.noiseLevel,
          wifiQuality: facilitiesFromIntel.wifiQuality,

          // Operating hours (not in GPT-5 data yet)
          facilityHours: facilitiesFromIntel.facilityHours,
          peakCongestionHours: facilitiesFromIntel.peakCongestionHours,
        },
      };

      setCachedAirport(iataCode, airportData);
      logFallbackUsage('airport', iataCode, 'database');
      console.log(`[Adapter] ✅ Using GPT-5 intelligence for ${iataCode} (lounge quality: ${intelligence.loungeQualityScore}/10, connection complexity: ${intelligence.connectionComplexityScore}/10)`);

      return createFallbackResult(airportData, 'database', 'Using GPT-5 airport intelligence');
    }
  } catch (error) {
    console.error(`[Adapter] Error fetching GPT-5 intelligence for ${iataCode}:`, error);
    // Continue to legacy fallback
  }

  // TIER 3: Legacy Database (fallback if no GPT-5 intelligence)
  try {
    const [facilityRecord, airportRecord] = await Promise.all([
      db
        .select()
        .from(airportJetlagFacilities)
        .where(eq(airportJetlagFacilities.iataCode, iataCode))
        .limit(1),
      db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, iataCode))
        .limit(1),
    ]);

    if (airportRecord.length > 0) {
      const facility = facilityRecord[0];
      const airport = airportRecord[0];

      const airportData: AirportData = {
        timezone: airport.timezone || 'UTC',
        // Use jetlagSupportScore (focused on recovery) instead of overallScore
        airportQualityScore: facility?.jetlagSupportScore || 6,
        facilities: {
          // Core recovery facilities
          sleepPods: facility?.hasSleepPods || false,
          showers: facility?.hasShowerFacilities || false,
          outdoorAccess: facility?.hasNaturalLightAreas || false,
          loungeAccess: true,
          quietZones: facility?.hasQuietZones || false,

          // Additional recovery facilities
          gyms: facility?.hasExerciseFacilities || false,
          spas: facility?.hasSpaServices || false,
          meditationRooms: facility?.hasMeditationRooms || false,
          healthyFoodAvailable: facility?.hasHealthyFoodOptions || false,

          // Quality metrics (LEGACY - old lounge quality data)
          loungeQuality: facility?.loungeQualityAvg || undefined,
          naturalLightQuality: facility?.hasNaturalLightAreas ?
            (facility?.jetlagSupportScore ? Math.min(10, facility.jetlagSupportScore) : 7) :
            undefined,

          // Stress factors
          securityWaitMinutes: facility?.averageSecurityWaitMinutes || undefined,
          terminalDistanceMeters: facility?.terminalWalkingDistanceAvgMeters || undefined,
          noiseLevel: (facility?.noiseLevel as 'quiet' | 'moderate' | 'loud') || undefined,
          wifiQuality: facility?.wifiQualityScore ? facility.wifiQualityScore / 10 : undefined,

          // Operating hours
          facilityHours: facility?.facilityHours || undefined,
          peakCongestionHours: facility?.peakCongestionHours || undefined,
        },
      };

      setCachedAirport(iataCode, airportData);
      logFallbackUsage('airport', iataCode, 'database');
      console.log(`[Adapter] ⚠️ Using LEGACY data for ${iataCode} (no GPT-5 intelligence available)`);

      return createFallbackResult(airportData, 'database');
    }
  } catch (error) {
    console.error(`[Adapter] DB error for airport ${iataCode}:`, error);
  }

  // TIER 4: Defaults
  const defaults = {
    timezone: 'UTC',
    ...getDefaultAirportFacilities(iataCode),
  };
  setCachedAirport(iataCode, defaults);
  logFallbackUsage('airport', iataCode, 'default');
  console.log(`[Adapter] ⚠️ Using DEFAULTS for ${iataCode} (no data available)`);

  return createFallbackResult(
    defaults,
    'default',
    `Airport ${iataCode} not in database, using hub-based defaults`
  );
}

// ============================================================================
// DATABASE RECORD MAPPERS
// ============================================================================

function mapDbToAircraft(record: typeof aircraftRankings.$inferSelect): AircraftCharacteristics {
  return {
    type: record.iataCode,
    manufacturer: record.manufacturer || 'Other',
    cabinPressure: record.cabinPressureAltitudeFeet,
    cabinHumidity: record.humidityPercent,
    noiseLevel: record.noiseLevelDb,
    seatPitch: record.typicalSeatPitchInches ?? undefined,
    windowSize: record.windowSizeSqIn ?? undefined,
    sleepScore: record.jetlagBaseScore,
    generation: inferGeneration(record.firstFlightYear),
  };
}

function mapDbToAirline(record: typeof airlineServiceRankings.$inferSelect): AirlineCharacteristics {
  // Determine sleep kit quality based on amenities
  let sleepKitQuality: 'none' | 'basic' | 'premium' = 'none';
  if (record.providesSleepKits) {
    sleepKitQuality = (record.serviceScore || 5) >= 8 ? 'premium' : 'basic';
  }

  return {
    code: record.iataCode,
    name: record.airlineName,
    serviceQuality: record.serviceScore,
    mealQuality: record.mealQualityRating ?? undefined,
    onTimePerformance: record.onTimePerformancePercent ?? undefined,
    jetlagOptimizationScore: record.jetlagAwarenessScore,
    providesAmenities: record.providesSleepKits || false,
    sleepKitQuality,
    lightingProtocols: undefined, // Not yet in database schema
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function inferAisleWidth(model: string): 'narrow' | 'standard' | 'wide' {
  const narrowBody = ['737', '320', '321', '757', '220'];
  const wideBody = ['777', '787', '350', '330', '380', '747', '340'];

  if (narrowBody.some(type => model.includes(type))) return 'narrow';
  if (wideBody.some(type => model.includes(type))) return 'wide';
  return 'standard';
}

function inferGeneration(firstFlightYear: number | null): 'legacy' | 'modern' | 'next-gen' {
  if (!firstFlightYear) return 'modern';
  if (firstFlightYear < 2000) return 'legacy';
  if (firstFlightYear < 2010) return 'modern';
  return 'next-gen';
}

// ============================================================================
// KIWI API TYPES
// ============================================================================

export interface KiwiRoute {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  local_departure: string;
  utc_departure: string;
  local_arrival: string;
  utc_arrival: string;
  duration: { total: number }; // seconds
  distance: number; // km
  airlines: string[];
  route: Array<{
    flyFrom: string;
    flyTo: string;
    airline: string;
    flight_no: number;
    equipment?: string | null;
    local_departure: string;
    local_arrival: string;
    utc_departure: string;
    utc_arrival: string;
  }>;
  price?: number;
  currency?: string;
  deep_link?: string; // Kiwi.com booking URL
  booking_token?: string; // Booking token for Kiwi API
}

// ============================================================================
// OPTIMIZED BATCH CONVERSION
// ============================================================================

/**
 * Transform Kiwi route to CompleteFlightOption (OPTIMIZED)
 *
 * Uses batch queries to fetch all enrichment data in one go
 * Expected: 30x faster than naive implementation
 */
export async function kiwiRouteToCompleteFlightOption(
  kiwiRoute: KiwiRoute,
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first' = 'economy'
): Promise<CompleteFlightOption> {
  console.time(`enrich-flight-${kiwiRoute.id}`);

  // Extract all unique codes for batch query
  const segments = kiwiRoute.route.map(leg => ({
    aircraftCode: leg.equipment || 'unknown',
    airlineCode: leg.airline,
    originCode: leg.flyFrom,
    destinationCode: leg.flyTo,
  }));

  // BATCH QUERY: Fetch ALL enrichment data in 4 queries (instead of N×3)
  const enrichmentData = await batchGetFlightEnrichmentData(segments);

  // Build enriched segments using batch data
  const enrichedSegments: FlightSegmentComplete[] = await Promise.all(
    kiwiRoute.route.map(async (leg, idx) => {
      const aircraftCode = leg.equipment || 'unknown';
      const airlineCode = leg.airline || 'UNKNOWN';

      // O(1) lookup from batch results
      let aircraftDb = enrichmentData.aircraft.get(aircraftCode);
      let airlineDb = enrichmentData.airlines.get(airlineCode);
      let originAirport = enrichmentData.airports.get(leg.flyFrom);
      let destAirport = enrichmentData.airports.get(leg.flyTo);
      let originFacilities = enrichmentData.facilities.get(leg.flyFrom);
      let destFacilities = enrichmentData.facilities.get(leg.flyTo);

      // Fallback to defaults if not in batch results
      const aircraft = aircraftDb
        ? mapDbToAircraft(aircraftDb)
        : getDefaultAircraft(aircraftCode);

      const airline = airlineDb
        ? mapDbToAirline(airlineDb)
        : getDefaultAirline(airlineCode);

      const originTimezone = originAirport?.timezone || 'UTC';
      const destinationTimezone = destAirport?.timezone || 'UTC';

      // Calculate segment duration
      const depTime = new Date(leg.local_departure);
      const arrTime = new Date(leg.local_arrival);
      const durationMinutes = (arrTime.getTime() - depTime.getTime()) / 60000;

      // Estimate distance for this segment
      const segmentDistance = kiwiRoute.distance / kiwiRoute.route.length;

      // Seat specs based on cabin class
      const seatSpecs = getSeatSpecifications(cabinClass, aircraft);

      // Safely construct flight number
      const flightNo = leg.flight_no || '';
      const flightNumber = (airlineCode && airlineCode !== 'UNKNOWN' && flightNo)
        ? `${airlineCode}${flightNo}`
        : `${leg.flyFrom}-${leg.flyTo}`;

      return {
        origin: leg.flyFrom,
        destination: leg.flyTo,
        originTimezone,
        destinationTimezone,
        departureTime: depTime,
        arrivalTime: arrTime,
        durationMinutes,
        distance: segmentDistance,
        aircraft,
        airline,
        flightNumber,
        cabinClass,
        ...seatSpecs,
      };
    })
  );

  // Build layover data if multi-segment
  const layovers = [];
  if (enrichedSegments.length > 1) {
    for (let i = 0; i < enrichedSegments.length - 1; i++) {
      const currentSegment = enrichedSegments[i];
      const nextSegment = enrichedSegments[i + 1];

      const layoverDuration =
        (nextSegment.departureTime.getTime() - currentSegment.arrivalTime.getTime()) / 60000;

      // ENHANCED: Prioritize GPT-5 intelligence over legacy facilities
      const intelligence = enrichmentData.intelligence?.get(currentSegment.destination);
      const airportFacilities = enrichmentData.facilities.get(currentSegment.destination);

      if (intelligence) {
        // Use GPT-5 intelligence for enhanced layover data
        const facilitiesFromIntel = airportIntelToFacilities(intelligence);
        layovers.push({
          airport: currentSegment.destination,
          durationMinutes: layoverDuration,
          airportQualityScore: facilitiesFromIntel.jetlagSupportScore,
          facilities: {
            sleepPods: facilitiesFromIntel.sleepPods,
            showers: facilitiesFromIntel.showers,
            outdoorAccess: facilitiesFromIntel.outdoorAccess,
            loungeAccess: facilitiesFromIntel.loungeAccess,
            quietZones: facilitiesFromIntel.quietZones,
            gyms: facilitiesFromIntel.gyms,
            spas: facilitiesFromIntel.spas,
            meditationRooms: facilitiesFromIntel.meditationRooms,
            healthyFoodAvailable: facilitiesFromIntel.healthyFoodAvailable,
            loungeQuality: facilitiesFromIntel.loungeQuality, // GPT-5 lounge quality score!
            naturalLightQuality: facilitiesFromIntel.naturalLightQuality,
            securityWaitMinutes: facilitiesFromIntel.securityWaitMinutes,
            terminalDistanceMeters: facilitiesFromIntel.terminalDistanceMeters,
            noiseLevel: facilitiesFromIntel.noiseLevel,
            wifiQuality: facilitiesFromIntel.wifiQuality,
            facilityHours: facilitiesFromIntel.facilityHours,
            peakCongestionHours: facilitiesFromIntel.peakCongestionHours,
          },
          recommendedLayoverDurationHours: undefined,
        });
      } else {
        // Fallback to legacy facilities data
        layovers.push({
          airport: currentSegment.destination,
          durationMinutes: layoverDuration,
          airportQualityScore: airportFacilities?.overallScore || 6,
          facilities: {
            sleepPods: airportFacilities?.hasSleepPods || false,
            showers: airportFacilities?.hasShowerFacilities || false,
            outdoorAccess: airportFacilities?.hasNaturalLightAreas || false,
            loungeAccess: true,
          },
          recommendedLayoverDurationHours: undefined,
        });
      }
    }
  }

  console.timeEnd(`enrich-flight-${kiwiRoute.id}`);

  // Calculate total duration from segments if not provided by API
  let totalDurationMinutes: number;
  if (kiwiRoute.duration?.total) {
    totalDurationMinutes = kiwiRoute.duration.total / 60;
  } else {
    // Fallback: calculate from first segment departure to last segment arrival
    const firstSegment = enrichedSegments[0];
    const lastSegment = enrichedSegments[enrichedSegments.length - 1];
    totalDurationMinutes = (lastSegment.arrivalTime.getTime() - firstSegment.departureTime.getTime()) / (1000 * 60);
    console.warn(`[Adapter] Missing duration.total for ${kiwiRoute.id}, calculated ${totalDurationMinutes}min from segments`);
  }

  return {
    id: kiwiRoute.id,
    segments: enrichedSegments,
    layovers: layovers.length > 0 ? layovers : undefined,
    origin: kiwiRoute.flyFrom,
    destination: kiwiRoute.flyTo,
    totalDurationMinutes,
    stops: kiwiRoute.route.length - 1,
    price: kiwiRoute.price || 0,
    currency: kiwiRoute.currency || 'USD',
    bookingLink: kiwiRoute.deep_link,
  };
}

/**
 * Convert single Kiwi route using pre-fetched enrichment data (OPTIMIZED)
 * This version skips the batch query step since data is already provided
 */
export async function kiwiRouteToCompleteFlightOptionWithData(
  kiwiRoute: KiwiRoute,
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first' = 'economy',
  enrichmentData: Awaited<ReturnType<typeof batchGetFlightEnrichmentData>>
): Promise<CompleteFlightOption> {
  // Build enriched segments using provided batch data (no database call!)
  const enrichedSegments: FlightSegmentComplete[] = await Promise.all(
    kiwiRoute.route.map(async (leg, idx) => {
      const aircraftCode = leg.equipment || 'unknown';
      const airlineCode = leg.airline || 'UNKNOWN';

      // O(1) lookup from batch results
      let aircraftDb = enrichmentData.aircraft.get(aircraftCode);
      let airlineDb = enrichmentData.airlines.get(airlineCode);
      let originAirport = enrichmentData.airports.get(leg.flyFrom);
      let destAirport = enrichmentData.airports.get(leg.flyTo);

      // Fallback to defaults if not in batch results
      const aircraft = aircraftDb
        ? mapDbToAircraft(aircraftDb)
        : getDefaultAircraft(aircraftCode);

      const airline = airlineDb
        ? mapDbToAirline(airlineDb)
        : getDefaultAirline(airlineCode);

      const originTimezone = originAirport?.timezone || 'UTC';
      const destinationTimezone = destAirport?.timezone || 'UTC';

      // Calculate segment duration
      const depTime = new Date(leg.local_departure);
      const arrTime = new Date(leg.local_arrival);
      const durationMinutes = (arrTime.getTime() - depTime.getTime()) / 60000;

      // Estimate distance for this segment
      const segmentDistance = kiwiRoute.distance / kiwiRoute.route.length;

      // Seat specs based on cabin class
      const seatSpecs = getSeatSpecifications(cabinClass, aircraft);

      // Safely construct flight number
      const flightNo = leg.flight_no || '';
      const flightNumber = (airlineCode && airlineCode !== 'UNKNOWN' && flightNo)
        ? `${airlineCode}${flightNo}`
        : `${leg.flyFrom}-${leg.flyTo}`;

      return {
        origin: leg.flyFrom,
        destination: leg.flyTo,
        originTimezone,
        destinationTimezone,
        departureTime: depTime,
        arrivalTime: arrTime,
        durationMinutes,
        distance: segmentDistance,
        aircraft,
        airline,
        flightNumber,
        cabinClass,
        ...seatSpecs,
      };
    })
  );

  // Build layover data if multi-segment
  const layovers = [];
  if (enrichedSegments.length > 1) {
    for (let i = 0; i < enrichedSegments.length - 1; i++) {
      const currentSegment = enrichedSegments[i];
      const nextSegment = enrichedSegments[i + 1];

      const layoverDuration =
        (nextSegment.departureTime.getTime() - currentSegment.arrivalTime.getTime()) / 60000;

      // ENHANCED: Prioritize GPT-5 intelligence over legacy facilities
      const intelligence = enrichmentData.intelligence?.get(currentSegment.destination);
      const airportFacilities = enrichmentData.facilities.get(currentSegment.destination);

      if (intelligence) {
        // Use GPT-5 intelligence for enhanced layover data
        const facilitiesFromIntel = airportIntelToFacilities(intelligence);
        layovers.push({
          airport: currentSegment.destination,
          durationMinutes: layoverDuration,
          airportQualityScore: facilitiesFromIntel.jetlagSupportScore,
          facilities: {
            sleepPods: facilitiesFromIntel.sleepPods,
            showers: facilitiesFromIntel.showers,
            outdoorAccess: facilitiesFromIntel.outdoorAccess,
            loungeAccess: facilitiesFromIntel.loungeAccess,
            quietZones: facilitiesFromIntel.quietZones,
            gyms: facilitiesFromIntel.gyms,
            spas: facilitiesFromIntel.spas,
            meditationRooms: facilitiesFromIntel.meditationRooms,
            healthyFoodAvailable: facilitiesFromIntel.healthyFoodAvailable,
            loungeQuality: facilitiesFromIntel.loungeQuality, // GPT-5 lounge quality score!
            naturalLightQuality: facilitiesFromIntel.naturalLightQuality,
            securityWaitMinutes: facilitiesFromIntel.securityWaitMinutes,
            terminalDistanceMeters: facilitiesFromIntel.terminalDistanceMeters,
            noiseLevel: facilitiesFromIntel.noiseLevel,
            wifiQuality: facilitiesFromIntel.wifiQuality,
            facilityHours: facilitiesFromIntel.facilityHours,
            peakCongestionHours: facilitiesFromIntel.peakCongestionHours,
          },
          recommendedLayoverDurationHours: undefined,
        });
      } else {
        // Fallback to legacy facilities data
        layovers.push({
          airport: currentSegment.destination,
          durationMinutes: layoverDuration,
          airportQualityScore: airportFacilities?.overallScore || 6,
          facilities: {
            sleepPods: airportFacilities?.hasSleepPods || false,
            showers: airportFacilities?.hasShowerFacilities || false,
            outdoorAccess: airportFacilities?.hasNaturalLightAreas || false,
            loungeAccess: true,
          },
          recommendedLayoverDurationHours: undefined,
        });
      }
    }
  }

  // Calculate total duration from segments if not provided by API
  let totalDurationMinutes: number;
  if (kiwiRoute.duration?.total) {
    totalDurationMinutes = kiwiRoute.duration.total / 60;
  } else {
    // Fallback: calculate from first segment departure to last segment arrival
    const firstSegment = enrichedSegments[0];
    const lastSegment = enrichedSegments[enrichedSegments.length - 1];
    totalDurationMinutes = (lastSegment.arrivalTime.getTime() - firstSegment.departureTime.getTime()) / (1000 * 60);
  }

  return {
    id: kiwiRoute.id,
    segments: enrichedSegments,
    layovers: layovers.length > 0 ? layovers : undefined,
    origin: kiwiRoute.flyFrom,
    destination: kiwiRoute.flyTo,
    totalDurationMinutes,
    stops: kiwiRoute.route.length - 1,
    price: kiwiRoute.price || 0,
    currency: kiwiRoute.currency || 'USD',
    bookingLink: kiwiRoute.deep_link,
  };
}

/**
 * Get seat specifications based on cabin class and aircraft
 */
function getSeatSpecifications(
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first',
  aircraft: AircraftCharacteristics
) {
  const specs: Record<typeof cabinClass, { seatPitch: number; seatWidth: number; seatRecline: number; lie_flat: boolean }> = {
    economy: { seatPitch: 31, seatWidth: 17, seatRecline: 20, lie_flat: false },
    premium_economy: { seatPitch: 38, seatWidth: 18.5, seatRecline: 35, lie_flat: false },
    business: { seatPitch: 60, seatWidth: 21, seatRecline: 180, lie_flat: true },
    first: { seatPitch: 80, seatWidth: 23, seatRecline: 180, lie_flat: true },
  };

  const bonus = aircraft.generation === 'next-gen' ? 1 : 0;
  const base = specs[cabinClass];

  return {
    seatPitch: base.seatPitch + bonus,
    seatWidth: base.seatWidth + bonus * 0.5,
    seatRecline: base.seatRecline,
    lie_flat: base.lie_flat,
  };
}

/**
 * Batch convert multiple Kiwi routes (OPTIMIZED)
 */
export async function convertKiwiRoutesToCompleteFlights(
  kiwiRoutes: KiwiRoute[],
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first' = 'economy'
): Promise<CompleteFlightOption[]> {
  console.time('convert-all-flights');
  console.log(`[Adapter] Converting ${kiwiRoutes.length} Kiwi routes to CompleteFlightOptions`);

  // OPTIMIZATION: Collect ALL unique codes from ALL routes FIRST
  // This prevents redundant database queries for shared airports/airlines/aircraft
  const allSegments = kiwiRoutes.flatMap(route =>
    route.route.map(leg => ({
      aircraftCode: leg.equipment || 'unknown',
      airlineCode: leg.airline || 'UNKNOWN',
      originCode: leg.flyFrom,
      destinationCode: leg.flyTo,
    }))
  );

  console.time('batch-enrichment-all-routes');
  console.log(`[Adapter] Batch enriching ${allSegments.length} segments from ${kiwiRoutes.length} routes`);

  // Make ONE mega-batch query for ALL routes
  const sharedEnrichmentData = await batchGetFlightEnrichmentData(allSegments);

  console.timeEnd('batch-enrichment-all-routes');
  console.log(`[Adapter] Enrichment complete - ${sharedEnrichmentData.aircraft.size} aircraft, ${sharedEnrichmentData.airlines.size} airlines, ${sharedEnrichmentData.airports.size} airports`);

  // Now convert all routes in parallel using the shared enrichment data
  const results = await Promise.all(
    kiwiRoutes.map(route => kiwiRouteToCompleteFlightOptionWithData(route, cabinClass, sharedEnrichmentData))
  );

  console.timeEnd('convert-all-flights');
  return results;
}
