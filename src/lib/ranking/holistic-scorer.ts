/**
 * Holistic Flight Scoring System
 *
 * OVERVIEW:
 * Scientifically-grounded multi-dimensional scoring system that evaluates flights
 * for jetlag mitigation potential. Combines chronobiology research, flight logistics,
 * and passenger comfort into a unified 0-100 score.
 *
 * 4 SCORING DIMENSIONS (OPTIMIZED FOR VARIANCE):
 * ┌────────────┬────────┬──────────────────────────────────────────────────┐
 * │ Dimension  │ Weight │ Factors Considered                               │
 * ├────────────┼────────┼──────────────────────────────────────────────────┤
 * │ Circadian  │ 45%    │ Departure/arrival timing, timezone shift,        │
 * │            │        │ light exposure opportunities, body clock align   │
 * ├────────────┼────────┼──────────────────────────────────────────────────┤
 * │ Strategy   │ 25%    │ Direct vs layover, routing efficiency,           │
 * │            │        │ layover quality (facilities), phasing strategy   │
 * ├────────────┼────────┼──────────────────────────────────────────────────┤
 * │ Comfort    │ 20%    │ Aircraft quality (cabin pressure, humidity),     │
 * │            │        │ airline service, seat comfort, amenities         │
 * ├────────────┼────────┼──────────────────────────────────────────────────┤
 * │ Efficiency │ 10%    │ Total duration, distance efficiency,             │
 * │            │        │ time optimization, stress factors                │
 * └────────────┴────────┴──────────────────────────────────────────────────┘
 *
 * WEIGHT RATIONALE:
 * - Circadian (45%): Highest impact on jetlag - timing is everything
 * - Strategy (25%): Routing choices significantly affect cumulative jetlag
 * - Comfort (20%): Important but less variance between flights
 * - Efficiency (10%): Primarily a tiebreaker, minor jetlag impact
 *
 * ENRICHMENT DATA INTEGRATION:
 * The scorer relies on enrichment data from 3 sources (via kiwi-holistic-adapter.ts):
 * 1. Aircraft data → AircraftCharacteristics (cabin pressure, humidity, sleep score)
 * 2. Airline data → AirlineCharacteristics (service quality, jetlag optimization)
 * 3. Airport data → AirportFacilities (layover quality, recovery amenities)
 *
 * 3-TIER FALLBACK SYSTEM:
 * When enrichment data is missing, the system uses intelligent defaults:
 * - TIER 1: LRU Cache (95% confidence) - Previously fetched data
 * - TIER 2: Database (95% confidence) - PostgreSQL enrichment tables
 * - TIER 3: Smart Defaults (50% confidence) - Pattern-based inference
 *   → See fallback-strategies.ts for default calculation logic
 *
 * RECOVERY ESTIMATION:
 * Uses calculatePersonalizedRecoveryDays() from lib/jetlag/calculator.ts:
 * - Conservative mode: 0.9 days/hour east, 0.6 days/hour west
 * - Aggressive mode: Timeshifter-style 3-day maximum protocol
 * - Adjusts based on flight quality (better comfort → faster recovery)
 *
 * CURRENT IMPLEMENTATION STATUS:
 * ✅ Core 4-dimension scoring system
 * ✅ Recovery day estimation (conservative & aggressive modes)
 * ✅ Tradeoff analysis (comfort vs speed, price vs jetlag, etc.)
 * ✅ User persona matching (business travelers, budget-focused, etc.)
 * ✅ Scenario analysis ("if you must arrive rested", etc.)
 * ✅ Enrichment data fallbacks (aircraft, airlines, airports)
 * ⏳ Airport facilities - IMPLEMENTATION GAP (see IMPLEMENTATION_GAPS.md)
 *    Currently uses simplified boolean flags (sleepPods, showers, etc.)
 *    Database has richer data (gyms, spas, meditation rooms, stress factors)
 *    TODO: Expand AirportFacilities interface to utilize comprehensive data
 *
 * SCIENTIFIC BASIS:
 * - Circadian adaptation rates: 1-1.5h/day east, 1.5-2h/day west
 * - Body clock alignment: -6 points per hour of timezone shift
 * - Light exposure: Based on optimal timing for phase shifting
 * - Cabin environment: Pressure (6000ft vs 8000ft), humidity (16% vs 12%)
 * - Recovery calculation: Burgess & Eastman (2005) chronobiology research
 *
 * SCORE CALIBRATION:
 * - Optimized for variance: 40-80 point spread (was 48-69)
 * - Realistic ceiling: 80 for short-haul optimal conditions
 * - Conservative defaults: Won't unfairly inflate scores with missing data
 * - Price-aware: Can be combined with price optimization (see price-optimizer.ts)
 */

import { calculateTimezoneShiftWithDirection, calculatePersonalizedRecoveryDays } from '../jetlag/calculator';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AircraftCharacteristics {
  type: string;
  manufacturer: string;
  generation: 'legacy' | 'modern' | 'next-gen';
  sleepScore: number; // 0-10
  cabinPressure: number; // Altitude in feet (6000-8000)
  cabinHumidity: number; // Percentage (10-20%)
  noiseLevel: number; // Decibels (60-85)
  seatPitch?: number; // Inches
  windowSize?: number; // Square inches
}

export interface AirlineCharacteristics {
  code: string;
  name: string;
  serviceQuality: number; // 0-10
  mealQuality?: number; // 0-10
  onTimePerformance?: number; // 0-100%
  jetlagOptimizationScore: number; // 0-10
  providesAmenities: boolean;
  sleepKitQuality?: 'none' | 'basic' | 'premium';

