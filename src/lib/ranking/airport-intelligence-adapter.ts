/**
 * Airport Intelligence → Holistic Scorer Adapter
 *
 * Transforms airport_intelligence database records into AirportFacilities format
 * expected by holistic-scorer.ts
 *
 * DATA MAPPING:
 * - jetlag_recovery_data → sleepPods, showers, gyms, spas, meditation
 * - lounges_data → loungeAccess, loungeQuality
 * - navigation_data → stress factors (security wait, terminal distance, noise)
 *
 * SMART DEFAULTS:
 * - Missing data gets intelligent defaults based on airport tier
 * - Conservative approach: Better to underestimate than hallucinate
 */

import type { AirportFacilities } from './holistic-scorer';
import { db } from '@/lib/db';
import { airportData } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

// Database schema types (from airport_data unified table)
export interface AirportIntelligenceDB {
  iataCode: string;
  airportName?: string;
  tier: 'tier_1' | 'tier_2' | 'tier_3';
  dataQuality?: 'verified' | 'partial' | 'minimal';

  // JSONB fields
  jetlagRecoveryData?: {
    sleepPodQualityScore?: number;
    sleepPodProvider?: string | null;
    showerQualityScore?: number;
    showerCount?: number | null;
    hasSleepSeating?: boolean;
    hasHealthyFood?: boolean;
  };

  loungesData?: {
    overallQuality?: number | null;
    hasPremiumLounges?: boolean;
    hasShowers?: boolean | null;
    notableLounges?: string[];
    bestForJetlag?: string | null;
  };

  navigationData?: {
    complexityScore?: number;
    minimumConnectionTime?: number;
    requiresTerminalChange?: boolean;
    terminalChangeMethod?: string | null;
    challenges?: string[];
    tips?: string | null;
  };
}

/**
 * Convert airport intelligence DB record to AirportFacilities format
 *
 * @param dbRecord Airport intelligence from database
 * @param layoverDurationMinutes Actual layover duration (for context-aware defaults)
 * @returns AirportFacilities object for holistic scorer
 */
