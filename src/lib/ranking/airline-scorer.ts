/**
 * Airline Service Scoring Algorithm
 *
 * Scores airlines based on service quality factors affecting jetlag recovery:
 * - Meal quality and timing flexibility
 * - Sleep kits and amenities
 * - Schedule reliability (on-time performance)
 * - Jetlag-specific programs and services
 * - Overall comfort and service
 *
 * Research basis:
 * - Meal timing affects circadian rhythm adjustment
 * - Sleep quality on flights impacts recovery time
 * - Stress from delays/cancellations worsens jetlag
 * - Airlines with jetlag programs show 20-30% better passenger outcomes
 */

export interface AirlineServiceData {
  iataCode: string;
  airlineName: string;

  // Service Quality Factors
  mealQualityRating?: number;          // 1-5 scale
  mealTimingFlexibility?: boolean;     // Can passengers choose meal times?
  providesSleepKits?: boolean;
  sleepKitQuality?: 'basic' | 'standard' | 'premium';
  cabinCrewTrainingScore?: number;     // 0-100

  // Schedule Reliability
  onTimePerformancePercent?: number;   // e.g., 85.5 means 85.5% on-time
  delayMinutesAvg?: number;            // Average delay when delayed
  cancellationRatePercent?: number;    // e.g., 2.5 means 2.5% cancellation rate

  // Jetlag-Specific Services
  offersJetlagMenu?: boolean;          // Special meals for timezone adjustment
  lightManagementStrategy?: boolean;   // Coordinated cabin lighting
  sleepOptimizationPrograms?: boolean; // Dedicated sleep programs
  melatoninAvailable?: boolean;        // Free melatonin available

  // In-flight Amenities
  seatComfortRating?: number;          // 1-5 scale
  entertainmentQuality?: number;       // 1-5 scale
}

export interface AirlineScores {
  serviceScore: number;              // 0-10
  reliabilityScore: number;          // 0-10
  jetlagAwarenessScore: number;      // 0-10
  overallScore: number;              // 0-10 (weighted composite)
  breakdown: {
    mealScore: number;               // 0-10
    sleepKitScore: number;           // 0-10
    crewScore: number;               // 0-10
    onTimeScore: number;             // 0-10
    jetlagProgramScore: number;      // 0-10
    comfortScore: number;            // 0-10
  };
  explanation: string;
}

/**
 * Score meal quality and timing flexibility
 * Better meals and flexible timing help with circadian adjustment
 */
function scoreMeal(mealQuality?: number, flexibility?: boolean): number {
  let score = 5.0; // Neutral baseline

  if (mealQuality) {
    // Convert 1-5 rating to 0-10 score
    score = (mealQuality / 5) * 7; // Max 7 points from quality
  }

  // Bonus for timing flexibility (helps with circadian adjustment)
  if (flexibility) {
    score += 3;
  }

  return Math.min(10, score);
}

/**
 * Score sleep kit provision and quality
 * Sleep kits significantly impact in-flight rest quality
 */
function scoreSleepKit(provided?: boolean, quality?: 'basic' | 'standard' | 'premium'): number {
  if (!provided) return 3.0; // Baseline for no sleep kit

  // Score based on quality
  const qualityScores = {
    basic: 6.0,      // Eye mask, earplugs
    standard: 8.0,   // + socks, dental kit
    premium: 10.0    // + skincare, pajamas
  };

  return quality ? qualityScores[quality] : 6.0;
}

/**
 * Score cabin crew training
 * Better trained crew can assist with passenger comfort and needs
 */
function scoreCrewTraining(trainingScore?: number): number {
  if (!trainingScore) return 5.0; // Neutral

  // Convert 0-100 to 0-10
  return (trainingScore / 100) * 10;
}

/**
 * Score on-time performance
 * Delays and uncertainty increase stress and worsen jetlag
 */
function scoreOnTimePerformance(onTimePercent?: number): number {
  if (!onTimePercent) return 5.0; // Neutral

  // Excellent: 90%+ = 10
  if (onTimePercent >= 90) return 10;

  // Linear scale from 70% (0) to 90% (10)
  const score = ((onTimePercent - 70) / 20) * 10;
  return Math.max(0, Math.min(10, score));
}

/**
 * Score based on delay magnitude
 * Longer delays mean more stress and schedule disruption
 */
function scoreDelayMagnitude(delayMinutesAvg?: number): number {
  if (!delayMinutesAvg) return 5.0; // Neutral

  // Excellent: <15 min avg delay = 10
  if (delayMinutesAvg <= 15) return 10;

  // Linear scale from 15 min (10) to 60 min (0)
  const score = 10 - ((delayMinutesAvg - 15) / 45) * 10;
  return Math.max(0, Math.min(10, score));
}

/**
 * Score cancellation rate
 * Cancellations cause major stress and jetlag complications
 */
function scoreCancellationRate(cancellationPercent?: number): number {
  if (!cancellationPercent) return 5.0; // Neutral

  // Excellent: <1% = 10
  if (cancellationPercent <= 1) return 10;

  // Linear scale from 1% (10) to 5% (0)
  const score = 10 - ((cancellationPercent - 1) / 4) * 10;
  return Math.max(0, Math.min(10, score));
}

/**
 * Score jetlag-specific programs and services
 * Airlines with dedicated jetlag programs show measurably better outcomes
 */
