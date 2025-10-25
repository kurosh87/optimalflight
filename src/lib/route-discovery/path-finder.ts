/**
 * Route Discovery Algorithm
 *
 * Finds all possible ways to get from Origin to Destination
 * using your routes database (not Kiwi API - that's for actual flights)
 *
 * Example: ASU (Asunción) → PPT (Tahiti)
 * Results:
 * - Direct: None
 * - 1-stop: via LAX, via GRU, via SCL, via AKL
 * - 2-stops: via LAX+SFO, via GRU+SCL, etc.
 *
 * Each route gets a jetlag score for ranking
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface RouteSegment {
  origin: string; // IATA
  destination: string; // IATA
  airlines: string[]; // Airlines that fly this segment
  distance: number; // km
  typicalDuration: number; // minutes
  timezoneDiff: number; // hours
}

export interface RoutePath {
  id: string; // "ASU-LAX-PPT"
  origin: string;
  destination: string;
  segments: RouteSegment[];
  connections: string[]; // ["LAX"] or ["LAX", "SFO"]
  totalDistance: number;
  totalDuration: number; // estimated
  totalTimezoneCrossing: number;
  jetlagScore: number; // 0-10
  ranking: 'excellent' | 'good' | 'moderate' | 'challenging';
  popularity: number; // How many people actually fly this route combo
  recoveryDays?: number; // Estimated recovery time
  whyThisRoute?: string[]; // Reasons this route is good/bad
  connectionFacilities?: any[]; // Facility data for connection airports
}

/**
 * Find all routes from origin to destination
 * Uses breadth-first search with max 2 connections
 */
export async function findAllRoutes(
  origin: string,
  destination: string,
  options: {
    maxConnections?: number; // Default 2
    minPopularityScore?: number; // Skip obscure routes
    preferredAirlines?: string[];
  } = {}
): Promise<RoutePath[]> {
  const { maxConnections = 2, minPopularityScore = 0 } = options;

  // 1. Check for direct routes
  const directRoutes = await findDirectRoutes(origin, destination);

  // 2. Find 1-stop routes
  const oneStopRoutes = await findOneStopRoutes(origin, destination);

  // 3. Find 2-stop routes (if maxConnections >= 2)
  const twoStopRoutes =
    maxConnections >= 2
      ? await findTwoStopRoutes(origin, destination)
      : [];

  // 4. Combine and rank
  const allRoutes = [...directRoutes, ...oneStopRoutes, ...twoStopRoutes];

  // 5. Calculate jetlag scores
  const scoredRoutes = await Promise.all(
    allRoutes.map(route => calculateRouteScore(route))
  );

  // 6. Filter by popularity
  const popularRoutes = scoredRoutes.filter(
    r => r.popularity >= minPopularityScore
  );

  // 7. Sort by jetlag score (lower is better)
  return popularRoutes.sort((a, b) => a.jetlagScore - b.jetlagScore);
}

/**
 * Direct routes (no connections)
 */
async function findDirectRoutes(
  origin: string,
  destination: string
): Promise<RoutePath[]> {
  const routes = await sql`
    SELECT DISTINCT
      r.departure_iata,
      r.arrival_iata,
      r.airline_iata,
      r.estimated_duration_minutes,
      o.latitude as origin_lat,
      o.longitude as origin_lng,
      o.timezone as origin_tz,
      d.latitude as dest_lat,
      d.longitude as dest_lng,
      d.timezone as dest_tz,
      COUNT(*) OVER (PARTITION BY r.departure_iata, r.arrival_iata) as route_frequency
    FROM routes r
    INNER JOIN airports o ON r.departure_iata = o.iata_code
    INNER JOIN airports d ON r.arrival_iata = d.iata_code
    WHERE r.departure_iata = ${origin}
      AND r.arrival_iata = ${destination}
  `;

  if (routes.length === 0) return [];

  // Group airlines for the same route
  const airlines = routes.map((r: any) => r.airline_iata).filter(Boolean);
  const distance = calculateDistance(
    routes[0].origin_lat,
    routes[0].origin_lng,
    routes[0].dest_lat,
    routes[0].dest_lng
  );

  return [
    {
      id: `${origin}-${destination}`,
      origin,
      destination,
      segments: [
        {
          origin,
          destination,
          airlines: [...new Set(airlines)],
          distance,
          typicalDuration: Number(routes[0].estimated_duration_minutes) || estimateDuration(distance),
          timezoneDiff: 0, // Calculate from timezones
        },
      ],
      connections: [],
      totalDistance: distance,
      totalDuration: Number(routes[0].estimated_duration_minutes) || estimateDuration(distance),
      totalTimezoneCrossing: 0,
      jetlagScore: 0, // Will be calculated
      ranking: 'excellent',
      popularity: routes.length, // More routes = more popular
    },
  ];
}

