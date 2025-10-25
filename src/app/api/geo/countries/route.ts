import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Connection to jetlag Neon database with country polygons
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_0fMOCZR8SpEa@ep-weathered-resonance-adh16ci4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withGeometry = searchParams.get('geometry') === 'true';
    const codes = searchParams.get('codes'); // Comma-separated ISO2 codes

    const sql = neon(DATABASE_URL);

    if (withGeometry) {
      // Fetch countries with PostGIS geometry as GeoJSON
      let countries;

      if (codes) {
        // Fetch specific countries by ISO2 codes
        const iso2List = codes.split(',').map(c => c.trim().toUpperCase());
        countries = await sql`
          SELECT
            id,
            iso2,
            iso3,
            name,
            continent,
            CASE WHEN geometry IS NOT NULL THEN ST_AsGeoJSON(geometry)::json
                 ELSE NULL END AS geojson
          FROM countries
          WHERE iso2 = ANY(${iso2List})
            AND geometry IS NOT NULL
          ORDER BY name ASC
        `;
      } else {
        // Fetch all countries with geometry
        countries = await sql`
          SELECT
            id,
            iso2,
            iso3,
            name,
            continent,
            CASE WHEN geometry IS NOT NULL THEN ST_AsGeoJSON(geometry)::json
                 ELSE NULL END AS geojson
          FROM countries
          WHERE geometry IS NOT NULL
          ORDER BY name ASC
        `;
      }

      return NextResponse.json({
        countries,
        count: countries.length
      });
    } else {
      // Just basic country info without heavy geometry data
      const countries = await sql`
        SELECT
          id, iso2, iso3, name, continent
        FROM countries
        ORDER BY name ASC
      `;

      return NextResponse.json({
        countries,
        count: countries.length
      });
    }
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries', details: error.message },
      { status: 500 }
    );
  }
}
