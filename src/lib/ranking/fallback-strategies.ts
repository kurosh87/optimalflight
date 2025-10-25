/**
 * Fallback Strategies & Default Characteristics
 *
 * OVERVIEW:
 * This module implements a 3-tier fallback system for handling missing enrichment data
 * when scoring flights for jetlag mitigation. The system ensures the holistic scorer
 * never fails due to missing aircraft, airline, or airport information.
 *
 * 3-TIER FALLBACK HIERARCHY:
 * ┌─────────────┬──────────────┬────────────────┬──────────────────────────────┐
 * │ Tier        │ Source       │ Confidence     │ Method                       │
 * ├─────────────┼──────────────┼────────────────┼──────────────────────────────┤
 * │ TIER 1      │ LRU Cache    │ 95% (verified) │ In-memory cached data        │
 * │ TIER 2      │ Database     │ 95% (verified) │ PostgreSQL enrichment tables │
 * │ TIER 3      │ Smart Defaults│ 50% (inferred) │ Pattern-based inference      │
 * └─────────────┴──────────────┴────────────────┴──────────────────────────────┘
 *
 * PHILOSOPHY:
 * When database lookups fail, we use CONSERVATIVE DEFAULTS that:
 * - Don't artificially inflate or deflate jetlag scores
 * - Provide realistic middle-ground estimates
 * - Use pattern matching on IATA codes to infer characteristics
 * - Allow meaningful recommendations even with incomplete data
 *
 * PATTERN-BASED INFERENCE:
 * - Aircraft: Detect next-gen (787, A350), wide-body (777, A330), narrow-body (737, A320)
 * - Airlines: Categorize by region (Middle East premium, Asian premium, EU legacy, US majors, Budget)
 * - Airports: Classify by hub tier (Premium hubs, Major hubs, Regional)
 *
 * USAGE:
 * This module is called by kiwi-holistic-adapter.ts when enrichment queries fail:
 * 1. Try cache lookup (TIER 1)
 * 2. Try database query (TIER 2)
 * 3. Fall back to smart defaults (TIER 3) ← This module
 *
 * MONITORING:
 * - All fallback usage is logged via logFallbackUsage()
 * - Confidence scores are tracked in FallbackResult
 * - TODO: Send to analytics for data quality monitoring
 *
 * IMPLEMENTATION NOTE:
 * The system generates comprehensive AI-powered airport facility data (gyms, spas, meditation
 * rooms, healthy food, lounge quality, stress factors, etc.) but the holistic scorer currently
 * only uses simplified boolean flags (sleepPods, showers, outdoorAccess, lounges, quietZones).
 * See IMPLEMENTATION_GAPS.md for details on expanding the interface to utilize richer data.
 * The defaults here reflect this simplified interface until the gap is addressed.
 */

import type {
  AircraftCharacteristics,
  AirlineCharacteristics,
} from './holistic-scorer';

// ============================================================================
// DEFAULT AIRCRAFT CHARACTERISTICS
// ============================================================================

/**
 * Conservative defaults for unknown aircraft
 * Uses middle-of-road values that won't unfairly advantage or penalize
 *
 * IMPORTANT: These values are designed to be neutral/conservative so that:
 * - Missing aircraft data doesn't artificially inflate or deflate jetlag scores
 * - The holistic scorer can still provide meaningful recommendations
 * - Users get honest assessments even with incomplete data
 */
export const DEFAULT_AIRCRAFT: AircraftCharacteristics = {
  type: 'Unknown',
  manufacturer: 'Other',
  generation: 'modern',           // Conservative middle ground (not legacy, not next-gen)
  sleepScore: 6,                  // Slightly below average (0-10 scale)
  cabinPressure: 8000,            // Standard altitude in feet (not best, not worst)
  cabinHumidity: 12,              // Percentage - typical for older aircraft
  noiseLevel: 75,                 // Decibels - moderate noise level
  seatPitch: 31,                  // Economy standard
  windowSize: 100,                // Square inches - standard economy window
};

/**
 * Get default aircraft with type-specific adjustments
 *
 * Uses pattern matching on IATA codes to infer aircraft characteristics:
 * - Next-gen aircraft (787, A350, A220): Better cabin pressure, humidity, sleep scores
 * - Wide-body aircraft: Better sleep scores, more space
 * - Narrow-body: Standard regional/short-haul characteristics
 *
 * This ensures that even when database lookups fail, the scorer has reasonable
 * estimates based on the aircraft type.
 */
