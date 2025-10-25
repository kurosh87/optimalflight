/**
 * Route Query Utilities for FlightConnections-style route visualization
 * Optimized for bidirectional queries and alliance filtering
 */

import { db } from '@/lib/db';
import { eq, and, or, inArray, sql } from 'drizzle-orm';
import { routesEnhanced, airportsEnhanced, airlinesEnhanced, alliances } from '@/lib/db/schema-routes';

/**
 * Check if a seasonal route is active in a given month
 */
export function isRouteActiveInMonth(
  route: {
    isSeasonal: boolean | null;
    seasonalStartMonth: number | null;
    seasonalEndMonth: number | null;
  },
  currentMonth: number
): boolean {
  if (!route.isSeasonal) return true;
  if (!route.seasonalStartMonth || !route.seasonalEndMonth) return true;

  const start = route.seasonalStartMonth;
  const end = route.seasonalEndMonth;

  // Handle season spanning year boundary (e.g., Dec-March)
  if (start > end) {
    return currentMonth >= start || currentMonth <= end;
  }

  return currentMonth >= start && currentMonth <= end;
}

/**
 * Get all routes from an airport
 * FlightConnections core query
 */
export async function getRoutesFromAirport(iataCode: string) {
  const result = await db
    .select({
      route: routesEnhanced,
      destination: airportsEnhanced,
      airline: airlinesEnhanced,
      alliance: alliances,
    })
    .from(routesEnhanced)
    .innerJoin(
      airportsEnhanced,
      eq(routesEnhanced.destinationAirportId, airportsEnhanced.airportId)
    )
    .innerJoin(
      airlinesEnhanced,
      eq(routesEnhanced.airlineId, airlinesEnhanced.airlineId)
    )
    .leftJoin(
      alliances,
      eq(airlinesEnhanced.allianceId, alliances.allianceId)
    )
    .where(
      and(
        eq(
          routesEnhanced.originAirportId,
          sql`(SELECT airport_id FROM airports_enhanced WHERE iata_code = ${iataCode})`
        ),
        eq(routesEnhanced.status, 'operational')
      )
    );

  return result;
}

/**
 * Get all routes to an airport (reverse lookup)
 */
export async function getRoutesToAirport(iataCode: string) {
  const result = await db
    .select({
      route: routesEnhanced,
      origin: airportsEnhanced,
      airline: airlinesEnhanced,
      alliance: alliances,
    })
    .from(routesEnhanced)
    .innerJoin(
      airportsEnhanced,
      eq(routesEnhanced.originAirportId, airportsEnhanced.airportId)
    )
    .innerJoin(
      airlinesEnhanced,
      eq(routesEnhanced.airlineId, airlinesEnhanced.airlineId)
    )
    .leftJoin(
      alliances,
      eq(airlinesEnhanced.allianceId, alliances.allianceId)
    )
    .where(
      and(
        eq(
          routesEnhanced.destinationAirportId,
          sql`(SELECT airport_id FROM airports_enhanced WHERE iata_code = ${iataCode})`
        ),
        eq(routesEnhanced.status, 'operational')
      )
    );

  return result;
}

/**
 * Get routes between two airports
 */
export async function getRoutesBetweenAirports(
  originIata: string,
  destinationIata: string
) {
  const result = await db
    .select({
      route: routesEnhanced,
      airline: airlinesEnhanced,
      alliance: alliances,
    })
    .from(routesEnhanced)
    .innerJoin(
      airlinesEnhanced,
      eq(routesEnhanced.airlineId, airlinesEnhanced.airlineId)
    )
    .leftJoin(
      alliances,
      eq(airlinesEnhanced.allianceId, alliances.allianceId)
    )
    .where(
      and(
        eq(
          routesEnhanced.originAirportId,
          sql`(SELECT airport_id FROM airports_enhanced WHERE iata_code = ${originIata})`
        ),
        eq(
          routesEnhanced.destinationAirportId,
          sql`(SELECT airport_id FROM airports_enhanced WHERE iata_code = ${destinationIata})`
        ),
        eq(routesEnhanced.status, 'operational')
      )
    );

  return result;
}