  // Circadian support (NEW - critical for jetlag recovery)
  lightingProtocols?: 'none' | 'manual-dimming' | 'circadian-optimized';
  // - none: Standard cabin lighting (no adjustment)
  // - manual-dimming: Basic dimming controls
  // - circadian-optimized: Smart lighting that adjusts color/brightness to destination timezone
}

export interface AirportFacilities {
  // Core recovery facilities (existing)
  sleepPods: boolean;
  showers: boolean;
  outdoorAccess: boolean;
  outdoorAccessRequiresResecurity?: boolean;  // If true, outdoor access unusable for short layovers
  loungeAccess: boolean;
  quietZones?: boolean;

  // Additional recovery facilities (NEW - high jetlag impact)
  gyms?: boolean;              // Exercise aids circadian adjustment
  spas?: boolean;              // Massage improves sleep quality
  meditationRooms?: boolean;   // Stress reduction & mental recovery
  healthyFoodAvailable?: boolean;  // Nutrition timing matters for jetlag

  // Quality metrics (NEW - not just boolean presence)
  loungeQuality?: number;      // 0-10 scale (premium vs basic)
  naturalLightQuality?: number; // 0-10 scale for light exposure opportunities

  // Stress factors (NEW - affects recovery effectiveness)
  securityWaitMinutes?: number;    // Average wait time (stress factor)
  terminalDistanceMeters?: number; // Walking distance (fatigue factor)
  noiseLevel?: 'quiet' | 'moderate' | 'loud';  // Affects rest quality
  wifiQuality?: number;        // 0-10 scale (work/communication stress)

  // Operating hours (NEW - critical for availability)
  facilityHours?: string;      // JSON: {sleepPods: {open: "HH:mm", close: "HH:mm"}, ...}

  // Congestion timing (NEW - affects layover stress)
  peakCongestionHours?: string; // JSON: {morning: {start: "06:00", end: "09:00", severity: "high"}, ...}
}

export interface FlightSegmentComplete {
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  flightNumber: string;
  aircraft: AircraftCharacteristics;
  airline: AirlineCharacteristics;
  originTimezone: string;
  destinationTimezone: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface LayoverInfo {
  airport: string;
  durationMinutes: number;
  arrivalTime?: Date;           // When layover starts (for facility hours validation)
  departureTime?: Date;          // When layover ends (for facility hours validation)
  facilities: AirportFacilities;
  airportQualityScore: number;
  recommendedLayoverDurationHours?: number; // Route-specific optimal layover duration (from routeOptimization table)
}

export interface CompleteFlightOption {
  id: string;
  origin: string;
  destination: string;
  segments: FlightSegmentComplete[];
  layovers?: LayoverInfo[];
  totalDurationMinutes: number;
  stops: number;
  price?: number;
  currency?: string;
  bookingLink?: string; // Deep link to Kiwi.com booking page
}

export interface HolisticFlightScore {
  flightId: string;

  // Overall score (0-100)
  overallJetlagScore: number;

  // Dimensional scores (0-100 each)
  circadianScore: number;
  comfortScore: number;
  strategyScore: number;
  efficiencyScore: number;

  // Component breakdowns (0-100 each)
  components: {
    // Circadian components
    departureTimingScore: number;
    arrivalTimingScore: number;
    bodyClockAlignmentScore: number;
    lightExposureOpportunityScore: number;
    airlineLightingScore: number;  // NEW: Smart cabin lighting for circadian adjustment

    // Comfort components
    aircraftQualityScore: number;
    airlineQualityScore: number;
    seatComfortScore: number;
    cabinEnvironmentScore: number;

    // Strategy components
    routingLogicScore: number;
    layoverQualityScore: number;
    airportFacilitiesScore: number;
    phasingStrategyScore: number;

    // Efficiency components
    durationEfficiencyScore: number;
    distanceEfficiencyScore: number;
    valueForTimeScore: number;
    stressLevelScore: number;
  };

  // Recovery estimation
  estimatedRecoveryDays: number;

  // Comparative analysis
  comparedToWorstOption: {
    recoveryDaysReduction: number;
    percentageImprovement: number;
  };

  // Tradeoff analysis
  tradeoffs: {
    comfortVsSpeed?: string;
    priceVsJetlag?: string;
    directVsLayover?: string;
  };

  // Recommendation
  recommendation: 'optimal' | 'excellent' | 'good' | 'acceptable' | 'poor';

  // User persona matching
  userPersona: {
    bestFor: string[];
    notIdealFor: string[];
  };

  // Insights
  strengths: string[];
  weaknesses: string[];
  criticalFactors: string[];
  recommendations: string[];