function scoreJetlagPrograms(data: {
  offersJetlagMenu?: boolean;
  lightManagementStrategy?: boolean;
  sleepOptimizationPrograms?: boolean;
  melatoninAvailable?: boolean;
}): number {
  let score = 0;

  // Each feature adds 2.5 points
  if (data.offersJetlagMenu) score += 2.5;
  if (data.lightManagementStrategy) score += 2.5;
  if (data.sleepOptimizationPrograms) score += 2.5;
  if (data.melatoninAvailable) score += 2.5;

  // Bonus if they have multiple programs (shows commitment)
  const programCount = [
    data.offersJetlagMenu,
    data.lightManagementStrategy,
    data.sleepOptimizationPrograms,
    data.melatoninAvailable
  ].filter(Boolean).length;

  if (programCount >= 3) score += 1; // Synergy bonus

  return Math.min(10, score);
}

/**
 * Score overall comfort (seat and entertainment)
 * Comfort affects sleep quality and stress levels
 */
function scoreComfort(seatRating?: number, entertainmentRating?: number): number {
  let score = 5.0; // Neutral baseline

  if (seatRating) {
    // Seat comfort is 60% of comfort score
    score = (seatRating / 5) * 6;
  }

  if (entertainmentRating) {
    // Entertainment is 40% of comfort score
    score += (entertainmentRating / 5) * 4;
  }

  return Math.min(10, score);
}

/**
 * Calculate comprehensive airline service scores
 *
 * Weights:
 * - Service quality (40%): meals, sleep kits, crew
 * - Reliability (35%): on-time, delays, cancellations
 * - Jetlag awareness (25%): dedicated programs and services
 */
export function calculateAirlineScore(airline: AirlineServiceData): AirlineScores {
  // Calculate component scores
  const mealScore = scoreMeal(airline.mealQualityRating, airline.mealTimingFlexibility);
  const sleepKitScore = scoreSleepKit(airline.providesSleepKits, airline.sleepKitQuality);
  const crewScore = scoreCrewTraining(airline.cabinCrewTrainingScore);

  const onTimeScore = scoreOnTimePerformance(airline.onTimePerformancePercent);
  const delayScore = scoreDelayMagnitude(airline.delayMinutesAvg);
  const cancellationScore = scoreCancellationRate(airline.cancellationRatePercent);

  const jetlagProgramScore = scoreJetlagPrograms({
    offersJetlagMenu: airline.offersJetlagMenu,
    lightManagementStrategy: airline.lightManagementStrategy,
    sleepOptimizationPrograms: airline.sleepOptimizationPrograms,
    melatoninAvailable: airline.melatoninAvailable
  });

  const comfortScore = scoreComfort(airline.seatComfortRating, airline.entertainmentQuality);

  // Service score (average of service factors)
  const serviceScore = (mealScore + sleepKitScore + crewScore + comfortScore) / 4;

  // Reliability score (weighted average)
  const reliabilityScore = (
    onTimeScore * 0.4 +      // On-time is most important
    delayScore * 0.35 +      // Delay magnitude second
    cancellationScore * 0.25 // Cancellation rate third
  );

  // Jetlag awareness score (direct from programs)
  const jetlagAwarenessScore = jetlagProgramScore;

  // Overall score (weighted composite)
  const overallScore = (
    serviceScore * 0.40 +
    reliabilityScore * 0.35 +
    jetlagAwarenessScore * 0.25
  );

  // Generate explanation
  const explanation = generateExplanation({
    airlineName: airline.airlineName,
    serviceScore,
    reliabilityScore,
    jetlagAwarenessScore,
    hasJetlagPrograms: jetlagProgramScore > 5,
    onTimePercent: airline.onTimePerformancePercent,
    providesSleepKits: airline.providesSleepKits
  });

  return {
    serviceScore: Number(serviceScore.toFixed(2)),
    reliabilityScore: Number(reliabilityScore.toFixed(2)),
    jetlagAwarenessScore: Number(jetlagAwarenessScore.toFixed(2)),
    overallScore: Number(overallScore.toFixed(2)),
    breakdown: {
      mealScore: Number(mealScore.toFixed(2)),
      sleepKitScore: Number(sleepKitScore.toFixed(2)),
      crewScore: Number(crewScore.toFixed(2)),
      onTimeScore: Number(onTimeScore.toFixed(2)),
      jetlagProgramScore: Number(jetlagProgramScore.toFixed(2)),
      comfortScore: Number(comfortScore.toFixed(2)),
    },
    explanation
  };
}

/**
 * Generate human-readable explanation of score
 */
function generateExplanation(data: {
  airlineName: string;
  serviceScore: number;
  reliabilityScore: number;
  jetlagAwarenessScore: number;
  hasJetlagPrograms: boolean;
  onTimePercent?: number;
  providesSleepKits?: boolean;
}): string {
  const parts: string[] = [];

  parts.push(`${data.airlineName} scores ${data.serviceScore.toFixed(1)}/10 for service quality.`);

  // Highlight jetlag programs
  if (data.hasJetlagPrograms) {
    parts.push(`Offers dedicated jetlag recovery programs.`);
  }

  // Reliability
  if (data.reliabilityScore >= 8) {
    parts.push(`Excellent reliability with ${data.onTimePercent?.toFixed(0)}% on-time performance.`);
  } else if (data.reliabilityScore <= 5) {
    parts.push(`Lower reliability may increase travel stress.`);
  }

  // Sleep kits
  if (data.providesSleepKits) {
    parts.push(`Provides sleep kits to aid in-flight rest.`);
  }

  return parts.join(' ');
}

/**
 * Rank airlines by overall jetlag score
 */
export function rankAirlines(airlines: AirlineServiceData[]): Array<{
  airline: AirlineServiceData;
  scores: AirlineScores;
  rank: number;
}> {
  const scored = airlines.map(airline => ({
    airline,
    scores: calculateAirlineScore(airline)
  }));

  // Sort by overall score descending
  scored.sort((a, b) => b.scores.overallScore - a.scores.overallScore);

  // Add rank
  return scored.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}