export function getDefaultAircraft(iataCode: string): AircraftCharacteristics {
  const code = iataCode.toUpperCase();

  // Narrow-body detection (single aisle): 737, A320, A321, 757, A220
  const narrowBodyPatterns = ['73', '32', '21', '75', '22'];
  const isNarrowBody = narrowBodyPatterns.some(p => code.includes(p));

  // Wide-body detection (twin aisle): 777, 787, A350, A330, A380, 747, A340
  const wideBodyPatterns = ['77', '78', '35', '33', '38', '74', '34'];
  const isWideBody = wideBodyPatterns.some(p => code.includes(p));

  // Next-gen aircraft detection (787, A350, A220, 789)
  const nextGenPatterns = ['78', '35', '22', '89'];
  const isNextGen = nextGenPatterns.some(p => code.includes(p));

  return {
    ...DEFAULT_AIRCRAFT,
    type: iataCode,
    generation: isNextGen ? 'next-gen' : 'modern',
    // Next-gen aircraft have significantly better jetlag characteristics
    cabinPressure: isNextGen ? 6000 : 8000,           // 6000ft vs 8000ft equivalent
    cabinHumidity: isNextGen ? 16 : 12,                // 16% vs 12%
    sleepScore: isNextGen ? 8 : isWideBody ? 7 : 6,   // Better for long-haul
    noiseLevel: isNextGen ? 65 : 75,                   // Quieter engines
    seatPitch: isWideBody ? 32 : 31,                   // Slightly more space
    windowSize: isWideBody ? 120 : 100,                // Larger windows
  };
}

// ============================================================================
// DEFAULT AIRLINE CHARACTERISTICS
// ============================================================================

/**
 * Conservative defaults for unknown airlines
 *
 * IMPORTANT: These values are designed to be neutral/conservative so that:
 * - Missing airline data doesn't skew jetlag scores unfairly
 * - Service quality assumptions are realistic for average carriers
 * - The jetlag optimizer can still provide useful guidance
 */
export const DEFAULT_AIRLINE: AirlineCharacteristics = {
  code: 'XX',
  name: 'Unknown Airline',
  serviceQuality: 6,                    // 0-10 scale, slightly below average
  mealQuality: 5,                       // 0-10 scale, average
  onTimePerformance: 75,                // 0-100%, industry average
  jetlagOptimizationScore: 5,           // 0-10 scale, neutral
  providesAmenities: true,              // Assume basic amenities (blanket, pillow)
  sleepKitQuality: 'basic',             // Conservative assumption
  lightingProtocols: undefined,         // Unknown lighting capabilities
};

/**
 * Get default airline with region-specific adjustments
 *
 * Uses carrier code patterns to infer service quality:
 * - Middle East carriers (EK, QR, EY): Premium service, jetlag-aware
 * - Asian premium carriers (SQ, NH, JL, CX): High service quality
 * - European legacy (BA, AF, LH, KL): Good service
 * - US majors (AA, DL, UA): Reliable but variable service
 * - Budget carriers (FR, U2, NK, F9): Lower service, fewer amenities
 *
 * This ensures realistic service assumptions even when database lookups fail.
 */
