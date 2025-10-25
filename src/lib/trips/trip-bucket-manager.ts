/**
 * Trip Bucket Manager - Scientific Trip Separation System
 *
 * CORE PRINCIPLE: Separate trips if there's enough time for complete circadian re-entrainment
 *
 * Scientific Thresholds:
 * - Aggressive protocol: 3 days recovery minimum
 * - Buffer for full stability: 7 days (2x recovery time)
 * - Conservative protocol: 8 days recovery, 14-day buffer
 *
 * Decision Matrix:
 * - < 7 days apart: MERGE (incomplete recovery, optimize together)
 * - 7-13 days apart: ASK USER (borderline recovery)
 * - 14+ days apart: SEPARATE (full recovery achieved)
 */

import type { FlightLeg } from '../jetlag/multi-leg-calculator';

export type RecoveryProtocol = 'aggressive' | 'conservative';
export type BucketStatus = 'draft' | 'locked' | 'active' | 'completed';
export type TripTier = 'free' | 'pro' | 'business';

export interface RecoveryThresholds {
  minDays: number;        // Minimum recovery time
  bufferDays: number;     // 2x recovery time for full stability
}

export const RECOVERY_THRESHOLDS: Record<RecoveryProtocol, RecoveryThresholds> = {
  aggressive: {
    minDays: 3,        // Timeshifter-style protocol
    bufferDays: 7      // 2x recovery time
  },
  conservative: {
    minDays: 8,        // Traditional protocol
    bufferDays: 14     // 2x recovery time
  }
};

export const TIER_LIMITS: Record<TripTier, { maxActiveBuckets: number; maxFlightsPerBucket: number }> = {
  free: {
    maxActiveBuckets: 1,
    maxFlightsPerBucket: 4
  },
  pro: {
    maxActiveBuckets: 5,
    maxFlightsPerBucket: 10
  },
  business: {
    maxActiveBuckets: 5,
    maxFlightsPerBucket: 10
  }
};

export interface TripBucket {
  id?: bigint;
  ownerId: string;
  name?: string;
  description?: string;
  flights: FlightLeg[];
  bucketStatus: BucketStatus;
  recoveryProtocol: RecoveryProtocol;
  isReturnTrip: boolean;
  parentTripId?: bigint;
  departureTime: Date;
  arrivalTime: Date;
  recoveryCompleteAt?: Date;
  daysUntilNextTrip?: number;
  shouldMergeWithNext?: boolean;
  totalTimezoneShiftHours?: number;
  jetlagDifficultyScore?: number;
  tierAtCreation: TripTier;
}

