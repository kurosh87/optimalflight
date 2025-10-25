import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Connection to tripbaseweb Neon database with airport data
const TRIPBASE_DB_URL = process.env.TRIPBASE_DATABASE_URL ||
  'postgresql://neondb_owner:npg_7KZLPYwl0vJz@ep-muddy-recipe-adi58o7r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codes = searchParams.get('codes'); // Comma-separated IATA codes
    const countryCode = searchParams.get('country');
    const onlyCommercial = searchParams.get('commercial') === 'true';

    const sql = neon(TRIPBASE_DB_URL);

    if (codes) {
      // Fetch specific airports by IATA codes
      const iataList = codes.split(',').map(c => c.trim().toUpperCase());

      const airports = await sql`
        SELECT
          id,
          iata_code,
          icao_code,
          name,
          latitude,
          longitude,
          city_id,
          country_code,
          airport_type,
          hub_status,
          annual_passengers
        FROM airports_enhanced
        WHERE iata_code = ANY(${iataList})
        ORDER BY iata_code
      `;

      return NextResponse.json({
        airports,
        count: airports.length
      });
    } else if (countryCode) {
      // Fetch airports by country
      const query = onlyCommercial
        ? sql`
            SELECT
              id, iata_code, icao_code, name, latitude, longitude,
              city_id, country_code, airport_type, hub_status
            FROM airports_enhanced
            WHERE country_code = ${countryCode}
              AND airport_type IN ('large_airport', 'medium_airport')
            ORDER BY annual_passengers DESC NULLS LAST
            LIMIT 100
          `
        : sql`
            SELECT
              id, iata_code, icao_code, name, latitude, longitude,
              city_id, country_code, airport_type
            FROM airports_enhanced
            WHERE country_code = ${countryCode}
            ORDER BY annual_passengers DESC NULLS LAST
            LIMIT 200
          `;

      const airports = await query;

      return NextResponse.json({
        airports,
        count: airports.length
      });
    } else {
      // Return major international airports (top 500 by passenger traffic)
      const airports = await sql`
        SELECT
          id, iata_code, icao_code, name, latitude, longitude,
          country_code, airport_type, hub_status, annual_passengers
        FROM airports_enhanced
        WHERE airport_type IN ('large_airport', 'medium_airport')
          AND annual_passengers IS NOT NULL
        ORDER BY annual_passengers DESC
        LIMIT 500
      `;

      return NextResponse.json({
        airports,
        count: airports.length
      });
    }
  } catch (error: any) {
    console.error('Error fetching airports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airports', details: error.message },
      { status: 500 }
    );
  }
}
