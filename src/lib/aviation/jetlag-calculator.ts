/**
 * Jetlag Scoring Algorithm
 * Based on research from Timeshifter, Stanford sleep research
 *
 * This is FlightOptima's core differentiator - calculating jetlag impact
 * for every flight option to help travelers make health-optimized decisions.
 */

import type { FlightOption, Airport } from '../types/aviation';

/**
 * Get direction of travel between two airports
 */
function getDirection(origin: Airport, destination: Airport): string {
  const lonDiff = destination.longitude - origin.longitude;
  const latDiff = destination.latitude - origin.latitude;

  // Normalize longitude difference to -180 to 180
  let normalizedLonDiff = lonDiff;
  if (lonDiff > 180) normalizedLonDiff = lonDiff - 360;
  if (lonDiff < -180) normalizedLonDiff = lonDiff + 360;

  // Determine primary direction
  if (Math.abs(normalizedLonDiff) > Math.abs(latDiff)) {
    return normalizedLonDiff > 0 ? 'eastbound' : 'westbound';
  } else {
    return latDiff > 0 ? 'northbound' : 'southbound';
  }
}

/**
 * Calculate timezone difference between two airports
 * Returns the number of hours difference
 */
function getTimezoneDifference(origin: Airport, destination: Airport): number {
  // This is a simplified version - in production, use a proper timezone library
  // For now, approximate using longitude (15 degrees ≈ 1 hour)
  const lonDiff = destination.longitude - origin.longitude;
  let hours = lonDiff / 15;

  // Normalize to -12 to +12
  if (hours > 12) hours -= 24;
  if (hours < -12) hours += 24;

  return Math.abs(hours);
}

/**
 * Calculate jetlag score for a flight route
 * Score range: 1-10 (1 = minimal jetlag, 10 = severe)
 *
 * Factors considered:
 * 1. Time zones crossed (most important)
 * 2. Direction of travel (eastbound is worse)
 * 3. Arrival time relative to circadian rhythm
 * 4. Total flight duration
 * 5. Number of stops
 */
export function calculateJetlagScore(flight: FlightOption): number {
  let score = 0;

  const firstLeg = flight.legs[0];
  const lastLeg = flight.legs[flight.legs.length - 1];

  // Factor 1: Time zones crossed (most important)
  const timeZonesCrossed = getTimezoneDifference(
    firstLeg.origin,
    lastLeg.destination
  );

  if (timeZonesCrossed <= 2) score += 1;
  else if (timeZonesCrossed <= 4) score += 3;
  else if (timeZonesCrossed <= 6) score += 5;
  else if (timeZonesCrossed <= 8) score += 7;
  else score += 9;

  // Factor 2: Direction (eastbound is worse)
  const direction = getDirection(firstLeg.origin, lastLeg.destination);

  if (direction === 'eastbound') score += 2;
  else if (direction === 'westbound') score += 1;
  // North/south travel has minimal jetlag impact

  // Factor 3: Arrival time relative to circadian rhythm
  const arrivalTime = new Date(lastLeg.arrival);
  const arrivalHour = arrivalTime.getUTCHours();

  // Optimal arrival: 6 AM - 12 PM local time (body adapts better)
  if (arrivalHour >= 6 && arrivalHour <= 12) score -= 1;
  // Bad arrival: 10 PM - 4 AM (disrupts sleep cycle)
  else if (arrivalHour >= 22 || arrivalHour <= 4) score += 2;

  // Factor 4: Total flight duration (longer = worse)
  const totalHours = flight.totalDuration / 60;
  if (totalHours > 12) score += 1;
  if (totalHours > 16) score += 1;

  // Factor 5: Number of stops (more disruption)
  const stops = flight.legs.length - 1;
  score += stops * 0.5;

  // Normalize to 1-10 scale
  return Math.min(Math.max(Math.round(score), 1), 10);
}

/**
 * Estimate recovery days based on time zones crossed
 * Research shows: ~1 day per time zone eastbound, ~1 day per 1.5 zones westbound
 */
export function estimateRecoveryDays(
  timeZonesCrossed: number,
  direction: string
): number {
  if (timeZonesCrossed < 2) return 0;

  if (direction === 'eastbound') {
    return Math.ceil(timeZonesCrossed * 1.0);
  } else if (direction === 'westbound') {
    return Math.ceil(timeZonesCrossed * 0.67);
  }
  return 0; // north/south travel minimal jetlag
}

/**
 * Calculate arrival time optimality
 * Score range: 1-10 (10 = optimal arrival time)
 *
 * Best arrival times for minimizing jetlag:
 * - 6 AM - 12 PM: Excellent (allows for daylight exposure)
 * - 12 PM - 6 PM: Good (some daylight remaining)
 * - 6 PM - 10 PM: Fair (evening arrival)
 * - 10 PM - 6 AM: Poor (disrupts sleep)
 */
