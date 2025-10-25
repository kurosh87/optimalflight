/**
 * Trip Bucket Service - Database integration for trip bucket system
 * Handles CRUD operations and integrates with existing flight validation
 */

import { neon } from '@neondatabase/serverless';
import type { FlightLeg } from '../jetlag/multi-leg-calculator';
import {
  type TripBucket,
  type BucketStatus,
  type RecoveryProtocol,
  type TripTier,
  type TripConflict,
  shouldMergeTrips,
  isReturnFlight,
  calculateRecoveryCompleteAt,
  detectTripConflicts,
  canCreateTripBucket,
  suggestTripGroups,
  calculateJetlagDifficulty,
  TIER_LIMITS,
} from './trip-bucket-manager';

const sql = neon(process.env.DATABASE_URL!);

export interface CreateTripBucketInput {
  ownerId: string;
  name?: string;
  description?: string;
  flights: FlightLeg[];
  bucketStatus?: BucketStatus;
  recoveryProtocol?: RecoveryProtocol;
  tier: TripTier;
}

export interface UpdateTripBucketInput {
  tripId: bigint;
  ownerId: string;
  name?: string;
  description?: string;
  bucketStatus?: BucketStatus;
}

/**
 * Create a new trip bucket
 */
export async function createTripBucket(input: CreateTripBucketInput): Promise<TripBucket> {
  const { ownerId, name, description, flights, bucketStatus = 'draft', recoveryProtocol = 'aggressive', tier } = input;

  // Check tier limits
  const activeBuckets = await getActiveBucketCount(ownerId);
  const tierCheck = canCreateTripBucket(activeBuckets, tier);

  if (!tierCheck.allowed) {
    throw new Error(tierCheck.reason);
  }

  // Check flights per bucket limit
  const limits = TIER_LIMITS[tier];
  if (flights.length > limits.maxFlightsPerBucket) {
    throw new Error(
      `Too many flights (${flights.length}). ${tier === 'free' ? 'Free' : 'Your'} tier allows ${limits.maxFlightsPerBucket} flights per bucket.`
    );
  }

  // Calculate trip details
  const firstFlight = flights[0];
  const lastFlight = flights[flights.length - 1];
  const departureTime = firstFlight.departureTime;
  const arrivalTime = lastFlight.arrivalTime;

  // Calculate timezone shift (simplified - use first origin to last destination)
  const { calculateTimezoneShiftWithDirection } = await import('../jetlag/calculator');
  const { actualShiftHours, direction } = calculateTimezoneShiftWithDirection(
    firstFlight.originTimezone,
    lastFlight.destinationTimezone,
    departureTime
  );

  const recoveryCompleteAt = calculateRecoveryCompleteAt(arrivalTime, actualShiftHours, recoveryProtocol);
  const jetlagDifficultyScore = calculateJetlagDifficulty(actualShiftHours, direction, flights.length);

  // Check for return trip pattern
  const existingTrips = await getUserTrips(ownerId);
  let parentTripId: bigint | undefined;
  let isReturnTrip = false;

  for (const existingTrip of existingTrips) {
    // Load flights for existing trip
    const existingFlights = await getTripFlights(existingTrip.id);
    if (isReturnFlight(existingFlights, flights)) {
      parentTripId = existingTrip.id;
      isReturnTrip = true;
      break;
    }
  }

  // Insert trip
  const [trip] = await sql`
    INSERT INTO trips (
      owner_id,
      name,
      description,
      departure_time,
      arrival_time,
      bucket_status,
      recovery_protocol,
      is_return_trip,
      parent_trip_id,
      recovery_complete_at,
      total_timezone_shift_hours,
      jetlag_difficulty_score,
      tier_at_creation
    ) VALUES (
      ${ownerId},
      ${name || `Trip to ${lastFlight.destinationCity}`},
      ${description || null},
      ${departureTime.toISOString()},
      ${arrivalTime.toISOString()},
      ${bucketStatus},
      ${recoveryProtocol},
      ${isReturnTrip},
      ${parentTripId || null},
      ${recoveryCompleteAt.toISOString()},
      ${actualShiftHours},
      ${jetlagDifficultyScore},
      ${tier}
    )
    RETURNING *
  `;

  // Link flights to trip
  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i];

    // Insert flight if it doesn't exist (simplified - assumes flights exist in DB)
    // In production, you'd need to handle flight creation
    // For now, assume flights are already in DB with IDs

    // Link to trip
    await sql`
      INSERT INTO trip_flights (trip_id, flight_id, segment_order, leg_type)
      VALUES (
        ${trip.id},
        ${flight.flightNumber || `flight-${i}`}, -- Placeholder
        ${i + 1},
        ${i === 0 ? 'outbound' : flights.length > 1 && i === flights.length - 1 ? 'return' : 'segment'}
      )
    `;
  }

  // Update active bucket count if status is active or locked
  if (bucketStatus === 'active' || bucketStatus === 'locked') {
    await incrementActiveBucketCount(ownerId);
  }

  return {
    ...trip,
    flights,
    ownerId,
    departureTime,
    arrivalTime,
    recoveryCompleteAt,
    totalTimezoneShiftHours: actualShiftHours,
    jetlagDifficultyScore,
    bucketStatus,
    recoveryProtocol,
    isReturnTrip,
    parentTripId,
    tierAtCreation: tier,
  };
}

