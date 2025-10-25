/**
 * Master Jetlag Calculator
 *
 * Comprehensive scoring system combining circadian disruption, flight timing,
 * environment quality, airline service, and connection factors.
 *
 * Scoring weights:
 * - Circadian Disruption: 40% (MOST IMPORTANT)
 * - Flight Timing: 25%
 * - Environment (Aircraft + Airports): 20%
 * - Service (Airline): 10%
 * - Connection Quality: 5%
 */

import { calculateAircraftScore } from '../ranking/aircraft-scorer';
import { calculateAirlineScore } from '../ranking/airline-scorer';
import { calculateAirportScore } from '../ranking/airport-scorer';

// Core scoring interface
export interface JetlagFactors {
  // Circadian Disruption
  timezoneShift: number;        // hours difference
  direction: 'eastbound' | 'westbound' | 'neutral';
  crossesDateline: boolean;

  // Flight Timing
  departureTime: string;        // HH:MM format
  arrivalTime: string;
  flightDuration: number;       // minutes

  // Quality Scores
  aircraftScore: number;        // 0-10
  airlineScore: number;         // 0-10
  originAirportScore: number;   // 0-10
  destAirportScore: number;     // 0-10

  // Optional
  hasLayover?: boolean;
  layoverDuration?: number;     // minutes
  layoverAirportScore?: number; // 0-10
  userAge?: number;
  userSleepPattern?: 'early_bird' | 'night_owl' | 'normal';
}

export interface ScoreBreakdown {
  circadian: number;
  timing: number;
  environment: number;
  service: number;
  connection: number;
}

export interface JetlagResult {
  score: number;           // 0-10 (10 = best)
  recoveryDays: number;
  breakdown: ScoreBreakdown;
  recommendations: string[];
}

/**
 * MASTER SCORING FUNCTION
 *
 * Combines all jetlag factors into unified score
 */
export function calculateJetlagScore(factors: JetlagFactors): JetlagResult {
  // 1. Circadian Disruption Score (40% weight) - MOST IMPORTANT
  const circadianScore = calculateCircadianScore(
    factors.timezoneShift,
    factors.direction,
    factors.crossesDateline
  );

  // 2. Flight Timing Score (25% weight)
  const timingScore = calculateTimingScore(
    factors.departureTime,
    factors.arrivalTime,
    factors.timezoneShift,
    factors.direction
  );

  // 3. Environment Score (20% weight) - Aircraft + Airports
  const environmentScore = (
    factors.aircraftScore * 0.50 +
    factors.originAirportScore * 0.25 +
    factors.destAirportScore * 0.25
  );

  // 4. Service Score (10% weight)
  const serviceScore = factors.airlineScore;

  // 5. Connection Score (5% weight)
  const connectionScore = factors.hasLayover
    ? calculateConnectionScore(factors.layoverDuration, factors.layoverAirportScore)
    : 8.0; // No layover = good

  // Weighted Final Score
  const finalScore = (
    circadianScore * 0.40 +
    timingScore * 0.25 +
    environmentScore * 0.20 +
    serviceScore * 0.10 +
    connectionScore * 0.05
  );

  // Calculate recovery days
  const recoveryDays = calculateRecoveryDays(
    finalScore,
    factors.timezoneShift,
    factors.userAge
  );

  // Generate recommendations
  const recommendations = generateRecommendations(factors, {
    circadian: circadianScore,
    timing: timingScore,
    environment: environmentScore,
    service: serviceScore,
    connection: connectionScore
  });

  return {
    score: Math.round(finalScore * 10) / 10,
    recoveryDays: Math.round(recoveryDays * 10) / 10,
    breakdown: {
      circadian: Math.round(circadianScore * 10) / 10,
      timing: Math.round(timingScore * 10) / 10,
      environment: Math.round(environmentScore * 10) / 10,
      service: Math.round(serviceScore * 10) / 10,
      connection: Math.round(connectionScore * 10) / 10
    },
    recommendations
  };
}

/**
 * CIRCADIAN DISRUPTION CALCULATOR
 *
 * Most important factor - accounts for timezone shift, direction, and dateline crossing
 */
function calculateCircadianScore(
  timezoneShift: number,
  direction: string,
  crossesDateline: boolean
): number {
  const absShift = Math.abs(timezoneShift);

  // Base disruption (linear up to 8 hours, then exponential)
  let disruption = absShift <= 8
    ? absShift
    : 8 + (absShift - 8) * 1.5;

  // Eastbound travel is significantly harder (body wants to delay, not advance)
  if (direction === 'eastbound') {
    disruption *= 1.5;
  }

  // Crossing dateline adds psychological disruption
  if (crossesDateline) {
    disruption *= 1.2;
  }

  // Convert disruption (0-20) to score (10-0)
  // Max theoretical disruption = 20, min = 0
  const score = Math.max(0, 10 - (disruption / 2));

  return score;
}

/**
 * FLIGHT TIMING SCORER
 *
 * Scores departure and arrival times for optimal circadian alignment
 */
