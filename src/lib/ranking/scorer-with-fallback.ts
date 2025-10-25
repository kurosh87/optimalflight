/**
 * Holistic Scorer with Error Handling & Graceful Degradation
 *
 * Wraps the holistic scorer with multiple fallback strategies:
 * 1. Full holistic scoring (all 4 dimensions)
 * 2. Partial scoring (circadian + basic factors)
 * 3. Basic scoring (only Kiwi data)
 *
 * NEVER fails - always returns a score
 */

import type { CompleteFlightOption, HolisticFlightScore } from './holistic-scorer';
import { calculateTimezoneShiftWithDirection, calculatePersonalizedRecoveryDays } from '../jetlag/calculator';

// ============================================================================
// FALLBACK SCORING LEVELS
// ============================================================================

/**
 * Level 1: Basic scoring using only Kiwi API data
 * No database enrichment required
 */
function scoreFlightBasic(flight: CompleteFlightOption): HolisticFlightScore {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  // Calculate timezone shift
  const { direction, actualShiftHours } = calculateTimezoneShiftWithDirection(
    firstSegment.originTimezone,
    lastSegment.destinationTimezone,
    firstSegment.departureTime
  );

  const estimatedRecoveryDays = calculatePersonalizedRecoveryDays(actualShiftHours, direction);

  // Basic circadian score (timing only, no enrichment)
  const departureHour = firstSegment.departureTime.getHours();
  const arrivalHour = lastSegment.arrivalTime.getHours();

  let circadianScore = 50; // Neutral base

  if (direction === 'east') {
    // Eastward: overnight flights preferred
    const isOvernightish = departureHour >= 16 && arrivalHour <= 12;
    circadianScore = isOvernightish ? 70 : 40;
  } else if (direction === 'west') {
    // Westward: day flights preferred
    const isDayish = departureHour >= 8 && departureHour <= 16;
    circadianScore = isDayish ? 70 : 40;
  }

  // Basic efficiency score
  const efficiencyScore = flight.stops === 0 ? 80 : 60 - (flight.stops * 10);

  // Overall score (simplified)
  const overallJetlagScore = (circadianScore * 0.6) + (efficiencyScore * 0.4);

  return {
    flightId: flight.id,
    overallJetlagScore,
    circadianScore,
    comfortScore: 50, // Neutral
    strategyScore: flight.stops === 0 ? 70 : 50,
    efficiencyScore,
    components: {
      departureTimingScore: circadianScore,
      arrivalTimingScore: circadianScore,
      bodyClockAlignmentScore: 50,
      lightExposureOpportunityScore: 50,
      aircraftQualityScore: 50,
      airlineQualityScore: 50,
      seatComfortScore: 50,
      cabinEnvironmentScore: 50,
      routingLogicScore: 70,
      layoverQualityScore: 50,
      airportFacilitiesScore: 50,
      phasingStrategyScore: 50,
      durationEfficiencyScore: efficiencyScore,
      distanceEfficiencyScore: 70,
      valueForTimeScore: 60,
      stressLevelScore: 70,
    },
    estimatedRecoveryDays,
    comparedToWorstOption: {
      recoveryDaysReduction: 0,
      percentageImprovement: 0,
    },
    tradeoffs: {},
    recommendation: overallJetlagScore >= 70 ? 'good' : overallJetlagScore >= 50 ? 'acceptable' : 'poor',
    userPersona: {
      bestFor: ['Flexible travelers'],
      notIdealFor: [],
    },
    strengths: [
      flight.stops === 0 ? 'Direct flight' : `${flight.stops} connection(s)`,
      `${direction} travel`,
    ],
    weaknesses: [
      'Limited data available - scores based on basic factors only',
    ],
    criticalFactors: [
      '⚠️ Enrichment data unavailable - using conservative estimates',
    ],
    recommendations: [
      'Verify aircraft and airline details for accurate jetlag assessment',
      `Est. recovery: ${estimatedRecoveryDays} days`,
    ],
    scenarios: {
      ifYouMustArriveRested: {
        score: circadianScore,
        recommendation: 'Verify timing with full data before booking',
      },
      ifYouHaveTimeFlexibility: {
        score: 60,
        recommendation: 'Consider flights at different times for better options',
      },
      ifYouValueSpeed: {
        score: efficiencyScore,
        recommendation: flight.stops === 0 ? 'Direct flight - good choice' : 'Consider direct options',
      },
      ifYouValueComfort: {
        score: 50,
        recommendation: 'Check aircraft type and airline for comfort assessment',
      },
    },
  };
}