export interface TripSeparationResult {
  shouldMerge: boolean;
  reason: string;
  daysBetween: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface TripConflict {
  tripId1: bigint;
  tripId2: bigint;
  conflictType: 'insufficient_recovery' | 'timezone_accumulation' | 'overlapping_dates';
  severity: 'low' | 'medium' | 'high';
  daysBetween: number;
  recommendedAction: 'merge' | 'separate' | 'add_buffer';
  message: string;
}

/**
 * Main decision function: Should two trips be in the same bucket?
 * Based on scientific recovery thresholds
 */
export function shouldMergeTrips(
  trip1: TripBucket,
  trip2: TripBucket,
  protocol: RecoveryProtocol = 'aggressive'
): TripSeparationResult {
  const thresholds = RECOVERY_THRESHOLDS[protocol];

  // Calculate days between trip 1 end and trip 2 start
  const trip1End = trip1.recoveryCompleteAt || trip1.arrivalTime;
  const trip2Start = trip2.departureTime;

  const daysBetween = getDaysDifference(trip1End, trip2Start);

  // Rule 1: Detect return flights (same origin/destination reversed)
  if (isReturnFlight(trip1.flights, trip2.flights)) {
    return {
      shouldMerge: true,
      reason: 'Return flight for existing trip',
      daysBetween,
      confidence: 'high'
    };
  }

  // Rule 2: Within recovery window = same bucket
  if (daysBetween < thresholds.bufferDays) {
    return {
      shouldMerge: true,
      reason: `Only ${daysBetween} days between trips - you won't fully re-entrain to home timezone. Optimize together.`,
      daysBetween,
      confidence: 'high'
    };
  }

  // Rule 3: Borderline recovery (7-13 days for aggressive, 14-21 for conservative)
  const borderlineMax = thresholds.bufferDays * 1.5;
  if (daysBetween >= thresholds.bufferDays && daysBetween < borderlineMax) {
    return {
      shouldMerge: false,
      reason: `${daysBetween} days apart - borderline recovery possible. Consider your adaptability.`,
      daysBetween,
      confidence: 'medium'
    };
  }

  // Rule 4: Multi-city with short layovers = same bucket
  if (daysBetween < 3 && isConnectingDestination(trip1, trip2)) {
    return {
      shouldMerge: true,
      reason: 'Part of multi-city itinerary',
      daysBetween,
      confidence: 'high'
    };
  }

  // Rule 5: Full recovery achieved
  return {
    shouldMerge: false,
    reason: `${daysBetween} days apart - full recovery possible between trips`,
    daysBetween,
    confidence: 'high'
  };
}

/**
 * Detect if flight2 is a return flight for flight1
 */
export function isReturnFlight(outbound: FlightLeg[], potentialReturn: FlightLeg[]): boolean {
  if (outbound.length === 0 || potentialReturn.length === 0) return false;

  const outboundOrigin = outbound[0].originAirportCode;
  const outboundDest = outbound[outbound.length - 1].destinationAirportCode;
  const returnOrigin = potentialReturn[0].originAirportCode;
  const returnDest = potentialReturn[potentialReturn.length - 1].destinationAirportCode;

  return outboundDest === returnOrigin && outboundOrigin === returnDest;
}

/**
 * Check if trips are part of multi-city itinerary (connecting destinations)
 */
export function isConnectingDestination(trip1: TripBucket, trip2: TripBucket): boolean {
  const trip1Final = trip1.flights[trip1.flights.length - 1].destinationAirportCode;
  const trip2Start = trip2.flights[0].originAirportCode;

  return trip1Final === trip2Start;
}

/**
 * Calculate days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = date2.getTime() - date1.getTime();
  return Math.round(diffMs / msPerDay);
}

/**
 * Calculate recovery completion date based on protocol
 */
export function calculateRecoveryCompleteAt(
  arrivalTime: Date,
  timezoneShiftHours: number,
  protocol: RecoveryProtocol = 'aggressive'
): Date {
  const thresholds = RECOVERY_THRESHOLDS[protocol];
  const recoveryDate = new Date(arrivalTime);
  recoveryDate.setDate(recoveryDate.getDate() + thresholds.bufferDays);
  return recoveryDate;
}

/**
 * Detect conflicts between consecutive trips
 */
export function detectTripConflicts(trips: TripBucket[]): TripConflict[] {
  const conflicts: TripConflict[] = [];

  // Sort trips by departure time
  const sorted = [...trips].sort((a, b) =>
    a.departureTime.getTime() - b.departureTime.getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const trip1 = sorted[i];
    const trip2 = sorted[i + 1];

    const trip1End = trip1.recoveryCompleteAt || trip1.arrivalTime;
    const daysBetween = getDaysDifference(trip1End, trip2.departureTime);

    const thresholds = RECOVERY_THRESHOLDS[trip1.recoveryProtocol];

    // Conflict 1: Insufficient recovery time
    if (daysBetween < thresholds.bufferDays && daysBetween >= 0) {
      const severity = daysBetween < thresholds.minDays ? 'high' : 'medium';

      conflicts.push({
        tripId1: trip1.id!,
        tripId2: trip2.id!,
        conflictType: 'insufficient_recovery',
        severity,
        daysBetween,
        recommendedAction: 'merge',
        message: `Only ${daysBetween} days between trips. You won't fully recover to home timezone. Consider merging into one bucket for optimal jet lag management.`
      });
    }

    // Conflict 2: Timezone accumulation (high cumulative shift)
    const totalShift = (trip1.totalTimezoneShiftHours || 0) + (trip2.totalTimezoneShiftHours || 0);
    if (totalShift > 12 && daysBetween < thresholds.bufferDays) {
      conflicts.push({
        tripId1: trip1.id!,
        tripId2: trip2.id!,
        conflictType: 'timezone_accumulation',
        severity: 'high',
        daysBetween,
        recommendedAction: 'merge',
        message: `Cumulative timezone shifts: ${totalShift.toFixed(1)} hours. High jet lag risk. Merge trips for unified recovery plan.`
      });
    }

    // Conflict 3: Overlapping dates
    if (daysBetween < 0) {
      conflicts.push({
        tripId1: trip1.id!,
        tripId2: trip2.id!,
        conflictType: 'overlapping_dates',
        severity: 'high',
        daysBetween,
        recommendedAction: 'separate',
        message: `Trips overlap! Trip 2 departs before Trip 1's recovery completes. Check your dates.`
      });
    }
  }

  return conflicts;
}

/**
 * Check if user can create a new trip bucket (tier limits)
 */
export function canCreateTripBucket(
  currentActiveBuckets: number,
  tier: TripTier
): { allowed: boolean; reason?: string } {
  const limits = TIER_LIMITS[tier];

  if (currentActiveBuckets >= limits.maxActiveBuckets) {
    return {
      allowed: false,
      reason: tier === 'free'
        ? `Free tier allows only ${limits.maxActiveBuckets} active trip bucket. Upgrade to Pro for up to 5 active buckets.`
        : `You've reached your limit of ${limits.maxActiveBuckets} active trip buckets.`
    };
  }

  return { allowed: true };
}

/**
 * Suggest trip grouping based on flight list
 * Returns groups that should be separate buckets
 */
export function suggestTripGroups(
  flights: FlightLeg[],
  protocol: RecoveryProtocol = 'aggressive'
): FlightLeg[][] {
  if (flights.length === 0) return [];
  if (flights.length === 1) return [flights];

  // Sort by departure time
  const sorted = [...flights].sort((a, b) =>
    a.departureTime.getTime() - b.departureTime.getTime()
  );

  const groups: FlightLeg[][] = [];
  let currentGroup: FlightLeg[] = [sorted[0]];

  const thresholds = RECOVERY_THRESHOLDS[protocol];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const daysBetween = getDaysDifference(prev.arrivalTime, curr.departureTime);

    // Add buffer for recovery time (use protocol-specific buffer)
    const recoveryDays = thresholds.bufferDays;
    const effectiveDaysBetween = daysBetween - recoveryDays;

    // Same trip if: connected OR within recovery window
    const sameTrip =
      (prev.destinationAirportCode === curr.originAirportCode && daysBetween < 48) || // Connected within 48h
      effectiveDaysBetween < 0; // Within recovery window

    if (sameTrip) {
      currentGroup.push(curr);
    } else {
      // Separate trip
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }

  // Add final group
  groups.push(currentGroup);

  return groups;
}

/**
 * Calculate jetlag difficulty score (0-10 scale)
 * Based on: timezone shift + direction + multi-leg complexity
 */
export function calculateJetlagDifficulty(
  timezoneShiftHours: number,
  direction: 'east' | 'west' | 'none',
  numLegs: number
): number {
  // Base score from timezone shift (0-10)
  let score = Math.min(timezoneShiftHours / 12, 1) * 10;

  // Eastward travel is harder (multiply by 1.2)
  if (direction === 'east') {
    score *= 1.2;
  }

  // Multi-leg complexity (add 0.5 per additional leg, max +2)
  const legComplexity = Math.min((numLegs - 1) * 0.5, 2);
  score += legComplexity;

  return Math.min(score, 10); // Cap at 10
}
