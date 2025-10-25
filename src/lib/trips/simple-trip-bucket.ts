/**
 * Simplified Trip Bucket System
 *
 * UX Model:
 * - ONE active bucket at a time (current/next trip being planned)
 * - Upcoming flights: Not yet in bucket, can be added
 * - Past flights: Completed, greyed out, read-only
 *
 * User actions:
 * - Add flight to active bucket (upcoming → active)
 * - Remove flight from active bucket (active → upcoming)
 * - Complete trip (active → past)
 */

import { neon } from '@neondatabase/serverless';
import type { FlightLeg } from '../jetlag/multi-leg-calculator';

const sql = neon(process.env.DATABASE_URL!);

export type FlightStatus = 'upcoming' | 'active' | 'past';

export interface SimpleFlight {
  id: bigint;
  flightNumber?: string;
  airline?: string;
  originCity: string;
  originAirportCode: string;
  destinationCity: string;
  destinationAirportCode: string;
  departureTime: Date;
  arrivalTime: Date;
  status: FlightStatus; // upcoming, active, past
  isInActiveBucket: boolean;
  tripId?: bigint; // If part of active bucket
}

export interface ActiveBucket {
  tripId: bigint;
  name: string;
  flights: SimpleFlight[];
  departureTime: Date;
  arrivalTime: Date;
  totalTimezoneShift: number;
  recoveryDays: number;
}

/**
 * Get all flights grouped by status
 */
export async function getUserFlightsByStatus(ownerId: string) {
  const now = new Date();

  const flights = await sql`
    SELECT
      f.id,
      f.flight_number,
      f.airline,
      f.origin_city,
      f.origin_airport_code,
      f.destination_city,
      f.destination_airport_code,
      f.departure_time,
      f.arrival_time,
      f.trip_id,
      f.status,
      t.id IS NOT NULL as is_in_active_bucket,
      t.bucket_status
    FROM flights f
    LEFT JOIN trips t ON f.trip_id = t.id AND t.bucket_status = 'active'
    WHERE f.owner_id = ${ownerId}
    ORDER BY f.departure_time ASC
  `;

  const result = {
    active: [] as SimpleFlight[],
    upcoming: [] as SimpleFlight[],
    past: [] as SimpleFlight[],
  };

  for (const flight of flights) {
    const departureTime = new Date(flight.departure_time);
    const isPast = departureTime < now;

    const simpleFlight: SimpleFlight = {
      id: flight.id,
      flightNumber: flight.flight_number,
      airline: flight.airline,
      originCity: flight.origin_city,
      originAirportCode: flight.origin_airport_code,
      destinationCity: flight.destination_city,
      destinationAirportCode: flight.destination_airport_code,
      departureTime,
      arrivalTime: new Date(flight.arrival_time),
      status: isPast ? 'past' : flight.is_in_active_bucket ? 'active' : 'upcoming',
      isInActiveBucket: flight.is_in_active_bucket || false,
      tripId: flight.trip_id,
    };

    if (isPast) {
      result.past.push(simpleFlight);
    } else if (flight.is_in_active_bucket) {
      result.active.push(simpleFlight);
    } else {
      result.upcoming.push(simpleFlight);
    }
  }

  return result;
}

/**
 * Get the active bucket (if any)
 */
export async function getActiveBucket(ownerId: string): Promise<ActiveBucket | null> {
  const [trip] = await sql`
    SELECT
      t.id,
      t.name,
      t.departure_time,
      t.arrival_time,
      t.total_timezone_shift_hours,
      t.jetlag_difficulty_score
    FROM trips t
    WHERE t.owner_id = ${ownerId}
    AND t.bucket_status = 'active'
    LIMIT 1
  `;

  if (!trip) return null;

  // Get flights in this trip
  const flights = await sql`
    SELECT
      f.id,
      f.flight_number,
      f.airline,
      f.origin_city,
      f.origin_airport_code,
      f.destination_city,
      f.destination_airport_code,
      f.departure_time,
      f.arrival_time
    FROM flights f
    WHERE f.trip_id = ${trip.id}
    ORDER BY f.departure_time ASC
  `;

  return {
    tripId: trip.id,
    name: trip.name || 'My Trip',
    flights: flights.map((f: any) => ({
      id: f.id,
      flightNumber: f.flight_number,
      airline: f.airline,
      originCity: f.origin_city,
      originAirportCode: f.origin_airport_code,
      destinationCity: f.destination_city,
      destinationAirportCode: f.destination_airport_code,
      departureTime: new Date(f.departure_time),
      arrivalTime: new Date(f.arrival_time),
      status: 'active' as FlightStatus,
      isInActiveBucket: true,
      tripId: trip.id,
    })),
    departureTime: new Date(trip.departure_time),
    arrivalTime: new Date(trip.arrival_time),
    totalTimezoneShift: trip.total_timezone_shift_hours || 0,
    recoveryDays: 3, // Calculate based on protocol
  };
}

/**
 * Add flight to active bucket
 * If no active bucket exists, create one (with tier check)
 */
