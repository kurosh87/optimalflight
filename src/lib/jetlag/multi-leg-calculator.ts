/**
 * Multi-Leg Jetlag Recovery Algorithm
 *
 * KEY PRINCIPLE: Calculate timezone shift from ORIGIN to FINAL DESTINATION only.
 * Layovers are opportunities to progressively adapt, not separate jetlag events.
 *
 * Algorithm:
 * 1. Calculate total shift: origin → final destination (ignore intermediate legs)
 * 2. Calculate progressive adaptation rate: totalShift / totalDaysEnRoute
 * 3. Each layover: shift N hours/day toward final destination
 * 4. Final destination: complete remaining adaptation
 *
 * Example: LAX → NRT (12h) → SIN (18h) → SYD
 * - Total shift: LAX → SYD = 19 hours westward (not leg-by-leg sum)
 * - Days en route: 0.5 days (NRT) + 0.75 days (SIN) = 1.25 days
 * - Progression rate: 19h / 1.25d = 15.2 hours/day
 * - At SYD arrival: Already adapted ~19h, minimal remaining jetlag
 */

import {
  calculateTimezoneShiftWithDirection,
  calculatePersonalizedRecoveryDays,
  generateDaySleepSchedule,
  SafetyInformation,
  EnvironmentOptimization,
  generateSafetyInformation,
  generateEnvironmentOptimization,
} from './calculator';

import type { DayPlan } from '../utils/hourly-plan';

/**
 * Represents a single flight leg in a multi-leg journey
 */
export interface FlightLeg {
  flightNumber?: string;
  airline?: string;
  originTimezone: string;
  originCity: string;
  originAirportCode: string;
  destinationTimezone: string;
  destinationCity: string;
  destinationAirportCode: string;
  departureTime: Date;
  arrivalTime: Date;
  flightDuration: number; // hours
}

/**
 * Layover between flight legs
 */
export interface Layover {
  city: string;
  timezone: string;
  duration: number; // hours
  arrivalTime: Date;
  departureTime: Date;
}

/**
 * Complete multi-leg journey
 */
export interface MultiLegJourney {
  legs: FlightLeg[];
  layovers: Layover[];
  userPreferences?: {
    age?: number;
    sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
    adaptabilityLevel?: 'low' | 'medium' | 'high';
    exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';
  };
}

/**
 * Adaptation strategy for a specific location
 */
export type AdaptationStrategy =
  | 'progressive'        // Gradually shift toward final destination
  | 'anchor_sleep'       // Maintain origin sleep schedule (short layovers)

/**
 * Leg-specific adaptation plan
 */
export interface LegAdaptation {
  legIndex: number;
  location: string;
  timezone: string;
  strategy: AdaptationStrategy;
  cumulativeShiftHours: number; // How many hours shifted from origin so far
  remainingShift: number; // Hours remaining to adapt at final destination
  sleepSchedule: {
    bedtime: Date;
    wakeTime: Date;
    duration: number;
    notes: string;
  };
  recommendations: string[];
  reasoning: string;
}

/**
 * Complete multi-leg jetlag plan
 */
export interface MultiLegJetlagPlan {
  totalJourneyDays: number;
  finalRecoveryDays: number;
  totalTimezoneShift: number; // Origin → destination only
  direction: 'east' | 'west' | 'none';
  progressionRate: number; // Hours adapted per day en route
  legAdaptations: LegAdaptation[];
  dayPlans: DayPlan[];
  safetyInformation: SafetyInformation;
  environmentOptimization: EnvironmentOptimization;
}

/**
 * Main function: Calculate multi-leg jetlag recovery plan
 */
