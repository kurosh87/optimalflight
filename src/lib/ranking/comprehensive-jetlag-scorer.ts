/**
 * Comprehensive Jetlag Scoring Algorithm
 *
 * Integrates all jetlag factors:
 * - Aircraft quality (cabin pressure, humidity, noise)
 * - Airline service (meals, sleep kits, reliability)
 * - Route characteristics (timezone shift, direction)
 * - Flight timing (circadian alignment)
 * - Airport facilities (layover quality)
 * - Flight duration
 * - User profile (age, sleep quality, adaptability)
 *
 * Formula:
 * Overall Jetlag Score = (
 *   Aircraft Score × 0.25 +
 *   Airline Score × 0.20 +
 *   Route Score × 0.20 +
 *   Timing Score × 0.15 +
 *   Airport Score × 0.10 +
 *   Duration Score × 0.10
 * )
 */

import { calculateAircraftScore, type AircraftData } from './aircraft-scorer';
import { calculateAirlineScore, type AirlineServiceData } from './airline-scorer';

export interface FlightDetails {
  // Flight identification
  flightNumber: string;
  airline: string;
  aircraft?: string;

  // Route
  origin: string;             // IATA code
  destination: string;         // IATA code
  departure: string;          // ISO datetime
  arrival: string;            // ISO datetime
  duration: number;           // minutes

  // Connections
  stops: number;
  layovers?: Array<{
    airport: string;
    duration: number;         // minutes
  }>;
}

export interface CircadianContext {
  timezoneShift: number;                    // hours (absolute value)
  direction: 'eastbound' | 'westbound' | 'neutral';
  crossesDateline: boolean;
  departureTime: string;                     // HH:MM
  arrivalTime: string;                       // HH:MM
  departureLocalHour: number;                // 0-23
  arrivalLocalHour: number;                  // 0-23
}

export interface AirportQuality {
  code: string;
  hasRecoveryFacilities: boolean;           // Sleep pods, showers
  stressScore: number;                      // 0-10, lower = more stressful
  jetlagSupportScore: number;               // 0-10
}

export interface UserProfile {
  age?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  adaptabilityLevel?: 'low' | 'medium' | 'high';
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';
}

export interface JetlagScoreResult {
  // Overall score
  score: number;                             // 0-10 (10 = best, minimal jetlag)
  recoveryDays: number;                      // Estimated days to full recovery

  // Component scores
  breakdown: {
    aircraft: number;                        // 0-10
    airline: number;                         // 0-10
    route: number;                           // 0-10
    timing: number;                          // 0-10
    airport: number;                         // 0-10
    duration: number;                        // 0-10
  };

  // Severity assessment
  severity: 'minimal' | 'mild' | 'moderate' | 'severe' | 'very-severe';
  description: string;

  // Recommendations
  recommendations: string[];
}

/**
 * Calculate route difficulty score
 * Eastward travel is harder (phase advance) than westward (phase delay)
 */
function calculateRouteScore(circadian: CircadianContext): number {
  const tzShift = circadian.timezoneShift;

  // Minimal jetlag
  if (tzShift <= 2) return 10;

  // Direction penalty (eastward is harder)
  let difficultyMultiplier = 1.0;
  if (circadian.direction === 'eastbound') {
    difficultyMultiplier = 1.4; // 40% harder
  } else if (circadian.direction === 'westbound') {
    difficultyMultiplier = 0.8; // 20% easier
  }

  // Dateline crossing adds complexity
  if (circadian.crossesDateline) {
    difficultyMultiplier *= 1.2;
  }

  // Calculate difficulty (higher tzShift + multiplier = lower score)
  const baseDifficulty = tzShift * difficultyMultiplier;

  // Convert to 0-10 score (inversely proportional to difficulty)
  // 0-3 hours = 10-8, 3-6 hours = 8-5, 6-9 hours = 5-2, 9+ hours = 2-0
  const score = Math.max(0, 10 - (baseDifficulty / 1.2));

  return Number(score.toFixed(2));
}

/**
 * Calculate timing score based on circadian alignment
 * Best: Depart evening, arrive morning destination time
 * Worst: Depart morning, arrive evening (lose entire day)
 */