export function calculateArrivalTimeOptimality(arrivalTime: string): number {
  const arrival = new Date(arrivalTime);
  const hour = arrival.getUTCHours();

  if (hour >= 6 && hour < 9) return 10; // Early morning - excellent
  if (hour >= 9 && hour < 12) return 9; // Late morning - excellent
  if (hour >= 12 && hour < 15) return 7; // Early afternoon - good
  if (hour >= 15 && hour < 18) return 6; // Late afternoon - good
  if (hour >= 18 && hour < 21) return 4; // Evening - fair
  if (hour >= 21 && hour < 23) return 2; // Late evening - poor
  return 1; // Night arrival - very poor
}

/**
 * Generate human-readable explanation for jetlag score
 */
export function generateJetlagExplanation(
  score: number,
  timeZonesCrossed: number,
  direction: string,
  arrivalHour: number
): string {
  const severity = score <= 3 ? 'minimal' : score <= 5 ? 'moderate' : score <= 7 ? 'significant' : 'severe';

  const parts: string[] = [
    `This flight will result in ${severity} jetlag`
  ];

  if (timeZonesCrossed > 0) {
    parts.push(`crossing ${timeZonesCrossed.toFixed(1)} time zones ${direction}`);
  }

  if (arrivalHour >= 6 && arrivalHour <= 12) {
    parts.push('The morning arrival time helps with circadian adjustment.');
  } else if (arrivalHour >= 22 || arrivalHour <= 4) {
    parts.push('The night arrival time may disrupt your sleep cycle.');
  }

  return parts.join(', ') + '.';
}

/**
 * Generate jetlag minimization recommendations
 */
export function generateJetlagRecommendations(
  timeZonesCrossed: number,
  direction: string,
  arrivalHour: number
): string[] {
  const recommendations: string[] = [];

  // Direction-specific advice
  if (direction === 'eastbound' && timeZonesCrossed >= 3) {
    recommendations.push('Eastbound travel: Try to sleep on the plane to arrive refreshed');
    recommendations.push('Start shifting your sleep schedule 2-3 days before departure');
  } else if (direction === 'westbound' && timeZonesCrossed >= 3) {
    recommendations.push('Westbound travel: Stay awake during the flight if possible');
    recommendations.push('Expose yourself to bright light in the evening at your destination');
  }

  // Arrival time specific advice
  if (arrivalHour >= 6 && arrivalHour <= 12) {
    recommendations.push('Morning arrival is optimal - get sunlight exposure immediately');
  } else if (arrivalHour >= 22 || arrivalHour <= 4) {
    recommendations.push('Night arrival - consider staying up until local bedtime');
  }

  // General advice
  if (timeZonesCrossed >= 5) {
    recommendations.push('Consider a stopover to break up the journey');
    recommendations.push('Stay hydrated and avoid alcohol on the flight');
  }

  if (timeZonesCrossed >= 3) {
    recommendations.push('Avoid caffeine 6 hours before your target bedtime');
  }

  return recommendations;
}

/**
 * Calculate complete jetlag impact for a flight
 */
export function calculateJetlagImpact(flight: FlightOption): FlightOption['jetlagImpact'] {
  const firstLeg = flight.legs[0];
  const lastLeg = flight.legs[flight.legs.length - 1];

  const timeZonesCrossed = getTimezoneDifference(firstLeg.origin, lastLeg.destination);
  const direction = getDirection(firstLeg.origin, lastLeg.destination);
  const score = calculateJetlagScore(flight);
  const recoveryDays = estimateRecoveryDays(timeZonesCrossed, direction);
  const arrivalTimeOptimality = calculateArrivalTimeOptimality(lastLeg.arrival);

  const arrivalTime = new Date(lastLeg.arrival);
  const arrivalHour = arrivalTime.getUTCHours();

  return {
    score,
    timeZonesCrossed,
    direction,
    estimatedRecoveryDays: recoveryDays,
    arrivalTimeOptimality,
    explanation: generateJetlagExplanation(score, timeZonesCrossed, direction, arrivalHour),
    recommendations: generateJetlagRecommendations(timeZonesCrossed, direction, arrivalHour)
  };
}

/**
 * Get color code for jetlag score visualization
 * Green (low jetlag) → Yellow → Orange → Red (high jetlag)
 */
export function getJetlagColor(score: number): string {
  if (score <= 3) return '#22c55e'; // green - minimal
  if (score <= 5) return '#eab308'; // yellow - moderate
  if (score <= 7) return '#f97316'; // orange - significant
  return '#ef4444'; // red - severe
}

/**
 * Get human-readable jetlag severity label
 */
export function getJetlagSeverityLabel(score: number): string {
  if (score <= 3) return 'Minimal';
  if (score <= 5) return 'Moderate';
  if (score <= 7) return 'Significant';
  return 'Severe';
}
