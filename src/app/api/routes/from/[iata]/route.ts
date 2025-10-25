/**
 * Get all routes from an airport
 * GET /api/routes/from/:iata
 *
 * Returns routes with airport and airline data for map visualization
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { routesEnhanced, airportsEnhanced, airlinesEnhanced, alliances } from '@/lib/db/schema-routes';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { iata: string } }
) {
  try {
    const { iata } = params;
    const iataCode = iata.toUpperCase();

    // Get the origin airport
    const originAirport = await db
      .select()
      .from(airportsEnhanced)
      .where(eq(airportsEnhanced.iataCode, iataCode))
      .limit(1);

    if (!originAirport.length) {
      return NextResponse.json(
        { error: 'Airport not found' },
        { status: 404 }
      );
    }

    // Get all routes from this airport
    const routes = await db
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
      .where(eq(routesEnhanced.originAirportId, originAirport[0].airportId));

    // Transform to GeoJSON for map
    const geojson = {
      type: 'FeatureCollection',
      features: routes.map(({ route, destination, airline, alliance }) => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [originAirport[0].longitude, originAirport[0].latitude],
            [destination.longitude, destination.latitude],
          ],
        },
        properties: {
          routeId: route.routeId,
          origin: iataCode,
          destination: destination.iataCode,
          airline: airline.airlineName,
          airlineCode: airline.iataCode,
          alliance: alliance?.allianceName || null,
          frequency: route.frequencyPerWeek,
          distance: route.distanceKm,
          duration: route.flightDurationMinutes,
          isSeasonal: route.isSeasonal,
        },
      })),
    };

    return NextResponse.json({
      origin: originAirport[0],
      routes: geojson,
      count: routes.length,
    });
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes', details: error.message },
      { status: 500 }
    );
  }
}