function calculateTimingScore(circadian: CircadianContext): number {
  const { departureLocalHour, arrivalLocalHour, direction } = circadian;

  let score = 5.0; // Neutral baseline

  if (direction === 'eastbound') {
    // Eastward: Best to depart late afternoon/evening (14-20)
    if (departureLocalHour >= 14 && departureLocalHour <= 20) {
      score += 2;
    } else if (departureLocalHour < 8 || departureLocalHour > 22) {
      score -= 2; // Very early or very late departures are stressful
    }

    // Eastward: Best to arrive morning (6-10)
    if (arrivalLocalHour >= 6 && arrivalLocalHour <= 10) {
      score += 3; // Arriving morning is ideal (can anchor circadian)
    } else if (arrivalLocalHour >= 22 || arrivalLocalHour < 4) {
      score -= 2; // Late night arrivals are worst
    }
  } else if (direction === 'westbound') {
    // Westward: More flexible, but morning departures are good
    if (departureLocalHour >= 7 && departureLocalHour <= 11) {
      score += 1;
    }

    // Westward: Afternoon/evening arrival is fine (helps stay awake)
    if (arrivalLocalHour >= 15 && arrivalLocalHour <= 20) {
      score += 2;
    } else if (arrivalLocalHour < 6) {
      score -= 1; // Very early arrival less ideal
    }
  }

  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate airport quality score
 * Better airports with recovery facilities reduce jetlag
 */
function calculateAirportScore(
  originAirport?: AirportQuality,
  destAirport?: AirportQuality,
  layoverAirport?: AirportQuality
): number {
  let totalScore = 0;
  let count = 0;

  if (originAirport) {
    // Origin airport less critical (just starting journey)
    totalScore += originAirport.stressScore * 0.3;
    count += 0.3;
  }

  if (destAirport) {
    // Destination airport more critical (arriving fatigued)
    totalScore += (destAirport.jetlagSupportScore * 0.7);
    count += 0.7;
  }

  if (layoverAirport) {
    // Layover airport very critical (opportunity to recover)
    totalScore += (layoverAirport.jetlagSupportScore * 0.8);
    count += 0.8;
  }

  // Default neutral if no airport data
  if (count === 0) return 5.0;

  return Number((totalScore / count).toFixed(2));
}

/**
 * Calculate duration score
 * Longer flights = more fatigue
 */
function calculateDurationScore(durationMinutes: number): number {
  const hours = durationMinutes / 60;

  // Excellent: <4 hours
  if (hours <= 4) return 10;

  // Linear scale from 4 hours (10) to 16 hours (0)
  const score = 10 - ((hours - 4) / 12) * 10;

  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate estimated recovery days
 *
 * NOTE: This uses conservative estimates for flight ranking/scoring
 * For actual recovery planning with aggressive mode support, use lib/jetlag/calculator.ts
 */
function calculateRecoveryDays(
  timezoneShift: number,
  direction: 'eastbound' | 'westbound' | 'neutral',
  userProfile?: UserProfile,
  recoveryMode?: 'conservative' | 'aggressive'
): number {
  if (timezoneShift <= 2) return 0; // Minimal jetlag

  // AGGRESSIVE MODE: Timeshifter-style 3-day cap
  if (recoveryMode === 'aggressive') {
    if (timezoneShift < 2) return 1;
    if (timezoneShift < 6) return 2;
    return 3; // Max 3 days regardless of shift
  }

  // CONSERVATIVE MODE (default for flight ranking)
  // Base recovery rate
  let baseRate = direction === 'eastbound' ? 1.0 : 1.5; // hours adjusted per day

  // User profile adjustments
  let multiplier = 1.0;

  if (userProfile) {
    // Age factor
    if (userProfile.age) {
      if (userProfile.age > 60) multiplier *= 1.3;
      else if (userProfile.age > 45) multiplier *= 1.15;
      else if (userProfile.age < 30) multiplier *= 0.9;
    }

    // Sleep quality
    switch (userProfile.sleepQuality) {
      case 'excellent': multiplier *= 0.85; break;
      case 'good': multiplier *= 0.95; break;
      case 'fair': multiplier *= 1.1; break;
      case 'poor': multiplier *= 1.3; break;
    }

    // Adaptability
    switch (userProfile.adaptabilityLevel) {
      case 'high': multiplier *= 0.8; break;
      case 'medium': multiplier *= 1.0; break;
      case 'low': multiplier *= 1.2; break;
    }

    // Exercise frequency
    switch (userProfile.exerciseFrequency) {
      case 'active': multiplier *= 0.9; break;
      case 'moderate': multiplier *= 0.95; break;
      case 'light': multiplier *= 1.0; break;
      case 'sedentary': multiplier *= 1.15; break;
    }
  }

  const days = (timezoneShift / baseRate) * multiplier;
  return Number(days.toFixed(1));
}

/**
 * Main jetlag scoring function
 */
export function calculateComprehensiveJetlagScore(params: {
  flight: FlightDetails;
  circadian: CircadianContext;
  aircraft?: AircraftData;
  airline?: AirlineServiceData;
  originAirport?: AirportQuality;
  destAirport?: AirportQuality;
  layoverAirport?: AirportQuality;
  userProfile?: UserProfile;
}): JetlagScoreResult {
  // Calculate component scores
  const aircraftScore = params.aircraft
    ? calculateAircraftScore(params.aircraft).overallScore
    : 5.0;

  const airlineScore = params.airline
    ? calculateAirlineScore(params.airline).overallScore
    : 5.0;

  const routeScore = calculateRouteScore(params.circadian);
  const timingScore = calculateTimingScore(params.circadian);
  const airportScore = calculateAirportScore(
    params.originAirport,
    params.destAirport,
    params.layoverAirport
  );
  const durationScore = calculateDurationScore(params.flight.duration);

  // Calculate weighted overall score
  const overallScore = (
    aircraftScore * 0.25 +
    airlineScore * 0.20 +
    routeScore * 0.20 +
    timingScore * 0.15 +
    airportScore * 0.10 +
    durationScore * 0.10
  );

  // Calculate recovery days
  const recoveryDays = calculateRecoveryDays(
    params.circadian.timezoneShift,
    params.circadian.direction,
    params.userProfile
  );

  // Determine severity
  let severity: JetlagScoreResult['severity'];
  let description: string;

  if (overallScore >= 8) {
    severity = 'minimal';
    description = 'Excellent flight for minimizing jetlag. Optimal conditions for quick recovery.';
  } else if (overallScore >= 6) {
    severity = 'mild';
    description = 'Good flight choice. Some jetlag expected but manageable with proper strategies.';
  } else if (overallScore >= 4) {
    severity = 'moderate';
    description = 'Moderate jetlag likely. Follow recovery plan carefully for best results.';
  } else if (overallScore >= 2) {
    severity = 'severe';
    description = 'Challenging flight for jetlag. Plan extra recovery time and follow all recommendations.';
  } else {
    severity = 'very-severe';
    description = 'Very difficult flight for jetlag. Consider alternative routes or pre-adjustment strategies.';
  }

  // Generate recommendations
  const recommendations = generateRecommendations({
    circadian: params.circadian,
    aircraftScore,
    airlineScore,
    routeScore,
    timingScore,
    recoveryDays,
  });

  return {
    score: Number(overallScore.toFixed(2)),
    recoveryDays,
    breakdown: {
      aircraft: Number(aircraftScore.toFixed(2)),
      airline: Number(airlineScore.toFixed(2)),
      route: Number(routeScore.toFixed(2)),
      timing: Number(timingScore.toFixed(2)),
      airport: Number(airportScore.toFixed(2)),
      duration: Number(durationScore.toFixed(2)),
    },
    severity,
    description,
    recommendations,
  };
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(data: {
  circadian: CircadianContext;
  aircraftScore: number;
  airlineScore: number;
  routeScore: number;
  timingScore: number;
  recoveryDays: number;
}): string[] {
  const recs: string[] = [];

  // Direction-specific advice
  if (data.circadian.direction === 'eastbound') {
    recs.push('Seek bright light in the afternoon (3-7 PM) on arrival day');
    recs.push('Consider taking 0.5-3mg melatonin 30min before destination bedtime');
  } else if (data.circadian.direction === 'westbound') {
    recs.push('Seek bright light in the morning (7-11 AM) on arrival day');
    recs.push('Stay awake until at least 9 PM local time on arrival');
  }

  // Aircraft-specific
  if (data.aircraftScore < 6) {
    recs.push('Stay extra hydrated - drink water regularly throughout flight');
    recs.push('Consider noise-canceling headphones for better sleep');
  }

  // Airline-specific
  if (data.airlineScore < 6) {
    recs.push('Bring your own sleep kit (eye mask, earplugs, neck pillow)');
  }

  // Route difficulty
  if (data.routeScore < 5) {
    recs.push(`Plan for ${Math.ceil(data.recoveryDays)} days of adjustment time`);
    recs.push('Consider pre-adjusting sleep schedule 2-3 days before departure');
  }

  // Timing issues
  if (data.timingScore < 5) {
    recs.push('Avoid scheduling important meetings on arrival day');
    recs.push('Build in buffer time for recovery');
  }

  // General advice
  recs.push('Avoid alcohol and caffeine 4+ hours before desired sleep time');
  recs.push('Light exercise (20-30 min walk) helps with adjustment');

  return recs.slice(0, 6); // Limit to 6 recommendations
}
