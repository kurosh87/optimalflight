/**
 * Route Enrichment Functions
 *
 * Add airline frequency, schedule patterns, and connection facilities
 * to route patterns discovered by path-finder
 */

import { neon } from '@neondatabase/serverless';
import type { RoutePath, RouteSegment } from './path-finder';
import { getAirlineAlliance, type AllianceName } from '../data/airline-alliances';

const sql = neon(process.env.DATABASE_URL!);

interface AirlineScheduleData {
  iata: string;
  name: string;
  alliance: AllianceName;
  frequency: string;
  flightsPerWeek: number;
  typicalDepartureTimes: string[];
  operatingDays: string[];
  aircraft: string[];
  serviceQuality: number;
  jetlagOptimizationScore: number;
}

interface ConnectionFacility {
  iataCode: string;
  name: string;
  typicalLayover: string;
  minConnectionTime: number;
  loungeQuality: number;
  sleepPods: boolean;
  showers: boolean;
  transitHotel: boolean;
  connectionComplexity: number;
  tips: string;
}

/**
 * Enrich route with airline frequency and schedule data
 */
export async function enrichRouteWithScheduleData(route: RoutePath): Promise<RoutePath> {
  try {
    // Enrich each segment with airline data
    const enrichedSegments = await Promise.all(
      route.segments.map(segment => enrichSegmentWithAirlineData(segment))
    );

    return {
      ...route,
      segments: enrichedSegments,
    };
  } catch (error) {
    console.error('[Route Enricher] Error enriching route:', error);
    return route; // Return original route if enrichment fails
  }
}

/**
 * Enrich a single segment with airline schedule data
 */
async function enrichSegmentWithAirlineData(segment: RouteSegment): Promise<RouteSegment> {
  try {
    // Query database for airlines operating this segment
    const airlines = await sql`
      SELECT
        r.airline_iata,
        a.airline_name,
        COUNT(DISTINCT r.id) as route_count,
        asr.overall_score,
        asr.jetlag_awareness_score,
        asr.service_score
      FROM routes r
      INNER JOIN airlines a ON r.airline_iata = a.iata_code
      LEFT JOIN airline_service_rankings asr ON r.airline_iata = asr.iata_code
      WHERE r.departure_iata = ${segment.origin}
        AND r.arrival_iata = ${segment.destination}
        AND r.airline_iata IS NOT NULL
      GROUP BY r.airline_iata, a.airline_name, asr.overall_score, asr.jetlag_awareness_score, asr.service_score
      ORDER BY route_count DESC
      LIMIT 10
    `;

    if (airlines.length === 0) {
      // No specific airline data, return segment as-is
      return segment;
    }

    // Transform to airline schedule data
    const airlineData: AirlineScheduleData[] = airlines.map((a: any) => {
      const flightsPerWeek = estimateFlightsPerWeek(a.route_count);
      const alliance = getAirlineAlliance(a.airline_iata);

      return {
        iata: a.airline_iata,
        name: a.airline_name,
        alliance,
        frequency: calculateFrequency(flightsPerWeek),
        flightsPerWeek,
        typicalDepartureTimes: [], // TODO: Add if we have this data
        operatingDays: estimateOperatingDays(flightsPerWeek),
        aircraft: [], // TODO: Add from aircraft_rankings if linked
        serviceQuality: a.overall_score || 5.0,
        jetlagOptimizationScore: a.jetlag_awareness_score || 5.0,
      };
    });

    return {
      ...segment,
      airlines: airlineData,
    };

  } catch (error) {
    console.error(`[Route Enricher] Error enriching segment ${segment.origin}-${segment.destination}:`, error);
    return segment;
  }
}

/**
 * Add connection airport facility data
 */