/**
 * Get user's trips with optional status filter
 */
export async function getUserTrips(
  ownerId: string,
  status?: BucketStatus
): Promise<TripBucket[]> {
  const trips = status
    ? await sql`
        SELECT * FROM trips
        WHERE owner_id = ${ownerId} AND bucket_status = ${status}
        ORDER BY departure_time DESC
      `
    : await sql`
        SELECT * FROM trips
        WHERE owner_id = ${ownerId}
        ORDER BY departure_time DESC
      `;

  return trips.map((t: any) => ({
    id: t.id,
    ownerId: t.owner_id,
    name: t.name,
    description: t.description,
    flights: [], // Load separately if needed
    bucketStatus: t.bucket_status,
    recoveryProtocol: t.recovery_protocol,
    isReturnTrip: t.is_return_trip,
    parentTripId: t.parent_trip_id,
    departureTime: new Date(t.departure_time),
    arrivalTime: new Date(t.arrival_time),
    recoveryCompleteAt: t.recovery_complete_at ? new Date(t.recovery_complete_at) : undefined,
    daysUntilNextTrip: t.days_until_next_trip,
    shouldMergeWithNext: t.should_merge_with_next,
    totalTimezoneShiftHours: t.total_timezone_shift_hours,
    jetlagDifficultyScore: t.jetlag_difficulty_score,
    tierAtCreation: t.tier_at_creation,
  }));
}

/**
 * Get trip flights
 */
async function getTripFlights(tripId: bigint): Promise<FlightLeg[]> {
  const flights = await sql`
    SELECT
      f.flight_number,
      f.airline,
      f.origin_airport_code,
      f.origin_city,
      f.origin_timezone,
      f.destination_airport_code,
      f.destination_city,
      f.destination_timezone,
      f.departure_time,
      f.arrival_time,
      f.duration
    FROM trip_flights tf
    JOIN flights f ON tf.flight_id = f.id
    WHERE tf.trip_id = ${tripId}
    ORDER BY tf.segment_order ASC
  `;

  return flights.map((f: any) => ({
    flightNumber: f.flight_number,
    airline: f.airline,
    originAirportCode: f.origin_airport_code,
    originCity: f.origin_city,
    originTimezone: f.origin_timezone,
    destinationAirportCode: f.destination_airport_code,
    destinationCity: f.destination_city,
    destinationTimezone: f.destination_timezone,
    departureTime: new Date(f.departure_time),
    arrivalTime: new Date(f.arrival_time),
    flightDuration: f.duration / 60, // Convert minutes to hours
  }));
}

/**
 * Update trip bucket
 */
