/**
 * Composite Flight Ranking Algorithm
 *
 * Combines aircraft, airline, route, and timing scores into unified jetlag ranking
 */

import { calculateAircraftScore, type AircraftData } from './aircraft-scorer';
import { calculateAirlineScore, type AirlineServiceData } from './airline-scorer';
import { optimizeRoute, type RouteData } from './route-optimizer';

export interface FlightData {
  flightNumber: string;
  aircraft: AircraftData;
  airline: AirlineServiceData;
  route: RouteData;
  departureTimeLocal: string; // HH:MM format
  arrivalTimeLocal: string;   // HH:MM format
  durationMinutes: number;
}

export interface FlightRanking {
  flightNumber: string;

  // Component scores (0-10)
  aircraftScore: number;
  airlineScore: number;
  departureTimingScore: number;
  arrivalTimingScore: number;
  durationScore: number;
  routeDifficultyScore: number;

  // Final score
  overallJetlagScore: number;      // 0-10, 10 = best
  recoveryDaysEstimated: number;

  // Detailed breakdown
  scoreBreakdown: {
    aircraft: string;
    airline: string;
    timing: string;
    route: string;
  };

  explanation: string;
}

/**
 * Score departure timing based on route optimization
 */
function scoreDepartureTiming(
  departureHour: number,
  direction: string
): number {
  // Optimal departure times by direction
  const optimalRanges = {
    eastbound: { ideal: 16, good: [14, 18], poor: [2, 6] },
    westbound: { ideal: 9, good: [8, 11], poor: [21, 23] },
    'north-south': { ideal: 12, good: [10, 14], poor: [2, 4] }
  };

  const range = optimalRanges[direction as keyof typeof optimalRanges];
  if (!range) return 5.0;

  // Score based on proximity to ideal time
  if (departureHour === range.ideal) return 10.0;

  if (range.good.includes(departureHour)) return 8.5;

  if (range.poor.includes(departureHour)) return 3.0;

  // Distance-based scoring for other times
  const distanceFromIdeal = Math.min(
    Math.abs(departureHour - range.ideal),
    24 - Math.abs(departureHour - range.ideal) // Wrap around midnight
  );

  const score = 10 - (distanceFromIdeal * 0.8);
  return Math.max(0, Math.min(10, score));
}

/**
 * Score arrival timing
 * Prefer arrivals in evening local time (18:00-22:00) for easier adjustment
 */
function scoreArrivalTiming(arrivalHour: number): number {
  // Ideal: 18:00-22:00 (evening, allows sleep at destination)
  if (arrivalHour >= 18 && arrivalHour <= 22) return 10.0;

  // Good: 14:00-18:00 or 22:00-24:00
  if ((arrivalHour >= 14 && arrivalHour < 18) || arrivalHour >= 22) return 7.5;

  // Acceptable: 10:00-14:00
  if (arrivalHour >= 10 && arrivalHour < 14) return 6.0;

  // Poor: Early morning arrivals (4:00-10:00)
  if (arrivalHour >= 4 && arrivalHour < 10) return 4.0;

  // Very poor: Red-eye arrivals (24:00-4:00)
  return 2.0;
}

/**
 * Score flight duration
 * Shorter = better (less time in cabin environment)
 * But account for route distance
 */
function scoreDuration(durationMinutes: number, distanceKm: number): number {
  // Calculate expected duration based on distance
  // Typical cruising speed: ~850 km/h
  const expectedMinutes = (distanceKm / 850) * 60;

  // Actual vs expected ratio
  const ratio = durationMinutes / expectedMinutes;

  // Penalize slow flights
  if (ratio > 1.3) return 4.0; // 30% slower than expected
  if (ratio > 1.15) return 6.0; // 15% slower
  if (ratio <= 1.05) return 10.0; // On time or fast
  if (ratio <= 1.15) return 8.0;  // Slightly slower

  return 7.0;
}

/**
 * Parse time string (HH:MM) to hour
 */
function parseTimeToHour(timeStr: string): number {
  const [hour] = timeStr.split(':').map(Number);
  return hour;
}

/**
 * Calculate estimated recovery days
 *
 * Based on:
 * - Timezone difference
 * - Direction (east vs west)
 * - Flight quality scores
 *
 * Formula: base_days * (1 - (overall_score / 10) * 0.3)
 * High quality flights can reduce recovery by up to 30%
 */