export async function addConnectionFacilities(route: RoutePath): Promise<RoutePath> {
  if (route.connections.length === 0) {
    return route; // No connections, nothing to add
  }

  try {
    // Query airport_data and airports for facility information
    const facilities = await Promise.all(
      route.connections.map(iataCode => getConnectionFacilityData(iataCode))
    );

    // Generate "why this route" explanations
    const whyThisRoute = generateWhyThisRoute(route, facilities);

    return {
      ...route,
      connectionFacilities: facilities,
      whyThisRoute,
    };

  } catch (error) {
    console.error('[Route Enricher] Error adding connection facilities:', error);
    return route;
  }
}

/**
 * Generate "why this route" explanations
 */
function generateWhyThisRoute(route: RoutePath, facilities: ConnectionFacility[]): string[] {
  const reasons: string[] = [];

  // Jetlag score benefits
  if (route.jetlagScore <= 4.0) {
    reasons.push('Excellent jetlag score - minimal recovery time needed');
  } else if (route.jetlagScore <= 5.5) {
    reasons.push('Good jetlag score - manageable recovery');
  }

  // Direction benefits
  if (route.totalTimezoneCrossing < 0) {
    reasons.push('Westward travel = easier adaptation and faster recovery');
  } else if (route.totalTimezoneCrossing > 0) {
    reasons.push('Eastward travel - extra preparation recommended');
  }

  // Connection count
  if (route.connections.length === 0) {
    reasons.push('Direct flight - no connections needed');
  } else if (route.connections.length === 1) {
    reasons.push('Single connection - good balance of options and complexity');
  } else {
    reasons.push('Multiple connections - may allow for rest stops');
  }

  // Connection quality
  facilities.forEach(facility => {
    if (facility.loungeQuality >= 8.0) {
      reasons.push(`Excellent lounges at ${facility.iataCode}`);
    }
    if (facility.sleepPods) {
      reasons.push(`Sleep pods available at ${facility.iataCode} for rest`);
    }
    if (facility.connectionComplexity <= 3.5) {
      reasons.push(`Easy connections at ${facility.iataCode}`);
    }
  });

  // Distance considerations
  if (route.totalDistance < 8000) {
    reasons.push('Relatively shorter route - less travel fatigue');
  }

  // Duration
  if (route.totalDuration < 900) {
    reasons.push('Under 15 hours total travel time');
  }

  // If no reasons found, add generic ones
  if (reasons.length === 0) {
    reasons.push('Viable route option for this journey');
    reasons.push('Check live flights for best times and prices');
  }

  return reasons;
}

/**
 * Get facility data for a connection airport
 */
async function getConnectionFacilityData(iataCode: string): Promise<ConnectionFacility> {
  try {
    const results = await sql`
      SELECT
        a.iata_code,
        a.airport_name,
        a.city,
        a.country_name,
        ad.tier,
        ad.lounge_quality_score,
        ad.connection_complexity_score,
        ad.sleep_pod_availability,
        ad.shower_facilities,
        ad.transit_hotel_available
      FROM airports a
      LEFT JOIN airport_data ad ON a.iata_code = ad.iata_code
      WHERE a.iata_code = ${iataCode}
      LIMIT 1
    `;

    if (results.length === 0) {
      // No data found, return defaults
      return {
        iataCode,
        name: iataCode,
        typicalLayover: '2-4 hours',
        minConnectionTime: 90,
        loungeQuality: 5.0,
        sleepPods: false,
        showers: false,
        transitHotel: false,
        connectionComplexity: 5.0,
        tips: 'Standard connection airport',
      };
    }

    const airport = results[0];

    // Generate tips based on facilities
    const tips = generateConnectionTips(airport);

    return {
      iataCode,
      name: airport.airport_name || iataCode,
      typicalLayover: estimateTypicalLayover(airport.tier),
      minConnectionTime: estimateMinConnection(airport.connection_complexity_score),
      loungeQuality: airport.lounge_quality_score || 5.0,
      sleepPods: airport.sleep_pod_availability || false,
      showers: airport.shower_facilities || false,
      transitHotel: airport.transit_hotel_available || false,
      connectionComplexity: airport.connection_complexity_score || 5.0,
      tips,
    };

  } catch (error) {
    console.error(`[Route Enricher] Error getting facility data for ${iataCode}:`, error);

    return {
      iataCode,
      name: iataCode,
      typicalLayover: '2-4 hours',
      minConnectionTime: 90,
      loungeQuality: 5.0,
      sleepPods: false,
      showers: false,
      transitHotel: false,
      connectionComplexity: 5.0,
      tips: 'Connection airport',
    };
  }
}