/**
 * Get routes by alliance (e.g., all Star Alliance routes)
 */
export async function getRoutesByAlliance(allianceName: string) {
  const result = await db
    .select({
      route: routesEnhanced,
      origin: airportsEnhanced,
      destination: sql`dest`,
      airline: airlinesEnhanced,
    })
    .from(routesEnhanced)
    .innerJoin(
      airlinesEnhanced,
      eq(routesEnhanced.airlineId, airlinesEnhanced.airlineId)
    )
    .innerJoin(
      alliances,
      and(
        eq(airlinesEnhanced.allianceId, alliances.allianceId),
        eq(alliances.allianceName, allianceName)
      )
    )
    .innerJoin(
      airportsEnhanced,
      eq(routesEnhanced.originAirportId, airportsEnhanced.airportId)
    )
    .innerJoin(
      sql`airports_enhanced dest`,
      eq(routesEnhanced.destinationAirportId, sql`dest.airport_id`)
    )
    .where(eq(routesEnhanced.status, 'operational'));

  return result;
}

/**
 * Get seasonal routes active in current month
 */
export async function getCurrentSeasonalRoutes() {
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const result = await db
    .select()
    .from(routesEnhanced)
    .where(
      and(
        eq(routesEnhanced.isSeasonal, true),
        or(
          // Normal season (e.g., May-September)
          and(
            sql`seasonal_start_month <= seasonal_end_month`,
            sql`${currentMonth} BETWEEN seasonal_start_month AND seasonal_end_month`
          ),
          // Wrap-around season (e.g., December-March)
          and(
            sql`seasonal_start_month > seasonal_end_month`,
            or(
              sql`${currentMonth} >= seasonal_start_month`,
              sql`${currentMonth} <= seasonal_end_month`
            )
          )
        )
      )
    );

  return result;
}

/**
 * Get routes between country regions (e.g., US/CA to Europe)
 */
export async function getRoutesBetweenRegions(
  originCountryCodes: string[],
  destinationCountryCodes: string[]
) {
  const result = await db
    .select({
      route: routesEnhanced,
      origin: sql`o`,
      destination: sql`d`,
      airline: airlinesEnhanced,
      alliance: alliances,
    })
    .from(routesEnhanced)
    .innerJoin(
      airlinesEnhanced,
      eq(routesEnhanced.airlineId, airlinesEnhanced.airlineId)
    )
    .leftJoin(
      alliances,
      eq(airlinesEnhanced.allianceId, alliances.allianceId)
    )
    .innerJoin(
      sql`airports_enhanced o`,
      eq(routesEnhanced.originAirportId, sql`o.airport_id`)
    )
    .innerJoin(
      sql`airports_enhanced d`,
      eq(routesEnhanced.destinationAirportId, sql`d.airport_id`)
    )
    .where(
      and(
        inArray(sql`o.country_code`, originCountryCodes),
        inArray(sql`d.country_code`, destinationCountryCodes),
        eq(routesEnhanced.status, 'operational')
      )
    );

  return result;
}

/**
 * Calculate great circle distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateGreatCircleDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get airport size category for map marker visualization
 */
export function getAirportSizeCategory(destinationCount: number): string {
  if (destinationCount >= 100) return 'large';
  if (destinationCount >= 30) return 'medium';
  return 'small';
}

/**
 * Get marker color for airport size (FlightConnections style)
 */
export function getAirportMarkerColor(sizeCategory: string): string {
  switch (sizeCategory) {
    case 'large': return '#0066CC'; // Blue
    case 'medium': return '#FFB800'; // Yellow
    case 'small': return '#FF0000'; // Red
    default: return '#999999'; // Gray
  }
}

/**
 * Check if route operates on a specific day of week
 * operatingDays format: 'SMTWTFS' (Sunday to Saturday)
 * Example: '1010101' = operates Sun/Tue/Thu/Sat
 */
export function isRouteOperatingOnDay(operatingDays: string | null, dayOfWeek: number): boolean {
  if (!operatingDays || operatingDays.length !== 7) return true; // Assume daily if not specified

  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return operatingDays[dayOfWeek] === '1';
}