export function getDefaultAirline(iataCode: string): AirlineCharacteristics {
  // Handle undefined/null airline codes
  if (!iataCode || typeof iataCode !== 'string') {
    console.warn(`[getDefaultAirline] Invalid airline code: ${iataCode}, using generic defaults`);
    return {
      ...DEFAULT_AIRLINE,
      code: 'UNKNOWN',
      name: 'Unknown Airline',
    };
  }

  const code = iataCode.toUpperCase();

  // Regional quality reputation (rough heuristics based on industry data)

  // Middle East carriers: Often premium with jetlag-aware service
  const middleEastCarriers = ['EK', 'QR', 'EY', 'WY', 'GF'];
  const isMiddleEast = middleEastCarriers.includes(code);

  // Asian carriers: Often high service quality
  const asianCarriers = ['SQ', 'NH', 'JL', 'CX', 'TG', 'KE'];
  const isAsianPremium = asianCarriers.includes(code);

  // European legacy carriers: Generally good service
  const europeanLegacy = ['BA', 'AF', 'LH', 'KL', 'AZ', 'IB'];
  const isEuropeanLegacy = europeanLegacy.includes(code);

  // US carriers: Variable but reliable
  const usCarriers = ['AA', 'DL', 'UA'];
  const isUSMajor = usCarriers.includes(code);

  // Budget carriers: Lower service, minimal amenities
  const budgetCarriers = ['FR', 'U2', 'W6', 'NK', 'F9'];
  const isBudget = budgetCarriers.includes(code);

  // Adjust defaults based on carrier type
  if (isMiddleEast || isAsianPremium) {
    return {
      ...DEFAULT_AIRLINE,
      code: iataCode,
      name: 'Premium Carrier',
      serviceQuality: 8,                    // Premium service
      mealQuality: 7,                       // Better food
      onTimePerformance: 82,                // More reliable
      jetlagOptimizationScore: 7,           // Jetlag-aware practices
      providesAmenities: true,
      sleepKitQuality: 'premium',           // Premium amenities
      lightingProtocols: 'circadian-optimized', // Smart lighting systems (Qatar, Emirates, Singapore)
    };
  }

  if (isEuropeanLegacy || isUSMajor) {
    return {
      ...DEFAULT_AIRLINE,
      code: iataCode,
      name: 'Legacy Carrier',
      serviceQuality: 6.5,
      mealQuality: 5.5,
      onTimePerformance: 78,
      jetlagOptimizationScore: 5.5,
      providesAmenities: true,
      sleepKitQuality: 'basic',
      lightingProtocols: 'manual-dimming',  // Basic dimming controls
    };
  }

  if (isBudget) {
    return {
      ...DEFAULT_AIRLINE,
      code: iataCode,
      name: 'Budget Carrier',
      serviceQuality: 4.5,                  // Lower service
      mealQuality: 3,                       // Minimal or paid meals
      onTimePerformance: 70,                // Less reliable
      jetlagOptimizationScore: 3,           // No jetlag considerations
      providesAmenities: false,             // Minimal amenities
      sleepKitQuality: 'none',              // No sleep kits
      lightingProtocols: 'none',            // Standard cabin lighting only
    };
  }

  // Generic airline - use conservative defaults
  return {
    ...DEFAULT_AIRLINE,
    code: iataCode,
    name: 'Regional Carrier',
  };
}

// ============================================================================
// DEFAULT AIRPORT FACILITIES
// ============================================================================

/**
 * Conservative defaults for unknown airports
 *
 * IMPORTANT: These values are designed to be neutral/conservative so that:
 * - Missing airport data doesn't create unrealistic expectations
 * - Layover quality assumptions are realistic for average airports
 * - The jetlag optimizer doesn't overestimate layover recovery benefits
 *
 * FACILITY ASSUMPTIONS:
 * - sleepPods: false - Only premium hubs have these (SIN, DOH, DXB, etc.)
 * - showers: false - Not universally available, usually in premium lounges
 * - outdoorAccess: false - Rare in most airports, beneficial for jetlag recovery
 * - loungeAccess: true - Most airports have at least some lounge options
 *
 * QUALITY SCORE:
 * - 6/10 = Slightly below average
 * - Reflects typical regional airport experience
 * - Not penalizing, but not optimistic
 */
export const DEFAULT_AIRPORT_FACILITIES = {
  airportQualityScore: 6,         // Slightly below average (0-10 scale)
  facilities: {
    // Core recovery facilities
    sleepPods: false,             // Conservative - assume no premium facilities
    showers: false,               // Not standard in most airports
    outdoorAccess: false,         // Rare amenity, but valuable for jetlag
    outdoorAccessRequiresResecurity: undefined,  // Unknown - don't penalize
    loungeAccess: true,           // Most airports have some lounges
    quietZones: false,            // Not universal

    // Additional recovery facilities (NEW)
    gyms: false,                  // Rare amenity
    spas: false,                  // Premium hubs only
    meditationRooms: false,       // Not common
    healthyFoodAvailable: true,   // Most airports have some healthy options

    // Quality metrics (NEW - undefined when unknown)
    loungeQuality: undefined,     // Unknown - don't guess
    naturalLightQuality: undefined,

    // Stress factors (NEW - undefined when unknown)
    securityWaitMinutes: undefined,
    terminalDistanceMeters: undefined,
    noiseLevel: undefined,
    wifiQuality: undefined,

    // Operating hours (NEW - undefined = assume 24/7)
    facilityHours: undefined,

    // Congestion timing (NEW - undefined = no penalty)
    peakCongestionHours: undefined,
  },
};