export function calculateMultiLegJetlagPlan(journey: MultiLegJourney): MultiLegJetlagPlan {
  const { legs, layovers, userPreferences } = journey;

  if (legs.length === 0) {
    throw new Error('Journey must have at least one leg');
  }

  // STEP 1: Calculate TOTAL shift (origin → final destination ONLY)
  const originTimezone = legs[0].originTimezone;
  const finalTimezone = legs[legs.length - 1].destinationTimezone;
  const departureTime = legs[0].departureTime;
  const finalArrivalTime = legs[legs.length - 1].arrivalTime;

  const { actualShiftHours, direction } = calculateTimezoneShiftWithDirection(
    originTimezone,
    finalTimezone,
    departureTime
  );

  // STEP 2: Calculate total time en route (for progressive adaptation)
  const totalHoursEnRoute = layovers.reduce((sum, layover) => sum + layover.duration, 0);
  const totalDaysEnRoute = totalHoursEnRoute / 24;

  // STEP 3: Calculate progressive adaptation rate with physiological constraints
  // Research shows maximum circadian shift rates:
  // - Eastward: ~1.0-1.2 hours per day (advancing clock is harder)
  // - Westward: ~1.5-1.8 hours per day (delaying clock is easier)
  const maxShiftPerDay = direction === 'east' ? 1.2 : 1.8;

  // Calculate theoretical rate (what we'd need to fully adapt)
  const theoreticalRate = totalDaysEnRoute > 0 ? actualShiftHours / totalDaysEnRoute : 0;

  // Use the MINIMUM of theoretical vs. physiological maximum
  // You can't shift faster than your circadian rhythm allows
  const progressionRate = Math.min(theoreticalRate, maxShiftPerDay);

  // STEP 4: Generate leg-specific adaptations
  const legAdaptations: LegAdaptation[] = [];
  let cumulativeShiftSoFar = 0;

  // Pre-flight at origin
  const originLeg = legs[0];

  // Calculate pre-flight sleep schedule (night before departure)
  // Normal sleep: 10 PM - 6 AM
  // If departure is before 6 AM, use previous night's sleep
  // If departure is after 6 AM, use the night before (previous calendar day)
  const departureHour = departureTime.getHours();

  const bedtime = new Date(departureTime);
  const wakeTime = new Date(departureTime);

  if (departureHour < 6) {
    // Early morning departure - use previous night (2 days back at 10 PM)
    bedtime.setDate(bedtime.getDate() - 2);
    bedtime.setHours(22, 0, 0, 0);
    wakeTime.setDate(wakeTime.getDate() - 1);
    wakeTime.setHours(6, 0, 0, 0);
  } else {
    // Day or evening departure - use previous night
    bedtime.setDate(bedtime.getDate() - 1);
    bedtime.setHours(22, 0, 0, 0);
    wakeTime.setHours(6, 0, 0, 0); // Same day as departure
  }

  legAdaptations.push({
    legIndex: -1,
    location: originLeg.originCity,
    timezone: originLeg.originTimezone,
    strategy: 'anchor_sleep',
    cumulativeShiftHours: 0,
    remainingShift: actualShiftHours,
    sleepSchedule: {
      bedtime,
      wakeTime,
      duration: 8,
      notes: 'Get good rest before departure',
    },
    recommendations: [
      'Get 7-8 hours of quality sleep before departure',
      'Begin hydration 24 hours before flight',
      'Avoid alcohol the night before',
      direction === 'east'
        ? 'Consider going to bed 1-2 hours earlier than usual'
        : 'Consider going to bed 1-2 hours later than usual',
    ],
    reasoning: 'Pre-flight preparation at origin location',
  });

  // Process each layover
  for (let i = 0; i < layovers.length; i++) {
    const layover = layovers[i];
    const daysAtLocation = layover.duration / 24;

    let strategy: AdaptationStrategy;
    let shiftDuringLayover = 0;

    if (layover.duration < 8) {
      // Very short layover (<8h): Don't adapt at all
      strategy = 'anchor_sleep';
      shiftDuringLayover = 0;
    } else if (layover.duration < 24) {
      // Short layover (8-24h): Minimal adaptation
      strategy = 'anchor_sleep';
      shiftDuringLayover = 0;
    } else {
      // Medium/long layover (≥24h): Progressive adaptation
      strategy = 'progressive';
      shiftDuringLayover = progressionRate * daysAtLocation;

      // Don't over-adapt beyond total shift
      if (cumulativeShiftSoFar + shiftDuringLayover > actualShiftHours) {
        shiftDuringLayover = actualShiftHours - cumulativeShiftSoFar;
      }
    }

    cumulativeShiftSoFar += shiftDuringLayover;
    const remainingShift = actualShiftHours - cumulativeShiftSoFar;

    // Generate sleep schedule based on strategy
    let sleepSchedule: { bedtime: Date; wakeTime: Date; duration: number; notes: string };

    if (strategy === 'anchor_sleep') {
      // Anchor sleep: maintain origin schedule (no shift)
      const sleepSchedules = generateDaySleepSchedule(
        layover.arrivalTime,
        direction,
        0, // Day 0 = origin schedule
        actualShiftHours
      );
      sleepSchedule = {
        bedtime: sleepSchedules[0].bedtime,
        wakeTime: sleepSchedules[0].wakeTime,
        duration: sleepSchedules[0].duration,
        notes: sleepSchedules[0].notes,
      };
    } else {
      // Progressive: calculate intermediate schedule
      // Base times: 22:00 bedtime, 06:00 wake (8h sleep)
      const baseBedtimeHour = 22;
      const baseWakeHour = 6;

      // Shift direction: westward = delay (add hours), eastward = advance (subtract hours)
      const shiftMultiplier = direction === 'west' ? 1 : -1;

      // Calculate intermediate times
      let bedtimeHour = baseBedtimeHour + (cumulativeShiftSoFar * shiftMultiplier);
      let wakeHour = baseWakeHour + (cumulativeShiftSoFar * shiftMultiplier);

      // Normalize to 0-24 range
      while (bedtimeHour < 0) bedtimeHour += 24;
      while (bedtimeHour >= 24) bedtimeHour -= 24;
      while (wakeHour < 0) wakeHour += 24;
      while (wakeHour >= 24) wakeHour -= 24;

      // Create Date objects in local timezone
      const bedtime = new Date(layover.arrivalTime);
      bedtime.setHours(Math.floor(bedtimeHour), Math.round((bedtimeHour % 1) * 60), 0, 0);

      const wakeTime = new Date(bedtime);
      wakeTime.setDate(wakeTime.getDate() + 1); // Next day
      wakeTime.setHours(Math.floor(wakeHour), Math.round((wakeHour % 1) * 60), 0, 0);

      sleepSchedule = {
        bedtime,
        wakeTime,
        duration: 8,
        notes: `Progressive adaptation: ${cumulativeShiftSoFar.toFixed(1)}h shifted from origin`,
      };
    }

    // Generate recommendations
    const recommendations: string[] = [];
    let reasoning = '';

    if (strategy === 'anchor_sleep') {
      reasoning = `Short layover (${layover.duration.toFixed(1)}h). Maintain origin sleep schedule to avoid disruption.`;
      recommendations.push(
        'Keep your origin timezone sleep schedule',
        'Avoid trying to adapt - you\'ll be leaving soon',
        'Use 20-30 minute naps if needed for alertness',
        'Stay in dim light during your origin bedtime',
        'Seek bright light during your origin wake hours',
      );
    } else {
      reasoning = `Layover of ${layover.duration.toFixed(1)}h allows progressive adaptation. Shifting ${shiftDuringLayover.toFixed(1)}h toward final destination (rate: ${progressionRate.toFixed(1)}h/day).`;
      recommendations.push(
        `Shift sleep schedule ${shiftDuringLayover.toFixed(1)} hours toward final destination`,
        `You've now adapted ${cumulativeShiftSoFar.toFixed(1)}h of ${actualShiftHours.toFixed(1)}h total (${((cumulativeShiftSoFar / actualShiftHours) * 100).toFixed(0)}%)`,
        direction === 'east'
          ? 'Seek bright morning light to advance your clock'
          : 'Seek bright evening light to delay your clock',
        'Eat meals at intermediate schedule times',
        'Light exercise helps reinforce new rhythm',
      );
    }

    legAdaptations.push({
      legIndex: i,
      location: layover.city,
      timezone: layover.timezone,
      strategy,
      cumulativeShiftHours: cumulativeShiftSoFar,
      remainingShift,
      sleepSchedule,
      recommendations,
      reasoning,
    });
  }

  // STEP 5: Final destination recovery
  // Only need to adapt the REMAINING shift (total - already adapted)
  const remainingShiftAtDestination = actualShiftHours - cumulativeShiftSoFar;

  const finalRecoveryDays = calculatePersonalizedRecoveryDays(
    remainingShiftAtDestination,
    direction,
    userPreferences
  );

  // STEP 6: Generate day-by-day plan for final destination
  const dayPlans: DayPlan[] = [];

  for (let day = 0; day <= finalRecoveryDays; day++) {
    const currentDate = new Date(finalArrivalTime);
    currentDate.setDate(currentDate.getDate() + day);

    const sleepSchedules = generateDaySleepSchedule(
      currentDate,
      direction,
      day,
      remainingShiftAtDestination // Use remaining shift, not total
    );

    dayPlans.push({
      date: currentDate,
      day,
      dayNumber: day,
      phase: day === 0 ? 'Arrival Day' : day < finalRecoveryDays / 2 ? 'Active Recovery' : 'Final Adjustment',
      sleepSchedules,
      lightExposure: [], // Could be populated with detailed light therapy
      meals: [], // Could be populated with meal timing
      activities: [], // Could be populated with exercise recommendations
      supplements: [], // Could be populated with melatonin timing
      hourlyPlan: [], // For compatibility with DayPlan interface
      keyGoals: [
        'Follow sleep schedule',
        'Get appropriate light exposure',
        'Stay hydrated and eat at local mealtimes'
      ]
    } as any);
  }

  // STEP 7: Safety and environment information
  const safetyInformation = generateSafetyInformation(userPreferences);
  const environmentOptimization = generateEnvironmentOptimization();

  // Calculate total journey days
  const totalJourneyDays = Math.ceil(totalDaysEnRoute) + finalRecoveryDays;

  return {
    totalJourneyDays,
    finalRecoveryDays,
    totalTimezoneShift: actualShiftHours,
    direction,
    progressionRate,
    legAdaptations,
    dayPlans,
    safetyInformation,
    environmentOptimization,
  };
}