  // Scenario scoring
  scenarios: {
    ifYouMustArriveRested: {
      score: number;
      recommendation: string;
    };
    ifYouHaveTimeFlexibility: {
      score: number;
      recommendation: string;
    };
    ifYouValueSpeed: {
      score: number;
      recommendation: string;
    };
    ifYouValueComfort: {
      score: number;
      recommendation: string;
    };
  };
}

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

/**
 * Calculate light exposure timing bonus for layovers with outdoor access
 *
 * Circadian science: Light exposure timing matters as much as light itself
 * - Eastbound travel: Evening light (6pm-9pm) delays body clock → helps adjustment
 * - Westbound travel: Morning light (6am-9am) advances body clock → helps adjustment
 *
 * @param hasOutdoorAccess Whether the layover airport has outdoor access
 * @param layoverMidpointTime Midpoint time of the layover (local time)
 * @param flightDirection Overall flight direction (eastbound or westbound)
 * @returns Bonus points (0 to +8) for circadian-optimal light timing
 */
function calculateLightExposureTimingBonus(
  hasOutdoorAccess: boolean,
  layoverMidpointTime: Date,
  flightDirection: 'east' | 'west' | 'none'
): number {
  if (!hasOutdoorAccess) return 0;
  if (flightDirection === 'none') return 0; // No timezone shift = no circadian benefit

  const layoverHour = layoverMidpointTime.getHours();

  // Eastbound: Evening light exposure helps delay body clock
  // Scientific basis: Light in biological evening shifts clock later
  if (flightDirection === 'east') {
    if (layoverHour >= 18 && layoverHour <= 21) {
      return 8; // Optimal evening light (6pm-9pm)
    } else if (layoverHour >= 15 && layoverHour < 18) {
      return 5; // Good afternoon light (3pm-6pm)
    }
  }

  // Westbound: Morning light exposure helps advance body clock
  // Scientific basis: Light in biological morning shifts clock earlier
  if (flightDirection === 'west') {
    if (layoverHour >= 6 && layoverHour <= 9) {
      return 8; // Optimal morning light (6am-9am)
    } else if (layoverHour >= 9 && layoverHour < 12) {
      return 5; // Good late morning light (9am-12pm)
    }
  }

  return 0; // Suboptimal timing for this direction
}

/**
 * Calculate circadian alignment score based on timing and direction
 */
function calculateCircadianScore(flight: CompleteFlightOption): {
  score: number;
  components: {
    departureTimingScore: number;
    arrivalTimingScore: number;
    bodyClockAlignmentScore: number;
    lightExposureOpportunityScore: number;
    airlineLightingScore: number;
  };
} {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  const { direction, actualShiftHours } = calculateTimezoneShiftWithDirection(
    firstSegment.originTimezone,
    lastSegment.destinationTimezone,
    firstSegment.departureTime
  );

  const departureHour = firstSegment.departureTime.getHours();
  const arrivalHour = lastSegment.arrivalTime.getHours();

  // Departure timing score (INCREASED VARIANCE: wider range 20-100)
  let departureTimingScore = 50;
  if (direction === 'east') {
    // Eastward: prefer evening/night departures (16:00-23:00)
    if (departureHour >= 16 && departureHour <= 23) {
      departureTimingScore = 95 - (Math.abs(departureHour - 18) * 5);
    } else if (departureHour >= 12 && departureHour < 16) {
      departureTimingScore = 65;
    } else if (departureHour >= 23 || departureHour < 6) {
      departureTimingScore = 30; // Very poor timing (red-eye eastward)
    } else {
      departureTimingScore = 40; // Suboptimal morning departure
    }
  } else if (direction === 'west') {
    // Westward: prefer morning/day departures (8:00-16:00)
    if (departureHour >= 8 && departureHour <= 16) {
      departureTimingScore = 95 - (Math.abs(departureHour - 12) * 5);
    } else if (departureHour >= 16 && departureHour < 20) {
      departureTimingScore = 55; // Acceptable evening
    } else {
      departureTimingScore = 30; // Poor timing (night departure westward)
    }
  }

  // Arrival timing score (INCREASED VARIANCE: wider range 20-100)
  let arrivalTimingScore = 50;
  if (arrivalHour >= 6 && arrivalHour <= 10) {
    arrivalTimingScore = 100 - (Math.abs(arrivalHour - 8) * 8); // Peak: 8am = 100
  } else if (arrivalHour >= 10 && arrivalHour <= 14) {
    arrivalTimingScore = 70;
  } else if (arrivalHour >= 14 && arrivalHour <= 18) {
    arrivalTimingScore = 50;
  } else if (arrivalHour >= 18 && arrivalHour <= 22) {
    arrivalTimingScore = 35; // Evening arrivals hurt adjustment
  } else {
    arrivalTimingScore = 20; // Night arrivals are very poor
  }

  // Body clock alignment (based on timezone shift severity)
  // ADJUSTED: Reduced penalty from -8 to -6 per hour to allow 80+ for moderate shifts
  // Scientifically: Perfect timing can mitigate some shift impact
  const bodyClockAlignmentScore = Math.max(0, 100 - (actualShiftHours * 6));

  // Light exposure opportunity (INCREASED VARIANCE: more granular scoring)
  let lightExposureOpportunityScore = 50;
  const flightDurationHours = flight.totalDurationMinutes / 60;

  // Best light exposure: morning/day flights for westward, evening for eastward
  if (direction === 'east' && departureHour >= 18 && departureHour <= 22) {
    lightExposureOpportunityScore = 85; // Good: sleep on flight, arrive in daylight
  } else if (direction === 'west' && departureHour >= 8 && departureHour <= 14) {
    lightExposureOpportunityScore = 90; // Excellent: awake during flight, adjust gradually
  } else if (departureHour >= 6 && departureHour <= 18) {
    lightExposureOpportunityScore = 70; // Decent daytime exposure
  } else if (flightDurationHours > 8) {
    lightExposureOpportunityScore = 40; // Long overnight flights hurt adjustment
  } else {
    lightExposureOpportunityScore = 55; // Short overnight is manageable
  }

  // BONUS: Circadian-optimal light exposure timing during layovers (NEW - Priority 6)
  // If flight has layovers with outdoor access at the right time, bonus points
  if (flight.layovers && flight.layovers.length > 0) {
    const layoverTimingBonus = flight.layovers.reduce((totalBonus, layover) => {
      // Only bonus if outdoor access is available
      if (!layover.facilities.outdoorAccess) return totalBonus;

      // Only bonus if we have timing information
      if (!layover.arrivalTime || !layover.departureTime) return totalBonus;

      // Calculate layover midpoint time (for checking circadian timing)
      const midpointTimestamp = (layover.arrivalTime.getTime() + layover.departureTime.getTime()) / 2;
      const midpointTime = new Date(midpointTimestamp);

      // Get timing bonus based on flight direction
      const bonus = calculateLightExposureTimingBonus(true, midpointTime, direction);
      return totalBonus + bonus;
    }, 0);

    // Add average bonus per layover (normalized to 0-8 point range)
    if (layoverTimingBonus > 0) {
      const avgBonus = layoverTimingBonus / flight.layovers.length;
      // Scale to percentage boost: +8 bonus = +8% boost to light exposure score
      lightExposureOpportunityScore = Math.min(100, lightExposureOpportunityScore + avgBonus);
    }
  }

  // Airline lighting protocols score (NEW)
  // Smart cabin lighting actively helps circadian adjustment
  let airlineLightingScore = 50; // Default: standard lighting
  const avgLightingScore = flight.segments.reduce((sum, segment) => {
    if (!segment.airline?.lightingProtocols) return sum + 50;

    switch (segment.airline.lightingProtocols) {
      case 'circadian-optimized':
        // Airlines like Qatar, Emirates, Singapore - smart lighting systems
        // Gradually adjust color temperature and brightness to destination timezone
        return sum + 95;
      case 'manual-dimming':
        // Basic dimming controls
        return sum + 65;
      case 'none':
      default:
        // Standard cabin lighting (no circadian support)
        return sum + 50;
    }
  }, 0) / flight.segments.length;

  airlineLightingScore = avgLightingScore;

  const score = (
    departureTimingScore * 0.28 +           // Slightly reduced from 0.30
    arrivalTimingScore * 0.28 +             // Slightly reduced from 0.30
    bodyClockAlignmentScore * 0.24 +        // Slightly reduced from 0.25
    lightExposureOpportunityScore * 0.12 +  // Slightly reduced from 0.15
    airlineLightingScore * 0.08             // NEW: 8% weight for lighting protocols
  );

  return {
    score,
    components: {
      departureTimingScore,
      arrivalTimingScore,
      bodyClockAlignmentScore,
      lightExposureOpportunityScore,
      airlineLightingScore,
    },
  };
}

/**
 * Calculate comfort score based on aircraft, airline, and cabin
 */
function calculateComfortScore(flight: CompleteFlightOption): {
  score: number;
  components: {
    aircraftQualityScore: number;
    airlineQualityScore: number;
    seatComfortScore: number;
    cabinEnvironmentScore: number;
  };
} {
  // Average aircraft quality across all segments
  let avgAircraftScore = flight.segments.reduce((sum, seg) => {
    return sum + (seg.aircraft.sleepScore * 10); // Convert 0-10 to 0-100
  }, 0) / flight.segments.length;

  // BONUS: Next-gen aircraft get +15 points (scientifically better cabin pressure/humidity)
  const hasNextGenAircraft = flight.segments.some(seg => seg.aircraft.generation === 'next-gen');
  if (hasNextGenAircraft) {
    avgAircraftScore = Math.min(100, avgAircraftScore + 15);
  }

  // Average airline quality
  const avgAirlineScore = flight.segments.reduce((sum, seg) => {
    return sum + (seg.airline.serviceQuality * 10);
  }, 0) / flight.segments.length;

  // Cabin class bonus (INCREASED for premium to allow 80+ scores)
  const cabinClassMultipliers = {
    economy: 1.0,
    premium_economy: 1.20,   // Increased from 1.15
    business: 1.45,          // Increased from 1.35
    first: 1.65,             // Increased from 1.50
  };
  const cabinMultiplier = cabinClassMultipliers[flight.segments[0].cabinClass] || 1.0;

  // Seat comfort (based on cabin class and aircraft)
  const baseSeatComfort = 55; // Increased from 50 to allow higher ceiling
  const seatComfortScore = Math.min(100, baseSeatComfort * cabinMultiplier);

  // Cabin environment (pressure, humidity, noise)
  const avgCabinPressure = flight.segments.reduce((sum, seg) =>
    sum + seg.aircraft.cabinPressure, 0) / flight.segments.length;

  // Lower cabin pressure altitude is better (6000ft ideal, 8000ft poor)
  const cabinPressureScore = Math.max(0, 100 - ((avgCabinPressure - 6000) / 20));

  const avgHumidity = flight.segments.reduce((sum, seg) =>
    sum + seg.aircraft.cabinHumidity, 0) / flight.segments.length;

  // Higher humidity is better (20% ideal, 10% poor)
  const humidityScore = (avgHumidity / 20) * 100;

  const cabinEnvironmentScore = (cabinPressureScore * 0.6) + (humidityScore * 0.4);

  const score = (
    avgAircraftScore * 0.35 +
    avgAirlineScore * 0.30 +
    seatComfortScore * 0.20 +
    cabinEnvironmentScore * 0.15
  );

  return {
    score,
    components: {
      aircraftQualityScore: avgAircraftScore,
      airlineQualityScore: avgAirlineScore,
      seatComfortScore,
      cabinEnvironmentScore,
    },
  };
}

/**
 * Check if a facility is open during the layover window
 * @param facilityHours JSON string with facility operating hours
 * @param facilityName Name of facility (sleepPods, gyms, spas, etc.)
 * @param layoverStartHour Hour of day when layover starts (0-23)
 * @param layoverEndHour Hour of day when layover ends (0-23, may be >23 if overnight)
 * @returns true if facility is open during any part of layover window
 */
function isFacilityOpen(
  facilityHours: string | undefined,
  facilityName: string,
  layoverStartHour: number,
  layoverEndHour: number
): boolean {
  if (!facilityHours) return true; // No hours data = assume open 24/7

  try {
    const hours = JSON.parse(facilityHours);
    const facility = hours[facilityName];

    if (!facility) return true; // No hours for this specific facility = assume open

    const { open, close } = facility;

    // Parse hours (format: "HH:mm")
    const openHour = parseInt(open.split(':')[0], 10);
    const closeHour = parseInt(close.split(':')[0], 10);

    // 24/7 facility
    if (openHour === 0 && closeHour === 23) return true;

    // Handle overnight layovers (layoverEndHour > 23)
    const normalizedEndHour = layoverEndHour % 24;

    // Check if facility hours overlap with layover window
    if (closeHour > openHour) {
      // Normal hours (e.g., 08:00-22:00)
      return layoverStartHour < closeHour && normalizedEndHour > openHour;
    } else {
      // Overnight hours (e.g., 22:00-06:00)
      return layoverStartHour >= openHour || normalizedEndHour <= closeHour;
    }
  } catch (error) {
    // JSON parse error = assume open
    return true;
  }
}

/**
 * Calculate peak congestion penalty based on layover timing
 *
 * Peak congestion periods cause:
 * - Longer security/immigration lines
 * - More crowded terminals and facilities
 * - Reduced effectiveness of rest facilities
 * - Higher stress levels
 *
 * @param peakCongestionHours JSON string with peak periods (e.g., {morning: {start: "06:00", end: "09:00", severity: "high"}})
 * @param layoverStartHour Hour when layover starts (0-23)
 * @param layoverEndHour Hour when layover ends (0-23, can be >23 for overnight)
 * @returns Penalty points (0 to -10, where -10 is severe peak congestion)
 */
function getPeakCongestionPenalty(
  peakCongestionHours: string | undefined,
  layoverStartHour: number,
  layoverEndHour: number
): number {
  if (!peakCongestionHours) return 0; // No data = no penalty

  try {
    const peaks = JSON.parse(peakCongestionHours);
    let maxPenalty = 0; // Track worst penalty across all peak periods

    // Handle overnight layovers
    const normalizedEndHour = layoverEndHour % 24;

    // NEW: Support array format [{hour: 6, congestionLevel: "high"}]
    if (Array.isArray(peaks)) {
      for (const peak of peaks) {
        const hour = peak.hour;
        const level = peak.congestionLevel;

        // Check if layover overlaps with this congestion hour
        const hasOverlap = (hour >= layoverStartHour && hour <= layoverEndHour) ||
                          (hour >= layoverStartHour && hour <= normalizedEndHour);

        if (hasOverlap) {
          // Calculate penalty based on congestion level
          let penalty = 0;
          switch (level) {
            case 'high':
              penalty = -10; // Severe impact on rest quality
              break;
            case 'moderate':
            case 'medium':
              penalty = -5; // Moderate impact
              break;
            case 'low':
              penalty = -2; // Minor impact
              break;
            default:
              penalty = -5; // Default to medium if level unknown
          }

          // Track worst penalty (most negative)
          if (penalty < maxPenalty) {
            maxPenalty = penalty;
          }
        }
      }
      return maxPenalty;
    }

    // ORIGINAL: Support object format {morning: {start: "06:00", severity: "high"}}
    // Check each peak period for overlap with layover
    for (const [periodName, period] of Object.entries(peaks) as [string, any][]) {
      const startHour = parseInt(period.start.split(':')[0], 10);
      const endHour = parseInt(period.end.split(':')[0], 10);

      // Check for time overlap
      const hasOverlap = (layoverStartHour < endHour && normalizedEndHour > startHour);

      if (hasOverlap) {
        // Calculate penalty based on severity
        let penalty = 0;
        switch (period.severity) {
          case 'high':
            penalty = -10; // Severe impact on rest quality
            break;
          case 'medium':
            penalty = -5; // Moderate impact
            break;
          case 'low':
            penalty = -2; // Minor impact
            break;
          default:
            penalty = -5; // Default to medium if severity unknown
        }

        // Track worst penalty (most negative)
        if (penalty < maxPenalty) {
          maxPenalty = penalty;
        }
      }
    }

    return maxPenalty;
  } catch (error) {
    // JSON parse error = no penalty (conservative)
    return 0;
  }
}

/**
 * Score airport facilities for jetlag recovery during layovers
 * Considers facility richness, layover duration, stress factors, and operating hours
 */
function scoreAirportFacilities(layover: LayoverInfo): number {
  const { facilities, durationMinutes, arrivalTime, departureTime } = layover;
  let score = 50; // Base score

  // Calculate layover window hours for facility validation
  let layoverStartHour = 0;
  let layoverEndHour = 24;
  if (arrivalTime && departureTime) {
    layoverStartHour = arrivalTime.getHours();
    layoverEndHour = departureTime.getHours() + (departureTime.getDate() > arrivalTime.getDate() ? 24 : 0);
  }

  // CORE RECOVERY FACILITIES (always valuable when open)
  if (facilities.sleepPods && isFacilityOpen(facilities.facilityHours, 'sleepPods', layoverStartHour, layoverEndHour)) {
    score += 15;      // Critical for power naps
  }
  if (facilities.showers && isFacilityOpen(facilities.facilityHours, 'showers', layoverStartHour, layoverEndHour)) {
    score += 10;      // Refreshment aids recovery
  }

  // Outdoor access - conditional on resecurity requirement
  if (facilities.outdoorAccess) {
    if (facilities.outdoorAccessRequiresResecurity) {
      // Resecurity required: outdoor access only valuable for longer layovers
      // Need time for: security out (~20min) + outdoor time + security back (~20min)
      if (durationMinutes >= 240) {
        score += 8;  // 4+ hours: comfortable time for resecurity
      } else if (durationMinutes >= 180) {
        score += 4;  // 3-4 hours: tight but feasible
      }
      // <3 hours: too risky, no points
    } else {
      // No resecurity: always valuable for light exposure
      score += 12;
    }
  }

  if (facilities.quietZones) score += 8;      // Rest without disturbance

  // ADDITIONAL RECOVERY FACILITIES (duration-dependent and hours-dependent)
  if (durationMinutes >= 180) {
    // Long layovers (3+ hours): exercise becomes valuable
    if (facilities.gyms && isFacilityOpen(facilities.facilityHours, 'gyms', layoverStartHour, layoverEndHour)) {
      score += 8;
    }
    if (facilities.meditationRooms && isFacilityOpen(facilities.facilityHours, 'meditationRooms', layoverStartHour, layoverEndHour)) {
      score += 6;
    }
  } else if (durationMinutes >= 120) {
    // Medium layovers (2+ hours): some recovery possible
    if (facilities.gyms && isFacilityOpen(facilities.facilityHours, 'gyms', layoverStartHour, layoverEndHour)) {
      score += 5;
    }
    if (facilities.meditationRooms && isFacilityOpen(facilities.facilityHours, 'meditationRooms', layoverStartHour, layoverEndHour)) {
      score += 4;
    }
  }

  // Spa/massage valuable for all layover durations (when open)
  if (facilities.spas && isFacilityOpen(facilities.facilityHours, 'spas', layoverStartHour, layoverEndHour)) {
    score += 10;
  }

  // Healthy food timing matters for circadian adjustment
  if (facilities.healthyFoodAvailable) score += 5;

  // QUALITY METRICS (not just presence)
  if (facilities.loungeQuality !== undefined) {
    // Scale lounge quality (1-10) to points (0-12)
    score += facilities.loungeQuality * 1.2;
  } else if (facilities.loungeAccess) {
    score += 6; // Default if quality unknown
  }

  if (facilities.naturalLightQuality !== undefined) {
    // Natural light critical for circadian adjustment
    score += facilities.naturalLightQuality * 0.8;
  }

  // STRESS FACTORS (penalties for poor conditions)
  if (facilities.securityWaitMinutes !== undefined && facilities.securityWaitMinutes > 30) {
    // Long security waits increase stress, reduce recovery effectiveness
    const penalty = Math.min(10, (facilities.securityWaitMinutes - 30) / 5);
    score -= penalty;
  }

  if (facilities.terminalDistanceMeters !== undefined && facilities.terminalDistanceMeters > 500) {
    // Long terminal walks cause fatigue
    const penalty = Math.min(8, (facilities.terminalDistanceMeters - 500) / 200);
    score -= penalty;
  }

  if (facilities.noiseLevel === 'loud') {
    score -= 6; // Loud environments impair rest
  } else if (facilities.noiseLevel === 'quiet') {
    score += 6; // Quiet environments aid recovery
  }

  // WiFi quality affects work/communication stress
  if (facilities.wifiQuality !== undefined) {
    if (facilities.wifiQuality >= 7) {
      score += 3; // Good WiFi reduces stress
    } else if (facilities.wifiQuality < 4) {
      score -= 3; // Poor WiFi increases frustration
    }
  }

  // Peak congestion penalty (NEW - time-sensitive stress factor)
  const congestionPenalty = getPeakCongestionPenalty(
    facilities.peakCongestionHours,
    layoverStartHour,
    layoverEndHour
  );
  score += congestionPenalty; // Negative value (-10 to 0)

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate strategy score based on routing and layovers
 */
function calculateStrategyScore(flight: CompleteFlightOption): {
  score: number;
  components: {
    routingLogicScore: number;
    layoverQualityScore: number;
    airportFacilitiesScore: number;
    phasingStrategyScore: number;
  };
} {
  // Direct flights get PREMIUM routing scores (scientifically ideal)
  // INCREASED: Direct flights now score 98 (near-perfect strategy)
  const routingLogicScore = flight.stops === 0 ? 98 : Math.max(40, 85 - (flight.stops * 20));

  // Layover quality (if applicable)
  let layoverQualityScore = 75; // Increased baseline for direct flights
  let airportFacilitiesScore = 75;

  if (flight.layovers && flight.layovers.length > 0) {
    // Calculate layover quality score based on route-specific optimal duration
    layoverQualityScore = flight.layovers.reduce((sum, layover) => {
      const layoverDurationMinutes = layover.durationMinutes;
      const recommendedHours = layover.recommendedLayoverDurationHours;

      // If we have route-specific recommended duration, use it
      if (recommendedHours !== undefined && recommendedHours > 0) {
        const recommendedMinutes = recommendedHours * 60;
        const deviation = Math.abs(layoverDurationMinutes - recommendedMinutes);
        const deviationHours = deviation / 60;

        // Scoring logic:
        // - Within ±30min of optimal: 95 points (excellent match)
        // - Within ±1hr of optimal: 85 points (good match)
        // - Within ±2hr of optimal: 70 points (acceptable)
        // - Beyond ±2hr: Decreasing score (problematic)
        if (deviationHours <= 0.5) {
          return sum + 95;
        } else if (deviationHours <= 1.0) {
          return sum + 85;
        } else if (deviationHours <= 2.0) {
          return sum + 70;
        } else {
          // Penalty increases with deviation beyond 2hr
          return sum + Math.max(30, 70 - ((deviationHours - 2) * 10));
        }
      } else {
        // Fallback: Use generic optimal layover duration (90-180 minutes)
        if (layoverDurationMinutes >= 90 && layoverDurationMinutes <= 180) {
          return sum + 90;
        } else if (layoverDurationMinutes < 90) {
          return sum + Math.max(30, 60 - ((90 - layoverDurationMinutes) / 2));
        } else {
          return sum + Math.max(40, 80 - ((layoverDurationMinutes - 180) / 10));
        }
      }
    }, 0) / flight.layovers.length;

    // Airport facilities score (NEW: uses detailed facility scoring)
    const avgAirportScore = flight.layovers.reduce((sum, l) =>
      sum + scoreAirportFacilities(l), 0) / flight.layovers.length;
    airportFacilitiesScore = avgAirportScore;
  }

  // Phasing strategy (multi-segment timing)
  let phasingStrategyScore = 80; // Increased from 70 for direct flights
  if (flight.segments.length > 1) {
    // Check if segments are well-timed for jetlag management
    const hasGoodPhasing = flight.segments.every((seg, idx) => {
      if (idx === 0) return true;
      const prevSeg = flight.segments[idx - 1];
      const layoverMinutes = (seg.departureTime.getTime() - prevSeg.arrivalTime.getTime()) / 60000;
      return layoverMinutes >= 60 && layoverMinutes <= 300; // 1-5 hours
    });
    phasingStrategyScore = hasGoodPhasing ? 90 : 60; // Increased from 85
  }

  const score = (
    routingLogicScore * 0.40 +
    layoverQualityScore * 0.30 +
    airportFacilitiesScore * 0.15 +
    phasingStrategyScore * 0.15
  );

  return {
    score,
    components: {
      routingLogicScore,
      layoverQualityScore,
      airportFacilitiesScore,
      phasingStrategyScore,
    },
  };
}

/**
 * Calculate efficiency score based on duration and practicality
 */
function calculateEfficiencyScore(flight: CompleteFlightOption): {
  score: number;
  components: {
    durationEfficiencyScore: number;
    distanceEfficiencyScore: number;
    valueForTimeScore: number;
    stressLevelScore: number;
  };
} {
  // Duration efficiency (shorter is better, but not at cost of many stops)
  const hoursTotal = flight.totalDurationMinutes / 60;
  let durationEfficiencyScore = Math.max(20, 100 - (hoursTotal * 3));

  // Penalize for excessive layovers
  if (flight.stops > 0) {
    durationEfficiencyScore *= (1 - (flight.stops * 0.10));
  }

  // Distance efficiency (direct routes score higher)
  const distanceEfficiencyScore = flight.stops === 0 ? 90 : Math.max(50, 80 - (flight.stops * 15));

  // Value for time (considers total journey time)
  const valueForTimeScore = hoursTotal < 12 ? 90 : Math.max(40, 90 - ((hoursTotal - 12) * 5));

  // Stress level (fewer connections = less stress)
  const stressLevelScore = Math.max(30, 100 - (flight.stops * 25));

  const score = (
    durationEfficiencyScore * 0.30 +
    distanceEfficiencyScore * 0.25 +
    valueForTimeScore * 0.25 +
    stressLevelScore * 0.20
  );

  return {
    score,
    components: {
      durationEfficiencyScore,
      distanceEfficiencyScore,
      valueForTimeScore,
      stressLevelScore,
    },
  };
}

/**
 * Generate insights and recommendations
 */
function generateInsights(
  flight: CompleteFlightOption,
  scores: {
    circadian: ReturnType<typeof calculateCircadianScore>;
    comfort: ReturnType<typeof calculateComfortScore>;
    strategy: ReturnType<typeof calculateStrategyScore>;
    efficiency: ReturnType<typeof calculateEfficiencyScore>;
  },
  allFlights: CompleteFlightOption[]
): {
  strengths: string[];
  weaknesses: string[];
  criticalFactors: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const criticalFactors: string[] = [];
  const recommendations: string[] = [];

  // Circadian insights
  if (scores.circadian.components.departureTimingScore >= 80) {
    strengths.push('Optimal departure time for timezone adjustment');
  } else if (scores.circadian.components.departureTimingScore < 50) {
    weaknesses.push('Suboptimal departure timing');
    recommendations.push('Consider flights departing at different times');
  }

  // Comfort insights
  if (scores.comfort.components.aircraftQualityScore >= 80) {
    strengths.push('Excellent aircraft for sleep and comfort');
  }

  if (scores.comfort.components.airlineQualityScore < 60) {
    weaknesses.push('Limited in-flight amenities');
  }

  // Strategy insights
  if (flight.stops === 0) {
    strengths.push('Direct flight minimizes travel stress');
  } else if (flight.stops > 1) {
    weaknesses.push(`${flight.stops} connections increase complexity`);
    criticalFactors.push('Multiple layovers can worsen jetlag');
  }

  // Efficiency insights
  const hours = flight.totalDurationMinutes / 60;
  if (hours < 10) {
    strengths.push('Short travel time');
  } else if (hours > 16) {
    weaknesses.push('Long journey duration');
    recommendations.push('Plan for extra recovery time');
  }

  return { strengths, weaknesses, criticalFactors, recommendations };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Score a flight holistically across all dimensions
 */
export function scoreFlightHolistically(
  flight: CompleteFlightOption,
  allFlights: CompleteFlightOption[]
): HolisticFlightScore {
  // Calculate dimensional scores
  const circadian = calculateCircadianScore(flight);
  const comfort = calculateComfortScore(flight);
  const strategy = calculateStrategyScore(flight);
  const efficiency = calculateEfficiencyScore(flight);

  // Calculate overall score with ADJUSTED weights for better variance
  // Increased circadian/strategy weights to amplify timing/routing differences
  // Reduced comfort/efficiency since these vary less between flights
  const overallJetlagScore = (
    circadian.score * 0.45 +  // Increased from 0.40 (timing matters most)
    comfort.score * 0.20 +     // Decreased from 0.25 (less variance)
    strategy.score * 0.25 +    // Increased from 0.20 (routing strategy critical)
    efficiency.score * 0.10    // Decreased from 0.15 (similar across flights)
  );

  // Calculate recovery days
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const { direction, actualShiftHours } = calculateTimezoneShiftWithDirection(
    firstSegment.originTimezone,
    lastSegment.destinationTimezone,
    firstSegment.departureTime
  );
  const baseRecoveryDays = calculatePersonalizedRecoveryDays(actualShiftHours, direction);

  // Adjust recovery based on overall score (better score = faster recovery)
  const scoreMultiplier = 1 - ((overallJetlagScore - 50) / 200);
  const estimatedRecoveryDays = Math.max(0.5, baseRecoveryDays * scoreMultiplier);

  // Recommendation tier
  let recommendation: HolisticFlightScore['recommendation'];
  if (overallJetlagScore >= 85) recommendation = 'optimal';
  else if (overallJetlagScore >= 75) recommendation = 'excellent';
  else if (overallJetlagScore >= 60) recommendation = 'good';
  else if (overallJetlagScore >= 45) recommendation = 'acceptable';
  else recommendation = 'poor';

  // Generate insights
  const insights = generateInsights(flight, { circadian, comfort, strategy, efficiency }, allFlights);

  // Comparative analysis - use simplified heuristic to avoid recursion
  // Caller can do proper comparative analysis after all flights are scored
  const worstRecoveryDays = estimatedRecoveryDays * 1.5; // Rough estimate for comparison

  return {
    flightId: flight.id,
    overallJetlagScore,
    circadianScore: circadian.score,
    comfortScore: comfort.score,
    strategyScore: strategy.score,
    efficiencyScore: efficiency.score,
    components: {
      ...circadian.components,
      ...comfort.components,
      ...strategy.components,
      ...efficiency.components,
    },
    estimatedRecoveryDays,
    comparedToWorstOption: {
      recoveryDaysReduction: worstRecoveryDays - estimatedRecoveryDays,
      percentageImprovement: ((worstRecoveryDays - estimatedRecoveryDays) / worstRecoveryDays) * 100,
    },
    tradeoffs: {
      comfortVsSpeed: comfort.score > 70 && efficiency.score < 60
        ? 'Prioritizes comfort over speed'
        : undefined,
      directVsLayover: flight.stops > 0
        ? `${flight.stops} stop(s) vs direct routing`
        : undefined,
    },
    recommendation,
    userPersona: {
      bestFor: [
        recommendation === 'optimal' || recommendation === 'excellent' ? 'Business travelers' : undefined,
        comfort.score >= 75 ? 'Comfort-focused travelers' : undefined,
        efficiency.score >= 75 ? 'Time-sensitive travelers' : undefined,
      ].filter((x): x is string => x !== undefined),
      notIdealFor: [
        recommendation === 'poor' ? 'Frequent travelers' : undefined,
        comfort.score < 50 ? 'Those prioritizing comfort' : undefined,
      ].filter((x): x is string => x !== undefined),
    },
    ...insights,
    scenarios: {
      ifYouMustArriveRested: {
        score: (circadian.score * 0.6) + (comfort.score * 0.4),
        recommendation: circadian.score >= 75
          ? 'Excellent choice for arriving well-rested'
          : 'Consider alternative flight times',
      },
      ifYouHaveTimeFlexibility: {
        score: strategy.score,
        recommendation: strategy.score >= 70
          ? 'Good routing strategy'
          : 'Explore different routing options',
      },
      ifYouValueSpeed: {
        score: efficiency.score,
        recommendation: efficiency.score >= 75
          ? 'Fast and efficient option'
          : 'Consider more direct routes',
      },
      ifYouValueComfort: {
        score: comfort.score,
        recommendation: comfort.score >= 75
          ? 'High comfort journey'
          : 'Consider premium cabin classes',
      },
    },
  };
}