/**
 * 1-stop routes (via one connection)
 */
async function findOneStopRoutes(
  origin: string,
  destination: string
): Promise<RoutePath[]> {
  // Find all airports that have routes FROM origin AND TO destination
  const connections = await sql`
    WITH first_leg AS (
      SELECT DISTINCT arrival_iata as connection_airport
      FROM routes
      WHERE departure_iata = ${origin}
    ),
    second_leg AS (
      SELECT DISTINCT departure_iata as connection_airport
      FROM routes
      WHERE arrival_iata = ${destination}
    )
    SELECT
      f.connection_airport,
      a.airport_name,
      a.latitude,
      a.longitude,
      a.country_name,
      ad.tier,
      ad.connection_complexity_score,
      ad.lounge_quality_score,
      COUNT(r1.id) as leg1_route_count,
      COUNT(r2.id) as leg2_route_count
    FROM first_leg f
    INNER JOIN second_leg s ON f.connection_airport = s.connection_airport
    INNER JOIN airports a ON f.connection_airport = a.iata_code
    LEFT JOIN airport_data ad ON a.iata_code = ad.iata_code
    LEFT JOIN routes r1 ON r1.departure_iata = ${origin} AND r1.arrival_iata = f.connection_airport
    LEFT JOIN routes r2 ON r2.departure_iata = f.connection_airport AND r2.arrival_iata = ${destination}
    WHERE a.is_active = true
      AND f.connection_airport != ${origin}
      AND f.connection_airport != ${destination}
    GROUP BY f.connection_airport, a.airport_name, a.latitude, a.longitude, a.country_name, ad.tier, ad.connection_complexity_score, ad.lounge_quality_score
    ORDER BY (leg1_route_count + leg2_route_count) DESC
    LIMIT 20
  `;

  const routes: RoutePath[] = [];

  for (const conn of connections) {
    // Get airlines for each leg
    const [leg1Airlines, leg2Airlines] = await Promise.all([
      sql`
        SELECT DISTINCT airline_iata, estimated_duration_minutes
        FROM routes
        WHERE departure_iata = ${origin}
          AND arrival_iata = ${conn.connection_airport}
      `,
      sql`
        SELECT DISTINCT airline_iata, estimated_duration_minutes
        FROM routes
        WHERE departure_iata = ${conn.connection_airport}
          AND arrival_iata = ${destination}
      `,
    ]);

    // Get airport coordinates
    const [originAirport, destAirport] = await Promise.all([
      sql`SELECT latitude, longitude FROM airports WHERE iata_code = ${origin}`,
      sql`SELECT latitude, longitude FROM airports WHERE iata_code = ${destination}`,
    ]);

    const dist1 = calculateDistance(
      originAirport[0].latitude,
      originAirport[0].longitude,
      conn.latitude,
      conn.longitude
    );

    const dist2 = calculateDistance(
      conn.latitude,
      conn.longitude,
      destAirport[0].latitude,
      destAirport[0].longitude
    );

    routes.push({
      id: `${origin}-${conn.connection_airport}-${destination}`,
      origin,
      destination,
      segments: [
        {
          origin,
          destination: conn.connection_airport,
          airlines: leg1Airlines.map((a: any) => a.airline_iata).filter(Boolean),
          distance: dist1,
          typicalDuration: Number(leg1Airlines[0]?.estimated_duration_minutes) || estimateDuration(dist1),
          timezoneDiff: 0,
        },
        {
          origin: conn.connection_airport,
          destination,
          airlines: leg2Airlines.map((a: any) => a.airline_iata).filter(Boolean),
          distance: dist2,
          typicalDuration: Number(leg2Airlines[0]?.estimated_duration_minutes) || estimateDuration(dist2),
          timezoneDiff: 0,
        },
      ],
      connections: [conn.connection_airport],
      totalDistance: dist1 + dist2,
      totalDuration:
        (Number(leg1Airlines[0]?.estimated_duration_minutes) || estimateDuration(dist1)) +
        (Number(leg2Airlines[0]?.estimated_duration_minutes) || estimateDuration(dist2)) +
        120, // Add 2 hours for connection
      totalTimezoneCrossing: 0,
      jetlagScore: 0,
      ranking: 'good',
      popularity: (conn.leg1_route_count || 0) + (conn.leg2_route_count || 0),
    });
  }

  return routes;
}

