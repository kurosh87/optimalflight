/**
 * Flight Scoring Service for Kiwi API Results
 *
 * Scores individual flights based on jetlag recovery science:
 * - Timezone shift and direction (east harder than west)
 * - Flight timing (overnight vs day flights)
 * - Duration and routing
 * - Arrival time optimization
 */

import { calculateTimezoneShiftWithDirection, calculatePersonalizedRecoveryDays } from '../jetlag/calculator';

export interface FlightOption {
  // Flight identification
  id: string;

  // Route info
  originIata: string;
  destinationIata: string;
  originCity: string;
  destinationCity: string;
  originTimezone: string;
  destinationTimezone: string;

  // Timing
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;

  // Flight details (if available)
  airline?: string;
  aircraftType?: string;
  stops?: number;

  // Price (for comparison)
  price?: number;
  currency?: string;
}

export interface FlightScore {
  flightId: string;

  // Overall jetlag score (0-10, 10 = best)
  overallScore: number;

  // Component scores (0-10 scale)
  timezoneScore: number;        // Based on shift magnitude and direction
  timingScore: number;          // Departure/arrival time optimization
  durationScore: number;        // Shorter is better
  routeScore: number;           // Direct vs connections

  // Recovery metrics
  estimatedRecoveryDays: number;
  direction: 'east' | 'west' | 'none';
  timezoneShiftHours: number;

  // Flight characteristics
  isOvernightFlight: boolean;
  isOptimalTiming: boolean;

  // Recommendations
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  reasoning: string[];
  warnings: string[];
}

/**
 * Score a single flight option for jetlag impact
 */
export function scoreFlightForJetlag(flight: FlightOption): FlightScore {
  // 1. Calculate timezone shift and direction
  const { timezoneShift, direction, actualShiftHours } = calculateTimezoneShiftWithDirection(
    flight.originTimezone,
    flight.destinationTimezone,
    flight.departureTime
  );

  // 2. Calculate estimated recovery days
  const estimatedRecoveryDays = calculatePersonalizedRecoveryDays(
    actualShiftHours,
    direction
  );

  // 3. Score components
  const timezoneScore = scoreTimezoneShift(actualShiftHours, direction);
  const timingScore = scoreFlightTiming(flight, direction);
  const durationScore = scoreFlightDuration(flight.durationMinutes, actualShiftHours);
  const routeScore = scoreRoute(flight.stops || 0);

  // 4. Calculate overall score (weighted average)
  const overallScore = calculateOverallScore({
    timezoneScore,
    timingScore,
    durationScore,
    routeScore,
  });

  // 5. Determine flight characteristics
  const departureHour = flight.departureTime.getHours();
  const arrivalHour = flight.arrivalTime.getHours();
  const flightHours = flight.durationMinutes / 60;

  const isOvernightFlight =
    departureHour >= 18 &&
    arrivalHour <= 10 &&
    flightHours > 5;

  const isOptimalTiming = evaluateOptimalTiming(flight, direction, isOvernightFlight);

  // 6. Generate recommendation
  const { recommendation, reasoning, warnings } = generateRecommendation({
    overallScore,
    estimatedRecoveryDays,
    direction,
    isOvernightFlight,
    isOptimalTiming,
    timezoneShiftHours: actualShiftHours,
    stops: flight.stops || 0,
  });

  return {
    flightId: flight.id,
    overallScore,
    timezoneScore,
    timingScore,
    durationScore,
    routeScore,
    estimatedRecoveryDays,
    direction,
    timezoneShiftHours: actualShiftHours,
    isOvernightFlight,
    isOptimalTiming,
    recommendation,
    reasoning,
    warnings,
  };
}

/**
 * Score based on timezone shift magnitude and direction
 * Larger shifts = lower score, East harder than West
 */