/**
 * Helper: Convert flight data to FlightLeg format
 */
export function createFlightLeg(flight: {
  flightNumber?: string;
  airline?: string;
  originTimezone: string;
  originCity: string;
  originAirportCode: string;
  destinationTimezone: string;
  destinationCity: string;
  destinationAirportCode: string;
  departureTime: Date;
  arrivalTime: Date;
  flightDuration: number;
}): FlightLeg {
  return {
    flightNumber: flight.flightNumber,
    airline: flight.airline,
    originTimezone: flight.originTimezone,
    originCity: flight.originCity,
    originAirportCode: flight.originAirportCode,
    destinationTimezone: flight.destinationTimezone,
    destinationCity: flight.destinationCity,
    destinationAirportCode: flight.destinationAirportCode,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    flightDuration: flight.flightDuration,
  };
}

export type JourneyCreationResult =
  | { success: true; journey: MultiLegJourney }
  | { success: true; journeys: MultiLegJourney[]; splitReason: string }
  | { success: false; validation: any; canProceed: boolean };

/**
 * Helper: Create multi-leg journey from sequential flights
 * Returns validation results instead of throwing for graceful error handling
 */
export function createMultiLegJourney(
  flights: FlightLeg[],
  userPreferences?: MultiLegJourney['userPreferences'],
  options?: {
    skipValidation?: boolean; // Allow bypassing validation for testing
  }
): JourneyCreationResult {
  // Validate connections unless explicitly skipped
  if (!options?.skipValidation) {
    const { validateFlightConnections } = require('./flight-validation');
    const validation = validateFlightConnections(flights);

    // Separate trips detected - create individual journeys FIRST (before checking BLOCK issues)
    // This handles disconnected flights that should be split into separate journeys
    if (validation.recommendedAction === 'split_trips' && validation.suggestedGroups) {
      const journeys = validation.suggestedGroups.map((group: FlightLeg[]) => ({
        legs: group,
        layovers: calculateLayoversForFlights(group),
        userPreferences,
      }));

      return {
        success: true,
        journeys,
        splitReason: `Detected ${validation.suggestedGroups.length} separate trips - creating individual recovery plans`
      };
    }

    // BLOCK-level issues (that aren't split trips) - return error instead of throwing
    if (validation.overallValidity === 'invalid') {
      return {
        success: false,
        validation,
        canProceed: false
      };
    }

    // Warnings/unusual but allowed - let user confirm
    if (validation.overallValidity === 'needs_confirmation') {
      return {
        success: false,
        validation,
        canProceed: true
      };
    }

    // Log any INFO/WARNING issues
    const warnings = validation.issues.filter((i: any) =>
      i.severity === 'WARNING' || i.severity === 'INFO'
    );
    if (warnings.length > 0) {
      console.warn('Flight connection warnings:', warnings.map((w: any) => w.message));
    }
  }

  const legs: FlightLeg[] = flights;
  const layovers: Layover[] = calculateLayoversForFlights(flights);

  return {
    success: true,
    journey: {
      legs,
      layovers,
      userPreferences,
    }
  };
}

function calculateLayoversForFlights(flights: FlightLeg[]): Layover[] {
  const layovers: Layover[] = [];

  // Calculate layovers between consecutive flights
  for (let i = 0; i < flights.length - 1; i++) {
    const currentFlight = flights[i];
    const nextFlight = flights[i + 1];

    const layoverDuration =
      (nextFlight.departureTime.getTime() - currentFlight.arrivalTime.getTime()) /
      (1000 * 60 * 60);

    // Allow disconnected flights - just don't add a layover
    // The validation system will have warned about this
    if (currentFlight.destinationAirportCode !== nextFlight.originAirportCode) {
      console.warn(
        `Disconnected flights detected: ${currentFlight.destinationAirportCode} → ${nextFlight.originAirportCode}. ` +
        `This will be treated as separate travel segments.`
      );
      continue; // Skip layover calculation for disconnected flights
    }

    if (layoverDuration >= 0) {
      layovers.push({
        city: currentFlight.destinationCity,
        timezone: currentFlight.destinationTimezone,
        duration: layoverDuration,
        arrivalTime: currentFlight.arrivalTime,
        departureTime: nextFlight.departureTime,
      });
    }
  }

  return layovers;
}