/**
 * 2-stop routes (via two connections)
 */
async function findTwoStopRoutes(
  origin: string,
  destination: string
): Promise<RoutePath[]> {
  // Find common 2-stop patterns (limit to avoid explosion)
  // This is more complex - we want popular hub combinations

  const majorHubs = [
    'LAX', 'JFK', 'LHR', 'CDG', 'FRA', 'DXB', 'SIN', 'HND', 'ICN', 'AMS',
    'GRU', 'SCL', 'EZE', 'MEX', 'AKL', 'SYD', 'NRT', 'DOH', 'IST', 'MAD',
  ];

  const twoStopRoutes: RoutePath[] = [];

  // Check combinations of major hubs
  for (let i = 0; i < majorHubs.length && twoStopRoutes.length < 10; i++) {
    for (let j = 0; j < majorHubs.length && twoStopRoutes.length < 10; j++) {
      if (i === j) continue;

      const hub1 = majorHubs[i];
      const hub2 = majorHubs[j];

      // Check if this route exists: origin → hub1 → hub2 → destination
      const routeExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM routes r1
          WHERE r1.departure_iata = ${origin} AND r1.arrival_iata = ${hub1}
        ) AND EXISTS (
          SELECT 1 FROM routes r2
          WHERE r2.departure_iata = ${hub1} AND r2.arrival_iata = ${hub2}
        ) AND EXISTS (
          SELECT 1 FROM routes r3
          WHERE r3.departure_iata = ${hub2} AND r3.arrival_iata = ${destination}
        ) as route_exists
      `;

      if (routeExists[0]?.route_exists) {
        // Build the route (simplified - in production, get full details)
        twoStopRoutes.push({
          id: `${origin}-${hub1}-${hub2}-${destination}`,
          origin,
          destination,
          segments: [], // Would populate with actual segment data
          connections: [hub1, hub2],
          totalDistance: 0, // Calculate
          totalDuration: 0, // Calculate
          totalTimezoneCrossing: 0,
          jetlagScore: 0,
          ranking: 'moderate',
          popularity: 1, // Lower priority
        });
      }
    }
  }

  return twoStopRoutes;
}

/**
 * Calculate jetlag score for a route
 * Uses timezone data and route complexity for scoring
 */
async function calculateRouteScore(route: RoutePath): Promise<RoutePath> {
  try {
    // Get timezone data for origin and destination
    const airports = await sql`
      SELECT iata_code, timezone, latitude, longitude
      FROM airports
      WHERE iata_code IN (${route.origin}, ${route.destination})
    `;

    const originAirport = airports.find((a: any) => a.iata_code === route.origin);
    const destAirport = airports.find((a: any) => a.iata_code === route.destination);

    let score = 5.0; // Base score

    // 1. Timezone crossing (biggest factor for jetlag)
    if (originAirport && destAirport) {
      const tzDiff = calculateTimezoneDiff(originAirport.timezone, destAirport.timezone);
      const absTimezones = Math.abs(tzDiff);
      route.totalTimezoneCrossing = tzDiff;

      // Timezone penalty (more zones = worse)
      score += absTimezones * 0.4;

      // Direction bonus/penalty
      if (tzDiff < 0) {
        // Westward travel (easier)
        score -= 0.8;
      } else if (tzDiff > 0) {
        // Eastward travel (harder)
        score += 1.2;
      }

      // Extreme timezone crossing (>8 hours)
      if (absTimezones > 8) {
        score += 1.5;
      }
    }

    // 2. Connection penalty (each stop adds complexity)
    score += route.connections.length * 1.3;

    // 3. Distance factor
    if (route.totalDistance > 12000) {
      score += 1.8; // Ultra-long haul
    } else if (route.totalDistance > 10000) {
      score += 1.2;
    } else if (route.totalDistance > 7000) {
      score += 0.6;
    }

    // 4. Duration penalty (very long journeys)
    if (route.totalDuration > 1200) {
      score += 1.5; // > 20 hours
    } else if (route.totalDuration > 900) {
      score += 0.8; // > 15 hours
    }

    // Cap score between 0 and 10
    const finalScore = Math.max(0, Math.min(10, score));

    // Determine ranking
    const ranking =
      finalScore <= 3.0
        ? 'excellent'
        : finalScore <= 5.0
        ? 'good'
        : finalScore <= 7.0
        ? 'moderate'
        : 'challenging';

    // Estimate recovery days (roughly 1 day per 1.5 timezones)
    const recoveryDays = route.totalTimezoneCrossing !== undefined
      ? Math.ceil(Math.abs(route.totalTimezoneCrossing) / 1.5)
      : Math.ceil(route.totalDistance / 3000);

    return {
      ...route,
      jetlagScore: parseFloat(finalScore.toFixed(1)),
      ranking: ranking as any,
      recoveryDays,
    };

  } catch (error) {
    console.error('[Path Finder] Error calculating route score:', error);

    // Fallback to simple scoring
    let fallbackScore = 5.0 + route.connections.length * 1.5;
    if (route.totalDistance > 10000) fallbackScore += 1.5;

    return {
      ...route,
      jetlagScore: Math.min(10, fallbackScore),
      ranking: 'moderate',
      recoveryDays: 3,
    };
  }
}

/**
 * Calculate timezone difference
 * Positive = eastward (harder), Negative = westward (easier)
 */
function calculateTimezoneDiff(originTz: string, destTz: string): number {
  // Common timezone offsets (simplified)
  const tzOffsets: Record<string, number> = {
    // Americas
    'America/Asuncion': -4,
    'America/Sao_Paulo': -3,
    'America/Santiago': -3,
    'America/Buenos_Aires': -3,
    'America/Los_Angeles': -8,
    'America/Denver': -7,
    'America/Chicago': -6,
    'America/New_York': -5,
    'America/Mexico_City': -6,

    // Pacific
    'Pacific/Tahiti': -10,
    'Pacific/Auckland': 12,
    'Pacific/Fiji': 12,
    'Australia/Sydney': 10,

    // Europe
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Europe/Berlin': 1,
    'Europe/Madrid': 1,
    'Europe/Moscow': 3,
    'Europe/Istanbul': 3,

    // Asia
    'Asia/Dubai': 4,
    'Asia/Singapore': 8,
    'Asia/Hong_Kong': 8,
    'Asia/Tokyo': 9,
    'Asia/Seoul': 9,
    'Asia/Shanghai': 8,
  };

  const originOffset = tzOffsets[originTz] || 0;
  const destOffset = tzOffsets[destTz] || 0;

  return destOffset - originOffset;
}

/**
 * Haversine distance
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate flight duration from distance
 */
function estimateDuration(distanceKm: number): number {
  // Average speed: 800 km/h + 30min taxi/takeoff/landing
  return Math.round(distanceKm / 800 * 60 + 30);
}