/**
 * Calculate flight frequency descriptor
 */
function calculateFrequency(flightsPerWeek: number): string {
  if (flightsPerWeek >= 14) return 'multiple daily';
  if (flightsPerWeek >= 7) return 'daily';
  if (flightsPerWeek >= 4) return `${flightsPerWeek}x weekly`;
  if (flightsPerWeek >= 1) return 'weekly';
  return 'limited';
}

/**
 * Estimate flights per week from route count
 */
function estimateFlightsPerWeek(routeCount: number): number {
  // This is an estimation - in reality, you'd want actual schedule data
  // For now, assume more route entries = more frequent flights
  if (routeCount >= 50) return 14; // Multiple daily
  if (routeCount >= 20) return 7;  // Daily
  if (routeCount >= 10) return 4;  // 4x weekly
  if (routeCount >= 5) return 2;   // 2x weekly
  return 1; // Weekly
}

/**
 * Estimate operating days based on frequency
 */
function estimateOperatingDays(flightsPerWeek: number): string[] {
  if (flightsPerWeek >= 7) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }
  if (flightsPerWeek >= 5) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  }
  if (flightsPerWeek >= 3) {
    return ['Mon', 'Wed', 'Fri'];
  }
  return ['Mon']; // Limited
}

/**
 * Estimate typical layover time based on airport tier
 */
function estimateTypicalLayover(tier: string | null): string {
  switch (tier) {
    case 'tier1':
      return '2-4 hours'; // Major hubs, efficient
    case 'tier2':
      return '3-5 hours'; // Regional hubs
    case 'tier3':
      return '4-8 hours'; // Smaller airports
    default:
      return '2-6 hours'; // Unknown
  }
}

/**
 * Estimate minimum connection time based on complexity
 */
function estimateMinConnection(complexity: number | null): number {
  if (!complexity) return 90; // Default 1.5 hours

  // Lower complexity = easier connection = shorter MCT
  if (complexity <= 3) return 60;  // 1 hour for easy connections
  if (complexity <= 5) return 90;  // 1.5 hours for medium
  if (complexity <= 7) return 120; // 2 hours for complex
  return 150; // 2.5 hours for very complex
}

/**
 * Generate connection tips based on airport data
 */
function generateConnectionTips(airport: any): string {
  const tips: string[] = [];

  // Lounge quality
  if (airport.lounge_quality_score >= 8) {
    tips.push('Excellent lounges available');
  } else if (airport.lounge_quality_score >= 6) {
    tips.push('Good lounge facilities');
  }

  // Sleep facilities
  if (airport.sleep_pod_availability) {
    tips.push('Sleep pods for rest');
  }
  if (airport.shower_facilities) {
    tips.push('Shower facilities available');
  }
  if (airport.transit_hotel_available) {
    tips.push('Transit hotel for long layovers');
  }

  // Connection complexity
  if (airport.connection_complexity_score <= 3) {
    tips.push('Easy connections within same terminal');
  } else if (airport.connection_complexity_score >= 7) {
    tips.push('Complex connections - allow extra time');
  }

  // Tier-based tips
  if (airport.tier === 'tier1') {
    tips.push('Major hub with excellent facilities');
  }

  return tips.length > 0 ? tips.join('. ') + '.' : 'Standard connection airport.';
}