function scoreTimezoneShift(shiftHours: number, direction: 'east' | 'west' | 'none'): number {
  if (direction === 'none' || shiftHours < 1) {
    return 10; // Perfect - no jetlag
  }

  // Base score decreases with shift magnitude
  // 1-2 hours: 9-10, 3-4 hours: 7-8, 5-6 hours: 5-6, 7-8 hours: 3-4, 9+ hours: 1-2
  let baseScore = Math.max(0, 10 - (shiftHours * 0.8));

  // Eastward penalty (harder to adjust)
  if (direction === 'east') {
    baseScore *= 0.85; // 15% penalty for eastward
  }

  return Math.max(0, Math.min(10, baseScore));
}

/**
 * Score based on flight timing relative to optimal for direction
 */
function scoreFlightTiming(flight: FlightOption, direction: 'east' | 'west' | 'none'): number {
  const departureHour = flight.departureTime.getHours();
  const arrivalHour = flight.arrivalTime.getHours();
  const flightHours = flight.durationMinutes / 60;

  const isOvernightFlight =
    departureHour >= 18 &&
    arrivalHour <= 10 &&
    flightHours > 5;

  if (direction === 'none') {
    return 10; // Timing doesn't matter much
  }

  if (direction === 'east') {
    // EASTWARD: Overnight flights are optimal
    if (isOvernightFlight) {
      // Perfect - depart evening, arrive morning
      if (departureHour >= 18 && departureHour <= 22 && arrivalHour >= 6 && arrivalHour <= 10) {
        return 10;
      }
      return 8; // Good overnight timing
    } else {
      // Day flight - suboptimal for eastward
      if (arrivalHour >= 18) {
        return 3; // Poor - arriving evening makes first night hard
      }
      return 5; // Fair - can work but not ideal
    }
  } else {
    // WESTWARD: Day flights are optimal
    if (!isOvernightFlight && departureHour >= 8 && departureHour <= 14) {
      // Perfect - morning/midday departure
      if (arrivalHour >= 14 && arrivalHour <= 20) {
        return 10; // Arrive afternoon/evening, stay up to local bedtime
      }
      return 8; // Good day flight
    } else if (isOvernightFlight) {
      return 4; // Poor - overnight flight for westward is harder
    } else {
      return 6; // Fair - day flight but not optimal window
    }
  }
}

/**
 * Score based on flight duration
 * Shorter flights = higher score (less time in cabin)
 */
function scoreFlightDuration(durationMinutes: number, timezoneShiftHours: number): number {
  const hours = durationMinutes / 60;

  // Expected duration based on timezone shift (rough estimate)
  // Direct long-haul: ~1 hour flight per 1 hour timezone
  const expectedHours = Math.max(timezoneShiftHours * 1.2, timezoneShiftHours + 2);

  const ratio = hours / expectedHours;

  if (ratio <= 1.0) {
    return 10; // At or below expected (direct flight)
  } else if (ratio <= 1.3) {
    return 8; // Slightly longer (short connection)
  } else if (ratio <= 1.6) {
    return 6; // Moderately longer (longer connection)
  } else if (ratio <= 2.0) {
    return 4; // Significantly longer (multiple connections)
  } else {
    return 2; // Very long (inefficient routing)
  }
}

/**
 * Score based on routing (direct vs connections)
 */
function scoreRoute(stops: number): number {
  switch (stops) {
    case 0:
      return 10; // Direct - best
    case 1:
      return 7; // One stop - acceptable
    case 2:
      return 4; // Two stops - tiring
    default:
      return 2; // 3+ stops - exhausting
  }
}

/**
 * Calculate weighted overall score
 */
function calculateOverallScore(scores: {
  timezoneScore: number;
  timingScore: number;
  durationScore: number;
  routeScore: number;
}): number {
  // Weights based on importance for jetlag
  const weights = {
    timezone: 0.35,  // Most important - can't change destination
    timing: 0.35,    // Very important - can choose flight time
    duration: 0.20,  // Important - shorter is better
    route: 0.10,     // Less important - but connections add fatigue
  };

  const weighted =
    scores.timezoneScore * weights.timezone +
    scores.timingScore * weights.timing +
    scores.durationScore * weights.duration +
    scores.routeScore * weights.route;

  return Math.round(weighted * 10) / 10; // Round to 1 decimal
}