export function mapAirportIntelligenceToFacilities(
  dbRecord: AirportIntelligenceDB,
  layoverDurationMinutes?: number
): AirportFacilities {
  const jetlag = dbRecord.jetlagRecoveryData || {};
  const lounges = dbRecord.loungesData || {};
  const nav = dbRecord.navigationData || {};

  // ============================================================================
  // CORE RECOVERY FACILITIES
  // ============================================================================

  // Sleep pods: Available if provider is mentioned (not null/undefined)
  const sleepPods = !!jetlag.sleepPodProvider && jetlag.sleepPodProvider !== 'null';

  // Showers: Check both jetlag and lounge data
  const showers = !!(jetlag.showerCount && jetlag.showerCount > 0) || lounges.hasShowers === true;

  // Outdoor access: Not in current schema - use conservative default
  // TODO: Add to next LLM generation batch
  const outdoorAccess = false;  // Conservative: assume no outdoor access unless verified

  // Quiet zones: Infer from sleep seating or premium lounges
  const quietZones = jetlag.hasSleepSeating === true || lounges.hasPremiumLounges === true;

  // Lounge access: Any lounge data present
  const loungeAccess = lounges.hasPremiumLounges === true || (lounges.notableLounges && lounges.notableLounges.length > 0);

  // ============================================================================
  // ADDITIONAL RECOVERY FACILITIES (NEW)
  // ============================================================================

  // Gyms: Not in current schema - use tier-based default
  // Tier 1 airports likely have gyms, others assume not
  const gyms = dbRecord.tier === 'tier_1' ? false : false;  // Conservative: no gyms unless verified

  // Spas: Premium lounges might have spa services
  const spas = lounges.hasPremiumLounges === true && lounges.overallQuality && lounges.overallQuality >= 8;

  // Meditation rooms: Not in schema - assume false
  const meditationRooms = false;

  // Healthy food: From jetlag recovery data
  const healthyFoodAvailable = jetlag.hasHealthyFood === true;

  // ============================================================================
  // QUALITY METRICS
  // ============================================================================

  // Lounge quality: Convert 0-10 scale if available
  const loungeQuality = lounges.overallQuality ?? undefined;

  // Natural light quality: Not in schema - infer from outdoor access
  const naturalLightQuality = outdoorAccess ? 7 : undefined;  // If outdoor access exists, assume good light

  // ============================================================================
  // STRESS FACTORS
  // ============================================================================

  // Security wait: Infer from complexity score
  // Higher complexity = longer wait times (rough heuristic)
  let securityWaitMinutes: number | undefined;
  if (nav.complexityScore !== undefined) {
    // complexity 1-3 = 15min, 4-6 = 25min, 7-10 = 40min
    if (nav.complexityScore <= 3) securityWaitMinutes = 15;
    else if (nav.complexityScore <= 6) securityWaitMinutes = 25;
    else securityWaitMinutes = 40;
  }

  // Terminal distance: Infer from terminal change requirement
  let terminalDistanceMeters: number | undefined;
  if (nav.requiresTerminalChange) {
    // Terminal change = at least 400m walk
    // Bus transfer = even longer (800m equivalent in time)
    if (nav.terminalChangeMethod === 'bus') {
      terminalDistanceMeters = 800;
    } else if (nav.terminalChangeMethod === 'walking') {
      terminalDistanceMeters = 400;
    } else {
      terminalDistanceMeters = 600;  // Default moderate distance
    }
  }

  // Noise level: Infer from quiet zones and tier
  let noiseLevel: 'quiet' | 'moderate' | 'loud' | undefined;
  if (quietZones) {
    noiseLevel = 'quiet';
  } else if (dbRecord.tier === 'tier_3') {
    noiseLevel = 'moderate';  // Smaller airports usually quieter
  } else {
    noiseLevel = 'moderate';  // Large airports = moderate noise
  }

  // WiFi quality: Tier-based default
  // Tier 1 = excellent (9), Tier 2 = good (7), Tier 3 = basic (5)
  let wifiQuality: number | undefined;
  if (dbRecord.tier === 'tier_1') wifiQuality = 9;
  else if (dbRecord.tier === 'tier_2') wifiQuality = 7;
  else wifiQuality = 5;

  // ============================================================================
  // OPERATING HOURS (TODO - Add to schema)
  // ============================================================================

  // facilityHours: Not in schema yet - would need LLM enhancement
  const facilityHours = undefined;

  // ============================================================================
  // CONGESTION TIMING (TODO - Add to schema)
  // ============================================================================

  // peakCongestionHours: Not in schema yet - would need LLM enhancement
  const peakCongestionHours = undefined;

  return {
    // Core facilities
    sleepPods,
    showers,
    outdoorAccess,
    outdoorAccessRequiresResecurity: false,  // Conservative default
    loungeAccess,
    quietZones,

    // Additional facilities
    gyms,
    spas,
    meditationRooms,
    healthyFoodAvailable,

    // Quality metrics
    loungeQuality,
    naturalLightQuality,

    // Stress factors
    securityWaitMinutes,
    terminalDistanceMeters,
    noiseLevel,
    wifiQuality,

    // Operating hours (future enhancement)
    facilityHours,

    // Congestion timing (future enhancement)
    peakCongestionHours,
  };
}

/**
 * Get airport intelligence for holistic scoring
 *
 * This is the main function that integrates with the database
 *
 * @param iataCode Airport IATA code
 * @param layoverDurationMinutes Actual layover duration (optional, for context)
 * @returns AirportFacilities object or null if not found
 */
export async function getAirportFacilitiesForScoring(
  iataCode: string,
  layoverDurationMinutes?: number
): Promise<AirportFacilities | null> {
  try {
    const result = await db
      .select()
      .from(airportData)
      .where(eq(airportData.iataCode, iataCode))
      .limit(1);

    if (result.length === 0) return null;

    const record = result[0];

    // Convert database record to adapter format
    // Note: JSON fields are stored as text but need parsing
    const parseJsonField = (field: string | null | undefined) => {
      if (!field) return undefined;
      if (typeof field === 'object') return field; // Already parsed by Drizzle
      try {
        return JSON.parse(field);
      } catch {
        return undefined;
      }
    };

    const dbRecord: AirportIntelligenceDB = {
      iataCode: record.iataCode || '',
      airportName: record.airportSummary || undefined,
      tier: (record.tier || 'tier_3') as 'tier_1' | 'tier_2' | 'tier_3',
      dataQuality: (record.dataQuality || 'minimal') as 'verified' | 'partial' | 'minimal',
      jetlagRecoveryData: parseJsonField(record.jetlagRecoveryData),
      loungesData: parseJsonField(record.loungesData),
      navigationData: parseJsonField(record.navigationData),
    };

    return mapAirportIntelligenceToFacilities(dbRecord, layoverDurationMinutes);
  } catch (error) {
    console.error(`Error fetching airport facilities for ${iataCode}:`, error);
    return null;
  }
}