export async function updateTripBucket(input: UpdateTripBucketInput): Promise<void> {
  const { tripId, ownerId, name, description, bucketStatus } = input;

  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(name);
  }

  if (description !== undefined) {
    updates.push(`description = $${values.length + 1}`);
    values.push(description);
  }

  if (bucketStatus !== undefined) {
    // Get current status
    const [current] = await sql`
      SELECT bucket_status FROM trips WHERE id = ${tripId} AND owner_id = ${ownerId}
    `;

    const oldStatus = current?.bucket_status;

    updates.push(`bucket_status = $${values.length + 1}`);
    values.push(bucketStatus);

    // Update locked_at, activated_at, completed_at timestamps
    if (bucketStatus === 'locked' && oldStatus !== 'locked') {
      updates.push('locked_at = NOW()');
    }
    if (bucketStatus === 'active' && oldStatus !== 'active') {
      updates.push('activated_at = NOW()');
    }
    if (bucketStatus === 'completed' && oldStatus !== 'completed') {
      updates.push('completed_at = NOW()');
    }

    // Update active bucket count
    const wasActive = oldStatus === 'active' || oldStatus === 'locked';
    const isActive = bucketStatus === 'active' || bucketStatus === 'locked';

    if (wasActive && !isActive) {
      await decrementActiveBucketCount(ownerId);
    } else if (!wasActive && isActive) {
      await incrementActiveBucketCount(ownerId);
    }
  }

  if (updates.length === 0) return;

  await sql`
    UPDATE trips
    SET ${sql.unsafe(updates.join(', '))}
    WHERE id = ${tripId} AND owner_id = ${ownerId}
  `;
}

/**
 * Delete trip bucket
 */
export async function deleteTripBucket(tripId: bigint, ownerId: string): Promise<void> {
  // Get current status to update count
  const [trip] = await sql`
    SELECT bucket_status FROM trips WHERE id = ${tripId} AND owner_id = ${ownerId}
  `;

  if (trip && (trip.bucket_status === 'active' || trip.bucket_status === 'locked')) {
    await decrementActiveBucketCount(ownerId);
  }

  await sql`
    DELETE FROM trips WHERE id = ${tripId} AND owner_id = ${ownerId}
  `;
}

/**
 * Analyze trips and detect conflicts
 */
export async function analyzeTripConflicts(ownerId: string): Promise<TripConflict[]> {
  const trips = await getUserTrips(ownerId);
  return detectTripConflicts(trips);
}

/**
 * Get active bucket count for user
 */
async function getActiveBucketCount(ownerId: string): Promise<number> {
  const [result] = await sql`
    SELECT COUNT(*)::int as count
    FROM trips
    WHERE owner_id = ${ownerId}
    AND bucket_status IN ('active', 'locked')
  `;

  return result?.count || 0;
}

/**
 * Increment active bucket count
 */
async function incrementActiveBucketCount(ownerId: string): Promise<void> {
  await sql`
    INSERT INTO trip_bucket_limits (owner_id, active_bucket_count)
    VALUES (${ownerId}, 1)
    ON CONFLICT (owner_id)
    DO UPDATE SET active_bucket_count = trip_bucket_limits.active_bucket_count + 1
  `;
}

/**
 * Decrement active bucket count
 */
async function decrementActiveBucketCount(ownerId: string): Promise<void> {
  await sql`
    UPDATE trip_bucket_limits
    SET active_bucket_count = GREATEST(active_bucket_count - 1, 0)
    WHERE owner_id = ${ownerId}
  `;
}

/**
 * Get or create bucket limits for user
 */
export async function getUserBucketLimits(ownerId: string, tier: TripTier) {
  const [limits] = await sql`
    INSERT INTO trip_bucket_limits (owner_id, tier, max_active_buckets, max_flights_per_bucket)
    VALUES (
      ${ownerId},
      ${tier},
      ${TIER_LIMITS[tier].maxActiveBuckets},
      ${TIER_LIMITS[tier].maxFlightsPerBucket}
    )
    ON CONFLICT (owner_id)
    DO UPDATE SET
      tier = EXCLUDED.tier,
      max_active_buckets = EXCLUDED.max_active_buckets,
      max_flights_per_bucket = EXCLUDED.max_flights_per_bucket,
      updated_at = NOW()
    RETURNING *
  `;

  return limits;
}