/**
 * Level 2: Partial scoring with some enrichment
 * Uses whatever data is available from the enrichment attempt
 */
function scoreFlightPartial(
  flight: CompleteFlightOption,
  allFlights: CompleteFlightOption[]
): HolisticFlightScore {
  // Use basic scoring as foundation
  const basicScore = scoreFlightBasic(flight);

  // Add any available enrichment data
  const hasAircraftData = flight.segments.some(s => s.aircraft && s.aircraft.sleepScore !== undefined);
  const hasAirlineData = flight.segments.some(s => s.airline && s.airline.serviceQuality !== undefined);

  if (hasAircraftData) {
    const avgAircraftScore = flight.segments.reduce((sum, s) =>
      sum + (s.aircraft?.sleepScore || 5), 0
    ) / flight.segments.length;

    basicScore.comfortScore = (avgAircraftScore / 10) * 100;
    basicScore.components.aircraftQualityScore = basicScore.comfortScore;
  }

  if (hasAirlineData) {
    const avgAirlineScore = flight.segments.reduce((sum, s) =>
      sum + (s.airline?.serviceQuality || 5), 0
    ) / flight.segments.length;

    basicScore.components.airlineQualityScore = (avgAirlineScore / 10) * 100;
  }

  // Recalculate overall with partial data
  basicScore.overallJetlagScore = (
    basicScore.circadianScore * 0.4 +
    basicScore.comfortScore * 0.25 +
    basicScore.strategyScore * 0.2 +
    basicScore.efficiencyScore * 0.15
  );

  // Update recommendation
  if (basicScore.overallJetlagScore >= 80) {
    basicScore.recommendation = 'excellent';
  } else if (basicScore.overallJetlagScore >= 65) {
    basicScore.recommendation = 'good';
  } else if (basicScore.overallJetlagScore >= 50) {
    basicScore.recommendation = 'acceptable';
  } else {
    basicScore.recommendation = 'poor';
  }

  // Add warning about partial data
  basicScore.weaknesses = [
    'Partial data available - some scores estimated',
    ...basicScore.weaknesses.filter(w => !w.includes('Limited data')),
  ];

  return basicScore;
}

/**
 * Level 3: Full holistic scoring (requires full enrichment)
 * This is imported from the main holistic-scorer when available
 */
export function scoreFlightWithFallbacks(
  flight: CompleteFlightOption,
  allFlights: CompleteFlightOption[],
  scoreFlightHolistically?: (flight: CompleteFlightOption, allFlights: CompleteFlightOption[]) => HolisticFlightScore
): HolisticFlightScore {
  // ATTEMPT 1: Full holistic scoring
  if (scoreFlightHolistically) {
    try {
      const fullScore = scoreFlightHolistically(flight, allFlights);
      return fullScore;
    } catch (error) {
      console.error('[Scorer] Full holistic scoring failed:', error);
      console.log('[Scorer] Falling back to partial scoring...');
    }
  }

  // ATTEMPT 2: Partial scoring with available data
  try {
    const partialScore = scoreFlightPartial(flight, allFlights);
    return partialScore;
  } catch (error) {
    console.error('[Scorer] Partial scoring failed:', error);
    console.log('[Scorer] Falling back to basic scoring...');
  }

  // ATTEMPT 3: Basic scoring (always works)
  return scoreFlightBasic(flight);
}

/**
 * Export default basic scorer for when holistic scorer isn't available
 */
export { scoreFlightBasic, scoreFlightPartial };

/**
 * Helper to check if enrichment data is sufficient for full scoring
 */
export function hasMinimalEnrichmentData(flight: CompleteFlightOption): boolean {
  return flight.segments.every(s =>
    s.aircraft &&
    s.airline &&
    s.originTimezone &&
    s.destinationTimezone
  );
}

/**
 * Confidence level based on available data
 */
export function calculateScoreConfidence(score: HolisticFlightScore): {
  confidence: 'high' | 'medium' | 'low';
  reason: string;
} {
  // Check for default/fallback indicators
  const hasWarnings = score.weaknesses.some(w =>
    w.includes('Limited data') || w.includes('Partial data')
  );

  if (hasWarnings) {
    const isPartial = score.weaknesses.some(w => w.includes('Partial data'));
    return {
      confidence: isPartial ? 'medium' : 'low',
      reason: isPartial
        ? 'Some enrichment data available but incomplete'
        : 'Limited data - using basic scoring only',
    };
  }

  return {
    confidence: 'high',
    reason: 'Full enrichment data with holistic scoring',
  };
}