/**
 * Get default airport facilities with hub-specific adjustments
 *
 * Uses airport code patterns to infer facility quality when database lookups fail.
 * This ensures realistic layover quality assumptions even with incomplete data.
 *
 * HUB CATEGORIZATION:
 *
 * PREMIUM HUBS (Score: 8/10):
 * - Asia-Pacific: SIN (Singapore), ICN (Seoul), HND/NRT (Tokyo), HKG (Hong Kong)
 * - Middle East: DOH (Doha), DXB (Dubai)
 * - Europe: MUC (Munich), ZRH (Zurich), FRA (Frankfurt), AMS (Amsterdam), CPH (Copenhagen)
 * - Facilities: Sleep pods, showers, outdoor access, premium lounges
 * - Jetlag benefit: Excellent for long layovers, recovery-focused amenities
 *
 * MAJOR HUBS (Score: 7/10):
 * - North America: JFK, LAX, ORD, DFW, ATL, YYZ, YVR
 * - Europe: LHR (London), CDG (Paris), MAD (Madrid), BCN (Barcelona)
 * - Oceania: SYD (Sydney), MEL (Melbourne)
 * - Facilities: Showers in lounges, decent lounges, no sleep pods
 * - Jetlag benefit: Good for layovers, but fewer recovery-focused amenities
 *
 * REGIONAL/UNKNOWN (Score: 6/10):
 * - All other airports
 * - Facilities: Basic lounges only
 * - Jetlag benefit: Limited recovery options during layovers
 *
 * This tiered approach ensures that layover quality is properly weighted in
 * the holistic scorer's Strategy dimension.
 */
export function getDefaultAirportFacilities(iataCode: string) {
  const code = iataCode.toUpperCase();

  // PREMIUM INTERNATIONAL HUBS
  // Known for exceptional facilities including sleep pods, showers, outdoor spaces
  // These airports actively support passenger wellbeing during long layovers
  const premiumHubs = [
    'SIN', 'DOH', 'DXB', 'ICN', 'HND', 'NRT',
    'HKG', 'MUC', 'ZRH', 'FRA', 'AMS', 'CPH'
  ];
  const isPremiumHub = premiumHubs.includes(code);

  // MAJOR INTERNATIONAL HUBS
  // Large hubs with good facilities, but typically lack sleep pods
  // Showers available in premium lounges, but not universally accessible
  const majorHubs = [
    'JFK', 'LAX', 'ORD', 'DFW', 'ATL',
    'LHR', 'CDG', 'MAD', 'BCN',
    'SYD', 'MEL', 'YYZ', 'YVR'
  ];
  const isMajorHub = majorHubs.includes(code);

  if (isPremiumHub) {
    return {
      airport: iataCode,
      airportQualityScore: 8,
      facilities: {
        // Core recovery facilities
        sleepPods: true,          // Premium hubs likely have these
        showers: true,
        outdoorAccess: true,
        outdoorAccessRequiresResecurity: false,  // Premium hubs designed for convenience
        loungeAccess: true,
        quietZones: true,

        // Additional recovery facilities
        gyms: true,               // Premium hubs often have fitness facilities
        spas: true,               // Massage/spa services common in premium hubs
        meditationRooms: true,    // Many premium hubs have these
        healthyFoodAvailable: true,

        // Quality metrics (inferred high quality)
        loungeQuality: 8,         // Premium hubs have high-quality lounges
        naturalLightQuality: 8,   // Good natural light design

        // Stress factors (inferred better conditions)
        securityWaitMinutes: 15,  // Efficient security
        terminalDistanceMeters: 300, // Reasonable walking distance
        noiseLevel: 'quiet' as const,
        wifiQuality: 9,           // Excellent WiFi

        // Operating hours (unknown - assume convenient)
        facilityHours: undefined,

        // Congestion timing (inferred typical peak hours for major airports)
        peakCongestionHours: JSON.stringify({
          morning: { start: "06:00", end: "09:00", severity: "high" },
          evening: { start: "16:00", end: "19:00", severity: "high" }
        }),
      },
    };
  }

  if (isMajorHub) {
    return {
      airport: iataCode,
      airportQualityScore: 7,
      facilities: {
        // Core recovery facilities
        sleepPods: false,         // Not all major hubs have pods
        showers: true,            // Most have showers in lounges
        outdoorAccess: false,
        outdoorAccessRequiresResecurity: undefined,  // Rare to have outdoor access
        loungeAccess: true,
        quietZones: false,

        // Additional recovery facilities
        gyms: false,              // Less common in major (non-premium) hubs
        spas: false,
        meditationRooms: false,
        healthyFoodAvailable: true,

        // Quality metrics
        loungeQuality: 6,         // Decent but not premium
        naturalLightQuality: 6,

        // Stress factors
        securityWaitMinutes: 25,  // Moderate waits
        terminalDistanceMeters: 500,
        noiseLevel: 'moderate' as const,
        wifiQuality: 7,

        // Operating hours (unknown - assume standard)
        facilityHours: undefined,

        // Congestion timing (inferred typical peak hours for major airports)
        peakCongestionHours: JSON.stringify({
          morning: { start: "06:00", end: "09:00", severity: "medium" },
          evening: { start: "16:00", end: "19:00", severity: "medium" }
        }),
      },
    };
  }

  return {
    airport: iataCode,
    ...DEFAULT_AIRPORT_FACILITIES,
  };
}