/**
 * Batch fetch airport facilities for multiple airports
 *
 * @param iataCodes Array of airport IATA codes
 * @param layoverDurations Optional map of IATA → duration in minutes
 * @returns Map of IATA code → AirportFacilities
 */
export async function getAirportFacilitiesBatch(
  iataCodes: string[],
  layoverDurations?: Map<string, number>
): Promise<Map<string, AirportFacilities>> {
  const results = new Map<string, AirportFacilities>();

  if (iataCodes.length === 0) return results;

  try {
    const dbResults = await db
      .select()
      .from(airportData)
      .where(inArray(airportData.iataCode, iataCodes));

    // Helper to parse JSON fields (handles both string and object formats)
    const parseJsonField = (field: string | null | undefined | object) => {
      if (!field) return undefined;
      if (typeof field === 'object') return field; // Already parsed by Drizzle
      try {
        return JSON.parse(field);
      } catch {
        return undefined;
      }
    };

    for (const record of dbResults) {
      // Convert database record to adapter format
      const dbRecord: AirportIntelligenceDB = {
        iataCode: record.iataCode || '',
        airportName: record.airportSummary || undefined,
        tier: (record.tier || 'tier_3') as 'tier_1' | 'tier_2' | 'tier_3',
        dataQuality: (record.dataQuality || 'minimal') as 'verified' | 'partial' | 'minimal',
        jetlagRecoveryData: parseJsonField(record.jetlagRecoveryData),
        loungesData: parseJsonField(record.loungesData),
        navigationData: parseJsonField(record.navigationData),
      };

      const duration = layoverDurations?.get(record.iataCode || '');
      const facilities = mapAirportIntelligenceToFacilities(dbRecord, duration);

      if (record.iataCode) {
        results.set(record.iataCode, facilities);
      }
    }
  } catch (error) {
    console.error('Error batch fetching airport facilities:', error);
  }

  return results;
}

// ============================================================================
// DATA QUALITY HELPERS
// ============================================================================

/**
 * Get confidence level for airport facilities data
 *
 * @param dbRecord Airport intelligence from database
 * @returns Confidence level (0-1)
 */
export function getAirportDataConfidence(dbRecord: AirportIntelligenceDB): number {
  // Verified data = high confidence
  if (dbRecord.dataQuality === 'verified') return 0.95;

  // Tier 1/2 with partial data = medium confidence
  if (dbRecord.tier === 'tier_1' || dbRecord.tier === 'tier_2') {
    return dbRecord.dataQuality === 'partial' ? 0.75 : 0.60;
  }

  // Tier 3 = conservative confidence (as expected)
  return 0.50;
}

/**
 * Count how many facilities are available at this airport
 *
 * @param facilities AirportFacilities object
 * @returns Count of available facilities
 */
export function countAvailableFacilities(facilities: AirportFacilities): number {
  let count = 0;

  if (facilities.sleepPods) count++;
  if (facilities.showers) count++;
  if (facilities.outdoorAccess) count++;
  if (facilities.loungeAccess) count++;
  if (facilities.quietZones) count++;
  if (facilities.gyms) count++;
  if (facilities.spas) count++;
  if (facilities.meditationRooms) count++;
  if (facilities.healthyFoodAvailable) count++;

  return count;
}

/**
 * Get human-readable facility summary
 *
 * @param facilities AirportFacilities object
 * @returns String describing available facilities
 */
export function getFacilitySummary(facilities: AirportFacilities): string {
  const available: string[] = [];

  if (facilities.sleepPods) available.push('sleep pods');
  if (facilities.showers) available.push('showers');
  if (facilities.loungeAccess) available.push('lounges');
  if (facilities.gyms) available.push('gyms');
  if (facilities.spas) available.push('spa');
  if (facilities.quietZones) available.push('quiet zones');
  if (facilities.outdoorAccess) available.push('outdoor access');

  if (available.length === 0) return 'Limited facilities';
  if (available.length === 1) return available[0];
  if (available.length === 2) return `${available[0]} and ${available[1]}`;

  return `${available.slice(0, -1).join(', ')}, and ${available[available.length - 1]}`;
}