function calculateTimingScore(
  departureTime: string,
  arrivalTime: string,
  timezoneShift: number,
  direction: string
): number {
  const depHour = parseInt(departureTime.split(':')[0]);
  const arrHour = parseInt(arrivalTime.split(':')[0]);

  // Score departure timing (0-10)
  let depScore: number;
  if (depHour >= 13 && depHour <= 17) {
    depScore = 10; // Afternoon = best
  } else if (depHour >= 10 && depHour <= 12) {
    depScore = 8;  // Late morning = good
  } else if (depHour >= 18 && depHour <= 21) {
    depScore = 7;  // Evening = okay
  } else if (depHour >= 22 || depHour <= 5) {
    depScore = 3;  // Red-eye = worst
  } else {
    depScore = 5;  // Early morning = neutral
  }

  // Score arrival timing (0-10)
  let arrScore: number;
  if (arrHour >= 17 && arrHour <= 21) {
    arrScore = 10; // Evening arrival = best (time to sleep soon)
  } else if (arrHour >= 14 && arrHour <= 16) {
    arrScore = 8;  // Afternoon = good
  } else if (arrHour >= 9 && arrHour <= 13) {
    arrScore = 6;  // Morning = okay
  } else if (arrHour >= 22 || arrHour <= 5) {
    arrScore = 3;  // Late night/early morning = worst
  } else {
    arrScore = 5;  // Dawn = neutral
  }

  // Arrival timing is more important (60/40 split)
  return (depScore * 0.4 + arrScore * 0.6);
}

/**
 * CONNECTION QUALITY SCORER
 *
 * Evaluates layover duration and airport quality
 */
function calculateConnectionScore(
  layoverDuration?: number,
  layoverAirportScore?: number
): number {
  if (!layoverDuration) return 8.0; // No layover = good

  const hours = layoverDuration / 60;

  // Optimal layover: 3-6 hours
  let durationScore: number;
  if (hours >= 3 && hours <= 6) {
    durationScore = 10; // Perfect for strategic rest
  } else if (hours >= 2 && hours < 3) {
    durationScore = 7;  // Tight but manageable
  } else if (hours > 6 && hours <= 10) {
    durationScore = 8;  // Long but allows recovery activities
  } else if (hours > 10) {
    durationScore = 6;  // Very long = tiring
  } else {
    durationScore = 3;  // < 2 hours = stressful
  }

  // Factor in airport quality (30% weight)
  const airportFactor = layoverAirportScore || 5;
  const score = durationScore * 0.7 + airportFactor * 0.3;

  return score;
}

/**
 * RECOVERY TIME ESTIMATOR
 *
 * Estimates days needed to fully recover from jetlag
 * NOTE: This is for scoring/ranking flights, not generating recovery plans
 * For actual recovery planning, use lib/jetlag/calculator.ts
 */
function calculateRecoveryDays(
  jetlagScore: number,
  timezoneShift: number,
  userAge?: number,
  recoveryMode?: 'conservative' | 'aggressive'
): number {
  const absShift = Math.abs(timezoneShift);

  // Quick exit for aggressive mode: cap at 3 days
  if (recoveryMode === 'aggressive') {
    if (absShift < 2) return 1;
    if (absShift < 6) return 2;
    return 3;
  }

  // CONSERVATIVE MODE (default)
  // Base formula: ~0.7 days per timezone hour
  let baseRecovery = absShift * 0.7;

  // Score impact: Lower score = longer recovery
  const scoreMultiplier = (10 - jetlagScore) / 10;
  baseRecovery *= (1 + scoreMultiplier * 0.6);

  // Age factor
  if (userAge) {
    if (userAge > 60) {
      baseRecovery *= 1.35; // Significantly slower recovery
    } else if (userAge > 50) {
      baseRecovery *= 1.20;
    } else if (userAge > 40) {
      baseRecovery *= 1.10;
    } else if (userAge < 25) {
      baseRecovery *= 0.85; // Faster recovery when young
    }
  }

  // Bounds: minimum 0.5 days, maximum 10 days
  return Math.max(0.5, Math.min(10, baseRecovery));
}

/**
 * RECOMMENDATION GENERATOR
 *
 * Generates personalized recommendations based on score breakdown
 */
function generateRecommendations(
  factors: JetlagFactors,
  breakdown: ScoreBreakdown
): string[] {
  const recommendations: string[] = [];

  // Circadian-specific advice
  if (breakdown.circadian < 6) {
    if (factors.direction === 'eastbound') {
      recommendations.push("Eastbound travel detected - start shifting sleep 1hr earlier for 3 days before");
    }
    if (Math.abs(factors.timezoneShift) > 8) {
      recommendations.push("Large timezone shift - consider a strategic stopover for recovery");
    }
  }

  // Timing-specific advice
  if (breakdown.timing < 7) {
    const depHour = parseInt(factors.departureTime.split(':')[0]);
    if (depHour >= 22 || depHour <= 5) {
      recommendations.push("Red-eye flight - use sleep aids and eye mask for quality rest");
    }
  }

  // Environment advice
  if (breakdown.environment < 7) {
    recommendations.push("Request a window seat for natural light control");
    recommendations.push("Stay hydrated - cabin humidity is lower on this aircraft");
  }

  // Service advice
  if (breakdown.service < 6) {
    recommendations.push("Bring your own healthy snacks - airline meal options may be limited");
  }

  // Connection advice
  if (factors.hasLayover && breakdown.connection < 7) {
    const hours = (factors.layoverDuration || 0) / 60;
    if (hours < 2) {
      recommendations.push("Very tight connection - minimize stress by having essentials in carry-on");
    } else if (hours > 8) {
      recommendations.push("Long layover - use airport sleep pods or shower facilities to refresh");
    }
  }

  return recommendations;
}