function estimateRecoveryDays(
  tzDiffHours: number,
  direction: string,
  overallScore: number
): number {
  const absDiff = Math.abs(tzDiffHours);

  if (absDiff < 3) return 0;

  // Base recovery rate: 1 day per timezone hour (east), 0.66 days (west)
  const baseRate = direction === 'eastbound' ? 1.0 : 0.66;
  const baseDays = absDiff * baseRate;

  // High quality flights reduce recovery time by up to 30%
  const qualityReduction = (overallScore / 10) * 0.3;
  const adjustedDays = baseDays * (1 - qualityReduction);

  return Math.max(0, Number(adjustedDays.toFixed(1)));
}

/**
 * Calculate comprehensive flight ranking
 *
 * Weights:
 * - Aircraft: 25%
 * - Airline: 20%
 * - Departure timing: 15%
 * - Arrival timing: 15%
 * - Duration: 10%
 * - Route difficulty: 15%
 */
export function rankFlight(flight: FlightData): FlightRanking {
  // Calculate component scores
  const aircraftScores = calculateAircraftScore(flight.aircraft);
  const airlineScores = calculateAirlineScore(flight.airline);
  const routeOpt = optimizeRoute(flight.route);

  const departureHour = parseTimeToHour(flight.departureTimeLocal);
  const arrivalHour = parseTimeToHour(flight.arrivalTimeLocal);

  const aircraftScore = aircraftScores.overallScore;
  const airlineScore = airlineScores.overallScore;
  const departureTimingScore = scoreDepartureTiming(departureHour, routeOpt.direction);
  const arrivalTimingScore = scoreArrivalTiming(arrivalHour);
  const durationScore = scoreDuration(flight.durationMinutes, flight.route.distanceKm);
  const routeDifficultyScore = 10 - routeOpt.inherentJetlagDifficulty; // Invert (lower difficulty = higher score)

  // Calculate overall jetlag score (weighted composite)
  const overallJetlagScore = (
    aircraftScore * 0.25 +
    airlineScore * 0.20 +
    departureTimingScore * 0.15 +
    arrivalTimingScore * 0.15 +
    durationScore * 0.10 +
    routeDifficultyScore * 0.15
  );

  // Estimate recovery days
  const recoveryDays = estimateRecoveryDays(
    routeOpt.timeZoneDifferenceHours,
    routeOpt.direction,
    overallJetlagScore
  );

  // Generate explanation
  const explanation = `${flight.flightNumber} scores ${overallJetlagScore.toFixed(1)}/10 for jetlag recovery. ${aircraftScores.explanation} ${airlineScores.explanation} Estimated recovery: ${recoveryDays} days.`;

  return {
    flightNumber: flight.flightNumber,
    aircraftScore: Number(aircraftScore.toFixed(2)),
    airlineScore: Number(airlineScore.toFixed(2)),
    departureTimingScore: Number(departureTimingScore.toFixed(2)),
    arrivalTimingScore: Number(arrivalTimingScore.toFixed(2)),
    durationScore: Number(durationScore.toFixed(2)),
    routeDifficultyScore: Number(routeDifficultyScore.toFixed(2)),
    overallJetlagScore: Number(overallJetlagScore.toFixed(2)),
    recoveryDaysEstimated: recoveryDays,
    scoreBreakdown: {
      aircraft: `${aircraftScore.toFixed(1)}/10 - ${flight.aircraft.name}`,
      airline: `${airlineScore.toFixed(1)}/10 - ${flight.airline.airlineName}`,
      timing: `Dep ${departureTimingScore.toFixed(1)}/10 at ${flight.departureTimeLocal}, Arr ${arrivalTimingScore.toFixed(1)}/10 at ${flight.arrivalTimeLocal}`,
      route: `${routeDifficultyScore.toFixed(1)}/10 - ${routeOpt.direction} ${Math.abs(routeOpt.timeZoneDifferenceHours).toFixed(1)}h TZ diff`
    },
    explanation
  };
}

/**
 * Rank multiple flights and sort by overall score
 */
export function rankFlights(flights: FlightData[]): FlightRanking[] {
  const rankings = flights.map(rankFlight);

  // Sort by overall score descending
  rankings.sort((a, b) => b.overallJetlagScore - a.overallJetlagScore);

  return rankings;
}