// ============================================================================
// FALLBACK DECISION LOGIC
// ============================================================================

/**
 * Determine which fallback strategy to use
 */
export type FallbackLevel = 'database' | 'generated' | 'default';

export interface FallbackResult<T> {
  data: T;
  source: FallbackLevel;
  confidence: number;           // 0-1 scale
  warning?: string;
}

/**
 * Create fallback result with metadata
 */
export function createFallbackResult<T>(
  data: T,
  source: FallbackLevel,
  warning?: string
): FallbackResult<T> {
  const confidenceMap: Record<FallbackLevel, number> = {
    database: 0.95,               // High confidence - verified data
    generated: 0.75,              // Medium confidence - LLM generated
    default: 0.50,                // Low confidence - conservative defaults
  };

  return {
    data,
    source,
    confidence: confidenceMap[source],
    warning,
  };
}

/**
 * Log fallback usage for monitoring
 */
export function logFallbackUsage(
  entityType: 'aircraft' | 'airline' | 'airport',
  entityId: string,
  source: FallbackLevel
) {
  if (source !== 'database') {
    console.warn(`[Fallback] Using ${source} for ${entityType}: ${entityId}`);

    // TODO: Send to monitoring/analytics
    // trackFallbackUsage({ entityType, entityId, source, timestamp: new Date() });
  }
}

// ============================================================================
// SMART DEFAULTS BY CATEGORY
// ============================================================================

/**
 * Get smart defaults based on aircraft category
 */
export function getSmartAircraftDefaults(category: 'wide' | 'narrow' | 'regional' | 'unknown') {
  const baseDefaults = { ...DEFAULT_AIRCRAFT };

  switch (category) {
    case 'wide':
      return {
        ...baseDefaults,
        aisleWidth: 'wide' as const,
        seatComfort: 7,
        sleepScore: 7,
      };

    case 'narrow':
      return {
        ...baseDefaults,
        aisleWidth: 'narrow' as const,
        seatComfort: 5,
        sleepScore: 5,
      };

    case 'regional':
      return {
        ...baseDefaults,
        aisleWidth: 'narrow' as const,
        seatComfort: 4,
        sleepScore: 4,
        generation: 'legacy' as const,
      };

    default:
      return baseDefaults;
  }
}

/**
 * Infer aircraft category from IATA code
 */
export function inferAircraftCategory(iataCode: string): 'wide' | 'narrow' | 'regional' | 'unknown' {
  const code = iataCode.toUpperCase();

  // Wide-body patterns
  if (/^(77|78|35|33|38|74|34)/.test(code)) return 'wide';

  // Narrow-body patterns
  if (/^(73|32|31|75)/.test(code)) return 'narrow';

  // Regional jet patterns
  if (/^(CR|ER|E1|E7|DH|AT)/.test(code)) return 'regional';

  return 'unknown';
}