/**
 * Evaluate if flight timing is optimal for direction
 */
function evaluateOptimalTiming(
  flight: FlightOption,
  direction: 'east' | 'west' | 'none',
  isOvernightFlight: boolean
): boolean {
  if (direction === 'none') return true;

  const departureHour = flight.departureTime.getHours();

  if (direction === 'east') {
    // Optimal: Overnight flight departing 6-10 PM
    return isOvernightFlight && departureHour >= 18 && departureHour <= 22;
  } else {
    // Optimal: Day flight departing 8 AM - 2 PM
    return !isOvernightFlight && departureHour >= 8 && departureHour <= 14;
  }
}

/**
 * Generate recommendation and reasoning
 */
function generateRecommendation(params: {
  overallScore: number;
  estimatedRecoveryDays: number;
  direction: 'east' | 'west' | 'none';
  isOvernightFlight: boolean;
  isOptimalTiming: boolean;
  timezoneShiftHours: number;
  stops: number;
}): {
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  reasoning: string[];
  warnings: string[];
} {
  const reasoning: string[] = [];
  const warnings: string[] = [];

  // Determine recommendation level
  let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  if (params.overallScore >= 8) {
    recommendation = 'excellent';
  } else if (params.overallScore >= 6.5) {
    recommendation = 'good';
  } else if (params.overallScore >= 5) {
    recommendation = 'fair';
  } else {
    recommendation = 'poor';
  }

  // Recovery days
  if (params.estimatedRecoveryDays <= 2) {
    reasoning.push(`Quick recovery: ~${params.estimatedRecoveryDays} days to adjust`);
  } else if (params.estimatedRecoveryDays <= 4) {
    reasoning.push(`Moderate recovery: ~${params.estimatedRecoveryDays} days to fully adjust`);
  } else {
    reasoning.push(`Extended recovery: ~${params.estimatedRecoveryDays} days needed`);
    warnings.push(`Long recovery time - consider pre-flight adjustment`);
  }

  // Direction-specific
  if (params.direction === 'east') {
    reasoning.push('Eastward travel (harder to adjust)');
    if (params.isOptimalTiming) {
      reasoning.push('✓ Optimal overnight flight timing');
    } else if (params.isOvernightFlight) {
      reasoning.push('Overnight flight, but not ideal departure time');
    } else {
      warnings.push('Day flight for eastward travel - harder to adjust');
    }
  } else if (params.direction === 'west') {
    reasoning.push('Westward travel (easier to adjust)');
    if (params.isOptimalTiming) {
      reasoning.push('✓ Optimal day flight timing');
    } else if (params.isOvernightFlight) {
      warnings.push('Overnight flight for westward travel - try to stay awake');
    } else {
      reasoning.push('Day flight, but not ideal departure window');
    }
  } else {
    reasoning.push('Minimal timezone change - low jetlag impact');
  }

  // Routing
  if (params.stops === 0) {
    reasoning.push('✓ Direct flight (best for minimizing fatigue)');
  } else if (params.stops === 1) {
    reasoning.push('One connection (manageable)');
  } else {
    warnings.push(`${params.stops} connections - significant travel fatigue`);
  }

  // Timezone shift
  if (params.timezoneShiftHours >= 8) {
    warnings.push('Large timezone shift - start adjusting 2-3 days before departure');
  }

  return { recommendation, reasoning, warnings };
}

/**
 * Score and rank multiple flight options
 */
export function scoreAndRankFlights(flights: FlightOption[]): (FlightOption & { score: FlightScore })[] {
  const scoredFlights = flights.map(flight => ({
    ...flight,
    score: scoreFlightForJetlag(flight),
  }));

  // Sort by overall score (highest first)
  return scoredFlights.sort((a, b) => b.score.overallScore - a.score.overallScore);
}

/**
 * Get best flight option for minimizing jetlag
 */
export function getBestFlightForJetlag(flights: FlightOption[]): (FlightOption & { score: FlightScore }) | null {
  if (flights.length === 0) return null;

  const ranked = scoreAndRankFlights(flights);
  return ranked[0];
}
