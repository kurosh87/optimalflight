import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Connection to tripbaseweb Neon database with airport data
const TRIPBASE_DB_URL = process.env.TRIPBASE_DATABASE_URL ||
  'postgresql://neondb_owner:npg_7KZLPYwl0vJz@ep-muddy-recipe-adi58o7r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

/**
 * GET /api/geo/airports/search
 * Search airports by name, IATA code, or city
 * Query params:
 * - query: Search term (required)
 * - limit: Maximum results (default: 20)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const sql = neon(TRIPBASE_DB_URL);
    const searchTerm = query.toUpperCase();
    const searchPattern = `%${searchTerm}%`;

    // Search airports by IATA code, name, or city
    // Prioritize exact IATA matches, then name matches, then city matches
    const airports = await sql`
      SELECT
        id,
        iata_code,
        icao_code,
        name,
        latitude,
        longitude,
        city_id,
        country_name,
        country_code,
        airport_type,
        hub_status,
        annual_passengers,
        CASE
          WHEN iata_code = ${searchTerm} THEN 1
          WHEN iata_code LIKE ${searchTerm + '%'} THEN 2
          WHEN UPPER(name) LIKE ${searchTerm + '%'} THEN 3
          WHEN UPPER(city_id) LIKE ${searchTerm + '%'} THEN 4
          WHEN UPPER(name) LIKE ${searchPattern} THEN 5
          WHEN UPPER(city_id) LIKE ${searchPattern} THEN 6
          ELSE 7
        END as relevance
      FROM airports_enhanced
      WHERE
        (iata_code LIKE ${searchPattern}
        OR UPPER(name) LIKE ${searchPattern}
        OR UPPER(city_id) LIKE ${searchPattern})
        AND iata_code IS NOT NULL
        AND iata_code != ''
      ORDER BY
        relevance ASC,
        annual_passengers DESC NULLS LAST
      LIMIT ${limit}
    `;

    return NextResponse.json({
      airports,
      count: airports.length,
      query: query,
    });
  } catch (error: any) {
    console.error('Error searching airports:', error);
    return NextResponse.json(
      { error: 'Failed to search airports', details: error.message },
      { status: 500 }
    );
  }
}