export async function addFlightToActiveBucket(
  flightId: bigint,
  ownerId: string,
  userTier: 'free' | 'pro' | 'business' = 'free'
): Promise<ActiveBucket> {
  // Check if active bucket exists
  let bucket = await getActiveBucket(ownerId);

  if (!bucket) {
    // Check tier limits before creating new bucket
    if (userTier === 'free') {
      // Free users get 1 bucket total (ever)
      const [bucketCount] = await sql`
        SELECT COUNT(*)::int as count
        FROM trips
        WHERE owner_id = ${ownerId}
      `;

      if (bucketCount.count >= 1) {
        throw new Error(
          'Free tier allows only 1 trip bucket. Upgrade to Premium to create unlimited trips!'
        );
      }
    }

    // Create new active bucket
    const [newTrip] = await sql`
      INSERT INTO trips (
        owner_id,
        name,
        departure_time,
        arrival_time,
        bucket_status,
        tier_at_creation
      )
      SELECT
        ${ownerId},
        'My Trip to ' || f.destination_city,
        f.departure_time,
        f.arrival_time,
        'active',
        ${userTier}
      FROM flights f
      WHERE f.id = ${flightId}
      RETURNING *
    `;

    bucket = {
      tripId: newTrip.id,
      name: newTrip.name,
      flights: [],
      departureTime: new Date(newTrip.departure_time),
      arrivalTime: new Date(newTrip.arrival_time),
      totalTimezoneShift: 0,
      recoveryDays: 3,
    };
  }

  // Add flight to bucket
  await sql`
    UPDATE flights
    SET trip_id = ${bucket.tripId}
    WHERE id = ${flightId} AND owner_id = ${ownerId}
  `;

  // Update trip times if needed (in case this flight extends the trip)
  await sql`
    UPDATE trips t
    SET
      departure_time = LEAST(t.departure_time, f.departure_time),
      arrival_time = GREATEST(t.arrival_time, f.arrival_time)
    FROM flights f
    WHERE t.id = ${bucket.tripId}
    AND f.id = ${flightId}
  `;

  // Reload bucket
  return (await getActiveBucket(ownerId))!;
}

/**
 * Remove flight from active bucket
 */
export async function removeFlightFromActiveBucket(
  flightId: bigint,
  ownerId: string
): Promise<void> {
  await sql`
    UPDATE flights
    SET trip_id = NULL
    WHERE id = ${flightId} AND owner_id = ${ownerId}
  `;

  // Check if bucket now empty - if so, delete it
  const bucket = await getActiveBucket(ownerId);
  if (bucket && bucket.flights.length === 0) {
    await sql`
      DELETE FROM trips WHERE id = ${bucket.tripId}
    `;
  }
}

/**
 * Complete the active bucket (mark as past)
 */
export async function completeActiveBucket(ownerId: string): Promise<void> {
  const bucket = await getActiveBucket(ownerId);
  if (!bucket) return;

  await sql`
    UPDATE trips
    SET bucket_status = 'completed', completed_at = NOW()
    WHERE id = ${bucket.tripId}
  `;

  // Update all flights to past status
  await sql`
    UPDATE flights
    SET status = 'past'
    WHERE trip_id = ${bucket.tripId}
  `;
}

/**
 * Rename active bucket
 */
export async function renameActiveBucket(ownerId: string, newName: string): Promise<void> {
  await sql`
    UPDATE trips
    SET name = ${newName}
    WHERE owner_id = ${ownerId} AND bucket_status = 'active'
  `;
}

/**
 * Get trip suggestions based on flight proximity
 * Recommends which upcoming flights should be in the same bucket
 */
export async function getTripSuggestions(ownerId: string) {
  const flights = await sql`
    SELECT
      id,
      origin_airport_code,
      origin_city,
      destination_airport_code,
      destination_city,
      departure_time,
      arrival_time
    FROM flights
    WHERE owner_id = ${ownerId}
    AND trip_id IS NULL
    AND status = 'upcoming'
    ORDER BY departure_time ASC
  `;

  if (flights.length < 2) return null;

  const suggestions: {
    flightIds: bigint[];
    reason: string;
    confidence: 'high' | 'medium';
  }[] = [];

  // Check for return flights
  for (let i = 0; i < flights.length - 1; i++) {
    const flight1 = flights[i];
    const flight2 = flights[i + 1];

    const isReturn =
      flight1.destination_airport_code === flight2.origin_airport_code &&
      flight1.origin_airport_code === flight2.destination_airport_code;

    if (isReturn) {
      suggestions.push({
        flightIds: [flight1.id, flight2.id],
        reason: `Round trip: ${flight1.origin_city} ↔ ${flight1.destination_city}`,
        confidence: 'high',
      });
    }

    // Check for connecting flights (< 48 hours apart, same location)
    const hoursBetween =
      (new Date(flight2.departure_time).getTime() - new Date(flight1.arrival_time).getTime()) /
      (1000 * 60 * 60);

    if (
      flight1.destination_airport_code === flight2.origin_airport_code &&
      hoursBetween > 0 &&
      hoursBetween < 48
    ) {
      suggestions.push({
        flightIds: [flight1.id, flight2.id],
        reason: `Multi-city: ${flight1.origin_city} → ${flight1.destination_city} → ${flight2.destination_city}`,
        confidence: 'high',
      });
    }
  }

  return suggestions.length > 0 ? suggestions[0] : null;
}
