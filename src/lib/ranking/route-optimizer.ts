/**
 * Route Optimization Algorithm
 *
 * Calculates optimal departure times and jetlag difficulty for routes
 * Based on circadian rhythm science and timezone crossing direction
 */

export interface RouteData {
  originIataCode: string;
  destinationIataCode: string;
  originTimezone: string;
  destinationTimezone: string;
  distanceKm: number;
  typicalDurationMinutes: number;
}

export interface OptimalTiming {
  localHour: number;      // 0-23
  score: number;          // 0-10
  reason: string;
}

export interface RouteOptimization {
  timeZoneDifferenceHours: number;
  direction: 'eastbound' | 'westbound' | 'north-south';
  inherentJetlagDifficulty: number; // 0-10
  optimalDepartureTimes: OptimalTiming[];
  worstDepartureTimes: OptimalTiming[];
  recommendedPreAdjustmentDays: number;
  explanation: string;
}

/**
 * Calculate timezone difference in hours
 */
function getTimezoneDifference(originTz: string, destTz: string): number {
  const now = new Date();
  const originDate = new Date(now.toLocaleString('en-US', { timeZone: originTz }));
  const destDate = new Date(now.toLocaleString('en-US', { timeZone: destTz }));

  return (destDate.getTime() - originDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Determine travel direction
 */
function getTravelDirection(tzDiff: number): 'eastbound' | 'westbound' | 'north-south' {
  if (Math.abs(tzDiff) < 2) return 'north-south';
  return tzDiff > 0 ? 'eastbound' : 'westbound';
}

/**
 * Calculate inherent jetlag difficulty
 * Based on timezone difference and direction
 */
function calculateJetlagDifficulty(tzDiff: number, direction: string): number {
  const absDiff = Math.abs(tzDiff);

  // Base difficulty from timezone difference
  let difficulty = Math.min(absDiff * 1.2, 10);

  // Eastbound is harder (phase advance)
  if (direction === 'eastbound') {
    difficulty *= 1.3;
  } else if (direction === 'westbound') {
    difficulty *= 0.9;
  }

  return Math.min(10, difficulty);
}

/**
 * Calculate optimal departure times based on circadian science
 *
 * Eastbound: Prefer afternoon/evening departures (allows sleep during flight)
 * Westbound: Prefer morning departures (stay awake during flight, sleep at dest)
 */
function calculateOptimalDepartureTimes(
  tzDiff: number,
  direction: string
): OptimalTiming[] {
  const optimal: OptimalTiming[] = [];

  if (direction === 'eastbound') {
    // Afternoon departures (14:00-18:00) are best for eastbound
    optimal.push({
      localHour: 16,
      score: 9.5,
      reason: 'Afternoon departure allows overnight flight aligned with sleep'
    });
    optimal.push({
      localHour: 14,
      score: 9.0,
      reason: 'Early afternoon departure good for evening arrival'
    });
    optimal.push({
      localHour: 18,
      score: 8.5,
      reason: 'Evening departure enables sleep during flight'
    });
  } else if (direction === 'westbound') {
    // Morning departures (8:00-11:00) are best for westbound
    optimal.push({
      localHour: 9,
      score: 9.5,
      reason: 'Morning departure helps maintain wakefulness, evening arrival'
    });
    optimal.push({
      localHour: 11,
      score: 9.0,
      reason: 'Late morning departure aligns with natural rhythm'
    });
    optimal.push({
      localHour: 8,
      score: 8.5,
      reason: 'Early departure maximizes daylight at destination'
    });
  } else {
    // North-south: midday is generally optimal
    optimal.push({
      localHour: 12,
      score: 8.0,
      reason: 'Midday departure minimizes circadian disruption'
    });
  }

  return optimal;
}

/**
 * Calculate worst departure times
 */
function calculateWorstDepartureTimes(
  tzDiff: number,
  direction: string
): OptimalTiming[] {
  const worst: OptimalTiming[] = [];

  if (direction === 'eastbound') {
    // Early morning departures are worst for eastbound
    worst.push({
      localHour: 2,
      score: 2.5,
      reason: 'Red-eye departure worsens sleep debt and phase shift'
    });
    worst.push({
      localHour: 6,
      score: 3.5,
      reason: 'Early morning departure disrupts sleep schedule'
    });
  } else if (direction === 'westbound') {
    // Late night departures are worst for westbound
    worst.push({
      localHour: 23,
      score: 2.5,
      reason: 'Late night departure disrupts sleep and arrival timing'
    });
    worst.push({
      localHour: 21,
      score: 3.5,
      reason: 'Evening departure makes staying awake difficult'
    });
  } else {
    // For north-south, very early or very late
    worst.push({
      localHour: 3,
      score: 3.0,
      reason: 'Red-eye timing disrupts sleep quality'
    });
  }

  return worst;
}

/**
 * Calculate recommended pre-adjustment days
 */
function calculatePreAdjustmentDays(tzDiff: number, direction: string): number {
  const absDiff = Math.abs(tzDiff);

  if (absDiff < 3) return 0;
  if (absDiff < 6) return direction === 'eastbound' ? 2 : 1;
  if (absDiff < 9) return direction === 'eastbound' ? 3 : 2;
  return direction === 'eastbound' ? 5 : 3;
}

/**
 * Calculate comprehensive route optimization
 */
export function optimizeRoute(route: RouteData): RouteOptimization {
  const tzDiff = getTimezoneDifference(route.originTimezone, route.destinationTimezone);
  const direction = getTravelDirection(tzDiff);
  const difficulty = calculateJetlagDifficulty(tzDiff, direction);
  const optimalTimes = calculateOptimalDepartureTimes(tzDiff, direction);
  const worstTimes = calculateWorstDepartureTimes(tzDiff, direction);
  const preAdjustDays = calculatePreAdjustmentDays(tzDiff, direction);

  const explanation = `${direction.charAt(0).toUpperCase() + direction.slice(1)} route crossing ${Math.abs(tzDiff).toFixed(1)} timezones. Difficulty: ${difficulty.toFixed(1)}/10. ${direction === 'eastbound' ? 'Afternoon departures recommended.' : direction === 'westbound' ? 'Morning departures recommended.' : 'Minimal jetlag expected.'}`;

  return {
    timeZoneDifferenceHours: Number(tzDiff.toFixed(2)),
    direction,
    inherentJetlagDifficulty: Number(difficulty.toFixed(2)),
    optimalDepartureTimes: optimalTimes,
    worstDepartureTimes: worstTimes,
    recommendedPreAdjustmentDays: preAdjustDays,
    explanation
  };
}
