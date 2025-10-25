/**
 * Airport Jetlag Facilities Scoring Algorithm
 *
 * Scores airports based on jetlag recovery facilities and stress factors
 */

export interface AirportFacilitiesData {
  iataCode: string;
  airportName?: string;

  // Recovery facilities
  hasSleepPods?: boolean;
  hasQuietZones?: boolean;
  hasShowerFacilities?: boolean;
  hasNaturalLightAreas?: boolean;
  hasHealthyFoodOptions?: boolean;
  hasExerciseFacilities?: boolean;
  hasSpaServices?: boolean;
  hasMeditationRooms?: boolean;

  // Stress factors
  averageSecurityWaitMinutes?: number;
  averageImmigrationWaitMinutes?: number;
  terminalWalkingDistanceAvgMeters?: number;
  signageClarityScore?: number; // 0-100
  wifiQualityScore?: number; // 0-100
  noiseLevel?: 'quiet' | 'moderate' | 'loud';
}

export interface AirportScores {
  comfortScore: number;        // 0-10
  stressScore: number;         // 0-10 (lower = better)
  jetlagSupportScore: number;  // 0-10
  overallScore: number;        // 0-10
  breakdown: {
    facilitiesScore: number;   // 0-10
    waitTimesScore: number;    // 0-10
    navigationScore: number;   // 0-10
    amenitiesScore: number;    // 0-10
  };
  explanation: string;
}

function scoreFacilities(data: AirportFacilitiesData): number {
  const facilities = [
    data.hasSleepPods,
    data.hasQuietZones,
    data.hasShowerFacilities,
    data.hasNaturalLightAreas,
    data.hasHealthyFoodOptions,
    data.hasExerciseFacilities,
    data.hasSpaServices,
    data.hasMeditationRooms
  ];

  const availableCount = facilities.filter(Boolean).length;

  // Weight important facilities more
  let score = 0;
  if (data.hasSleepPods) score += 2.0;
  if (data.hasShowerFacilities) score += 1.5;
  if (data.hasQuietZones) score += 1.5;
  if (data.hasNaturalLightAreas) score += 1.0;
  if (data.hasHealthyFoodOptions) score += 1.0;
  if (data.hasExerciseFacilities) score += 1.0;
  if (data.hasSpaServices) score += 1.0;
  if (data.hasMeditationRooms) score += 1.0;

  return Math.min(10, score);
}

function scoreWaitTimes(securityMin?: number, immigrationMin?: number): number {
  let score = 10;

  if (securityMin) {
    if (securityMin <= 10) score -= 0;
    else if (securityMin <= 20) score -= 1;
    else if (securityMin <= 30) score -= 3;
    else score -= 5;
  }

  if (immigrationMin) {
    if (immigrationMin <= 15) score -= 0;
    else if (immigrationMin <= 30) score -= 1;
    else if (immigrationMin <= 45) score -= 3;
    else score -= 5;
  }

  return Math.max(0, score);
}

function scoreNavigation(
  walkingMeters?: number,
  signageScore?: number,
  wifiScore?: number,
  noiseLevel?: 'quiet' | 'moderate' | 'loud'
): number {
  let score = 5.0;

  // Walking distance
  if (walkingMeters) {
    if (walkingMeters <= 300) score += 2;
    else if (walkingMeters <= 600) score += 1;
    else if (walkingMeters <= 1000) score += 0;
    else score -= 2;
  }

  // Signage (0-100)
  if (signageScore) score += ((signageScore - 50) / 50) * 1.5;

  // WiFi (0-100)
  if (wifiScore) score += ((wifiScore - 50) / 50) * 1.5;

  // Noise
  const noiseScores = { quiet: 1, moderate: 0, loud: -1 };
  if (noiseLevel) score += noiseScores[noiseLevel];

  return Math.max(0, Math.min(10, score));
}

export function calculateAirportScore(airport: AirportFacilitiesData): AirportScores {
  const facilitiesScore = scoreFacilities(airport);
  const waitTimesScore = scoreWaitTimes(
    airport.averageSecurityWaitMinutes,
    airport.averageImmigrationWaitMinutes
  );
  const navigationScore = scoreNavigation(
    airport.terminalWalkingDistanceAvgMeters,
    airport.signageClarityScore,
    airport.wifiQualityScore,
    airport.noiseLevel
  );
  const amenitiesScore = facilitiesScore; // Duplicate for breakdown

  // Jetlag support = facilities
  const jetlagSupportScore = facilitiesScore;

  // Comfort = average of all positive factors
  const comfortScore = (facilitiesScore + navigationScore) / 2;

  // Stress = inverse of wait times and navigation issues
  const stressScore = 10 - ((waitTimesScore + navigationScore) / 2);

  // Overall = weighted composite
  const overallScore = (
    comfortScore * 0.40 +
    (10 - stressScore) * 0.35 +
    jetlagSupportScore * 0.25
  );

  const explanation = `${airport.iataCode} offers ${facilitiesScore >= 7 ? 'excellent' : facilitiesScore >= 4 ? 'good' : 'limited'} jetlag recovery facilities.`;

  return {
    comfortScore: Number(comfortScore.toFixed(2)),
    stressScore: Number(stressScore.toFixed(2)),
    jetlagSupportScore: Number(jetlagSupportScore.toFixed(2)),
    overallScore: Number(overallScore.toFixed(2)),
    breakdown: {
      facilitiesScore: Number(facilitiesScore.toFixed(2)),
      waitTimesScore: Number(waitTimesScore.toFixed(2)),
      navigationScore: Number(navigationScore.toFixed(2)),
      amenitiesScore: Number(amenitiesScore.toFixed(2)),
    },
    explanation
  };
}
