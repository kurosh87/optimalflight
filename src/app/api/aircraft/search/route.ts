import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_0fMOCZR8SpEa@ep-weathered-resonance-adh16ci4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // aircraft type filter
    const airline = searchParams.get('airline'); // airline filter
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query && !type && !airline) {
      return NextResponse.json({ error: 'At least one search parameter required' }, { status: 400 });
    }

    let searchQuery;
    let params: any[] = [];

    if (type && airline) {
      searchQuery = `
        SELECT
          ap.id,
          ap.registration_number,
          ap.iata_type,
          ap.model_name as airplane_model,
          ap.plane_age,
          ap.plane_status,
          at.aircraft_name,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          
          al.airline_name,
          al.iata_code as airline_iata,
          al.country_name as airline_country
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        LEFT JOIN airlines al ON ap.airline_iata_code = al.iata_code
        WHERE
          (LOWER(at.aircraft_name) LIKE LOWER($1) )
          AND LOWER(al.airline_name) LIKE LOWER($2)
        ORDER BY ap.registration_number
        LIMIT $3
      `;
      params = [`%${type}%`, `%${airline}%`, limit];
    } else if (type) {
      searchQuery = `
        SELECT
          ap.id,
          ap.registration_number,
          ap.iata_type,
          ap.model_name as airplane_model,
          ap.plane_age,
          ap.plane_status,
          at.aircraft_name,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          
          al.airline_name,
          al.iata_code as airline_iata,
          al.country_name as airline_country
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        LEFT JOIN airlines al ON ap.airline_iata_code = al.iata_code
        WHERE LOWER(at.aircraft_name) LIKE LOWER($1) 
        ORDER BY ap.registration_number
        LIMIT $2
      `;
      params = [`%${type}%`, limit];
    } else if (airline) {
      searchQuery = `
        SELECT
          ap.id,
          ap.registration_number,
          ap.iata_type,
          ap.model_name as airplane_model,
          ap.plane_age,
          ap.plane_status,
          at.aircraft_name,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          
          al.airline_name,
          al.iata_code as airline_iata,
          al.country_name as airline_country
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        LEFT JOIN airlines al ON ap.airline_iata_code = al.iata_code
        WHERE LOWER(al.airline_name) LIKE LOWER($1) OR LOWER(al.iata_code) = LOWER($1)
        ORDER BY ap.registration_number
        LIMIT $2
      `;
      params = [`%${airline}%`, limit];
    } else {
      searchQuery = `
        SELECT
          ap.id,
          ap.registration_number,
          ap.iata_type,
          ap.model_name as airplane_model,
          ap.plane_age,
          ap.plane_status,
          at.aircraft_name,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          
          al.airline_name,
          al.iata_code as airline_iata,
          al.country_name as airline_country
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        LEFT JOIN airlines al ON ap.airline_iata_code = al.iata_code
        WHERE
          LOWER(ap.registration_number) LIKE LOWER($1)
          OR LOWER(ap.registration_number) LIKE LOWER($1)
          OR LOWER(at.aircraft_name) LIKE LOWER($1)
          
        ORDER BY
          CASE
            WHEN LOWER(ap.registration_number) = LOWER($2) THEN 1
            WHEN LOWER(ap.registration_number) = LOWER($2) THEN 2
            ELSE 3
          END,
          ap.registration_number
        LIMIT $3
      `;
      params = [`%${query}%`, query, limit];
    }

    const result = await pool.query(searchQuery, params);

    return NextResponse.json({
      aircraft: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Aircraft search error:', error);
    return NextResponse.json(
      { error: 'Failed to search aircraft' },
      { status: 500 }
    );
  }
}
