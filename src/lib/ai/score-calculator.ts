/**
 * Jetlag Ranking Score Calculator
 *
 * Implements the scoring algorithms for aircraft, airlines, and airports
 * based on jetlag impact factors and comfort metrics.
 *
 * Scoring follows the 40/25/20/15 composite ranking model:
 * - Aircraft comfort: 40%
 * - Airline service: 25%
 * - Timing optimization: 20%
 * - Airport facilities: 15%
 */

/**
 * Aircraft Scoring Algorithm
 *
 * Weights:
 * - Cabin Pressure Altitude: 30% (lower is better)
 * - Humidity: 20% (higher is better)
 * - Noise Level: 25% (lower is better)
 * - Comfort Factors: 25% (seat pitch, entertainment, bins)
 *
 * Scale: 0-10 (10 = best for jetlag recovery)
 */
export function calculateAircraftScore(factors: {
  cabinPressureAltitudeFeet: number;
  humidityPercent: number;
  noiseLevelDb: number;
  cabinAirRefreshRateMinutes: number;
  typicalSeatPitchInches?: number;
  windowSizeSqIn?: number;
  overheadBinSpaceCuFt?: number;
}): {
  jetlagBaseScore: number;
  comfortScore: number;
  overallScore: number;
} {
  // Normalize cabin pressure (6000-8000 ft typical, lower is better)
  const pressureScore = ((8000 - factors.cabinPressureAltitudeFeet) / 2000) * 10;
  const pressureNormalized = Math.max(0, Math.min(10, pressureScore));

  // Normalize humidity (10-20% typical, higher is better)
  const humidityScore = (factors.humidityPercent / 20) * 10;
  const humidityNormalized = Math.max(0, Math.min(10, humidityScore));

  // Normalize noise (70-85 dB typical, lower is better)
  const noiseScore = ((85 - factors.noiseLevelDb) / 15) * 10;
  const noiseNormalized = Math.max(0, Math.min(10, noiseScore));

  // Normalize air refresh (2-4 min typical, lower is better)
  const airScore = ((4 - factors.cabinAirRefreshRateMinutes) / 2) * 10;
  const airNormalized = Math.max(0, Math.min(10, airScore));

  // Jetlag base score (cabin environment factors)
  const jetlagBaseScore =
    pressureNormalized * 0.3 +
    humidityNormalized * 0.2 +
    noiseNormalized * 0.25 +
    airNormalized * 0.25;

  // Comfort score (passenger amenities)
  let comfortScore = 5.0; // Default mid-range

  if (factors.typicalSeatPitchInches) {
    // Seat pitch: 28-34 inches typical
    const seatScore = ((factors.typicalSeatPitchInches - 28) / 6) * 10;
    comfortScore = Math.max(0, Math.min(10, seatScore)) * 0.5;
  }

  if (factors.windowSizeSqIn) {
    // Window size: 150-300 sq in typical
    const windowScore = ((factors.windowSizeSqIn - 150) / 150) * 10;
    comfortScore += Math.max(0, Math.min(10, windowScore)) * 0.3;
  }

  if (factors.overheadBinSpaceCuFt) {
    // Bin space: 100-160 cu ft typical
    const binScore = ((factors.overheadBinSpaceCuFt - 100) / 60) * 10;
    comfortScore += Math.max(0, Math.min(10, binScore)) * 0.2;
  }

  // Overall score: 70% jetlag factors, 30% comfort
  const overallScore = jetlagBaseScore * 0.7 + comfortScore * 0.3;

  return {
    jetlagBaseScore: Math.round(jetlagBaseScore * 100) / 100,
    comfortScore: Math.round(comfortScore * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100,
  };
}

/**
 * Airline Service Scoring Algorithm
 *
 * Weights:
 * - Service Quality: 35% (meals, sleep kits, crew training)
 * - Reliability: 30% (on-time, delays, cancellations)
 * - Jetlag Awareness: 35% (programs, timing, light management)
 *
 * Scale: 0-10 (10 = best)
 */
export function calculateAirlineScore(factors: {
  // Service quality
  mealQualityRating?: number; // 1-5
  mealTimingFlexibility?: boolean;
  providesSleepKits?: boolean;
  sleepKitQuality?: 'basic' | 'standard' | 'premium';
  cabinCrewTrainingScore?: number; // 0-100

  // Reliability
  onTimePerformancePercent?: number; // 75-95
  delayMinutesAvg?: number; // 10-60
  cancellationRatePercent?: number; // 0.5-5

  // Jetlag programs
  offersJetlagMenu?: boolean;
  lightManagementStrategy?: boolean;
  sleepOptimizationPrograms?: boolean;
  melatoninAvailable?: boolean;

  // Amenities
  seatComfortRating?: number; // 1-5
  entertainmentQuality?: number; // 1-5
}): {
  serviceScore: number;
  reliabilityScore: number;
  jetlagAwarenessScore: number;
  overallScore: number;
} {
  // Service Quality Score (0-10)
  let serviceScore = 5.0;

  if (factors.mealQualityRating) {
    serviceScore = (factors.mealQualityRating / 5) * 10 * 0.3;
  }

  if (factors.providesSleepKits) {
    const kitScore = factors.sleepKitQuality === 'premium' ? 10 : factors.sleepKitQuality === 'standard' ? 7 : 5;
    serviceScore += kitScore * 0.25;
  }

  if (factors.cabinCrewTrainingScore) {
    serviceScore += (factors.cabinCrewTrainingScore / 100) * 10 * 0.25;
  }

  if (factors.seatComfortRating) {
    serviceScore += (factors.seatComfortRating / 5) * 10 * 0.2;
  }

  serviceScore = Math.min(10, serviceScore);

  // Reliability Score (0-10)
  let reliabilityScore = 5.0;

  if (factors.onTimePerformancePercent) {
    // 75-95% typical, normalize to 0-10
    reliabilityScore = ((factors.onTimePerformancePercent - 75) / 20) * 10 * 0.5;
  }

  if (factors.delayMinutesAvg) {
    // 10-60 min typical, lower is better
    const delayScore = ((60 - factors.delayMinutesAvg) / 50) * 10;
    reliabilityScore += Math.max(0, Math.min(10, delayScore)) * 0.3;
  }

  if (factors.cancellationRatePercent) {
    // 0.5-5% typical, lower is better
    const cancelScore = ((5 - factors.cancellationRatePercent) / 4.5) * 10;
    reliabilityScore += Math.max(0, Math.min(10, cancelScore)) * 0.2;
  }

  reliabilityScore = Math.max(0, Math.min(10, reliabilityScore));

  // Jetlag Awareness Score (0-10)
  let jetlagAwarenessScore = 0;

  if (factors.offersJetlagMenu) jetlagAwarenessScore += 3.0;
  if (factors.lightManagementStrategy) jetlagAwarenessScore += 2.5;
  if (factors.sleepOptimizationPrograms) jetlagAwarenessScore += 2.5;
  if (factors.melatoninAvailable) jetlagAwarenessScore += 1.0;
  if (factors.mealTimingFlexibility) jetlagAwarenessScore += 1.0;

  jetlagAwarenessScore = Math.min(10, jetlagAwarenessScore);

  // Overall score: weighted average
  const overallScore =
    serviceScore * 0.35 +
    reliabilityScore * 0.3 +
    jetlagAwarenessScore * 0.35;

  return {
    serviceScore: Math.round(serviceScore * 100) / 100,
    reliabilityScore: Math.round(reliabilityScore * 100) / 100,
    jetlagAwarenessScore: Math.round(jetlagAwarenessScore * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100,
  };
}

/**
 * Airport Facilities Scoring Algorithm
 *
 * Weights:
 * - Comfort/Recovery Facilities: 50% (sleep pods, quiet zones, showers)
 * - Stress Factors: 30% (wait times, walking distance, noise)
 * - Jetlag Support: 20% (healthy food, exercise, spa, meditation)
 *
 * Scale: 0-10 (10 = best for jetlag recovery)
 */
export function calculateAirportScore(factors: {
  // Recovery facilities
  hasSleepPods?: boolean;
  hasQuietZones?: boolean;
  hasShowerFacilities?: boolean;
  hasNaturalLightAreas?: boolean;

  // Wellness amenities
  hasHealthyFoodOptions?: boolean;
  hasExerciseFacilities?: boolean;
  hasSpaServices?: boolean;
  hasMeditationRooms?: boolean;

  // Stress factors
  averageSecurityWaitMinutes?: number; // 5-60
  averageImmigrationWaitMinutes?: number; // 10-90
  terminalWalkingDistanceAvgMeters?: number; // 200-1500
  signageClarityScore?: number; // 0-100
  wifiQualityScore?: number; // 0-100
  noiseLevel?: 'quiet' | 'moderate' | 'loud';
}): {
  comfortScore: number;
  stressScore: number;
  jetlagSupportScore: number;
  overallScore: number;
} {
  // Comfort/Recovery Facilities Score (0-10)
  let comfortScore = 0;

  if (factors.hasSleepPods) comfortScore += 3.0;
  if (factors.hasQuietZones) comfortScore += 2.5;
  if (factors.hasShowerFacilities) comfortScore += 2.5;
  if (factors.hasNaturalLightAreas) comfortScore += 2.0;

  comfortScore = Math.min(10, comfortScore);

  // Stress Score (0-10, inverted - lower stress = higher score)
  let stressScore = 10.0;

  if (factors.averageSecurityWaitMinutes) {
    // 5-60 min typical, lower is better
    const securityPenalty = ((factors.averageSecurityWaitMinutes - 5) / 55) * 3;
    stressScore -= Math.min(3, securityPenalty);
  }

  if (factors.averageImmigrationWaitMinutes) {
    // 10-90 min typical, lower is better
    const immigrationPenalty = ((factors.averageImmigrationWaitMinutes - 10) / 80) * 2;
    stressScore -= Math.min(2, immigrationPenalty);
  }

  if (factors.terminalWalkingDistanceAvgMeters) {
    // 200-1500 m typical, lower is better
    const walkingPenalty = ((factors.terminalWalkingDistanceAvgMeters - 200) / 1300) * 2;
    stressScore -= Math.min(2, walkingPenalty);
  }

  if (factors.signageClarityScore) {
    stressScore += (factors.signageClarityScore / 100) * 1.5;
  }

  if (factors.wifiQualityScore) {
    stressScore += (factors.wifiQualityScore / 100) * 1.5;
  }

  if (factors.noiseLevel === 'quiet') {
    stressScore += 1.0;
  } else if (factors.noiseLevel === 'loud') {
    stressScore -= 2.0;
  }

  stressScore = Math.max(0, Math.min(10, stressScore));

  // Jetlag Support Score (0-10)
  let jetlagSupportScore = 0;

  if (factors.hasHealthyFoodOptions) jetlagSupportScore += 3.0;
  if (factors.hasExerciseFacilities) jetlagSupportScore += 2.5;
  if (factors.hasSpaServices) jetlagSupportScore += 2.5;
  if (factors.hasMeditationRooms) jetlagSupportScore += 2.0;

  jetlagSupportScore = Math.min(10, jetlagSupportScore);

  // Overall score: weighted average
  const overallScore =
    comfortScore * 0.5 +
    stressScore * 0.3 +
    jetlagSupportScore * 0.2;

  return {
    comfortScore: Math.round(comfortScore * 100) / 100,
    stressScore: Math.round(stressScore * 100) / 100,
    jetlagSupportScore: Math.round(jetlagSupportScore * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100,
  };
}

/**
 * Composite Flight Ranking Score
 *
 * Combines all factors for overall jetlag impact:
 * - Aircraft comfort: 40%
 * - Airline service: 25%
 * - Timing optimization: 20%
 * - Airport facilities: 15%
 */
export function calculateCompositeScore(scores: {
  aircraftScore: number;
  airlineScore: number;
  timingScore: number;
  departureAirportScore: number;
  arrivalAirportScore: number;
}): number {
  const airportScore = (scores.departureAirportScore + scores.arrivalAirportScore) / 2;

  const composite =
    scores.aircraftScore * 0.4 +
    scores.airlineScore * 0.25 +
    scores.timingScore * 0.2 +
    airportScore * 0.15;

  return Math.round(composite * 100) / 100;
}
