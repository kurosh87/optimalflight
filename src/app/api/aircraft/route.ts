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
    const registration = searchParams.get('registration');
    const hex = searchParams.get('hex');
    const id = searchParams.get('id');

    if (!registration && !hex && !id) {
      return NextResponse.json(
        { error: 'One of registration, hex, or id parameter required' },
        { status: 400 }
      );
    }

    // Get aircraft details
    let aircraftQuery = '';
    let params: any[] = [];

    if (id) {
      aircraftQuery = `
        SELECT
          ap.*,
          at.aircraft_name as aircraft_model,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          at.icao_code as aircraft_icao
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        WHERE ap.id = $1
      `;
      params = [id];
    } else if (registration) {
      aircraftQuery = `
        SELECT
          ap.*,
          at.aircraft_name as aircraft_model,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          at.icao_code as aircraft_icao
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        WHERE LOWER(ap.registration_number) = LOWER($1)
      `;
      params = [registration];
    } else {
      aircraftQuery = `
        SELECT
          ap.*,
          at.aircraft_name as aircraft_model,
          at.iata_code as aircraft_iata,
          at.iata_code as aircraft_iata,
          at.icao_code as aircraft_icao
        FROM airplanes ap
        LEFT JOIN aircraft_types at ON ap.aircraft_type_id = at.id
        WHERE LOWER(ap.registration_number) = LOWER($1)
      `;
      params = [hex];
    }

    const aircraftResult = await pool.query(aircraftQuery, params);

    if (aircraftResult.rows.length === 0) {
      return NextResponse.json({ error: 'Aircraft not found' }, { status: 404 });
    }

    const aircraft = aircraftResult.rows[0];

    // Get operator airline details
    let airline = null;
    if (aircraft.airline_iata_code) {
      const airlineQuery = 'SELECT * FROM airlines WHERE LOWER(iata_code) = LOWER($1)';
      const airlineResult = await pool.query(airlineQuery, [aircraft.airline_iata_code]);
      if (airlineResult.rows.length > 0) {
        airline = airlineResult.rows[0];
      }
    }

    // Get aircraft type details
    let aircraftType = null;
    if (aircraft.aircraft_type_id) {
      const typeQuery = 'SELECT * FROM aircraft_types WHERE id = $1';
      const typeResult = await pool.query(typeQuery, [aircraft.aircraft_type_id]);
      if (typeResult.rows.length > 0) {
        aircraftType = typeResult.rows[0];
      }
    }

    // Get similar aircraft (same type)
    const similarQuery = `
      SELECT
        ap.id,
        ap.registration_number,
        ap.iata_type,
        al.airline_name,
        al.iata_code as airline_iata,
        al.country_name
      FROM airplanes ap
      LEFT JOIN airlines al ON ap.airline_iata_code = al.iata_code
      WHERE ap.aircraft_type_id = $1 AND ap.id != $2
      ORDER BY ap.registration_number
      LIMIT 10
    `;
    const similarResult = await pool.query(similarQuery, [aircraft.aircraft_type_id, aircraft.id]);

    return NextResponse.json({
      aircraft,
      airline,
      aircraft_type: aircraftType,
      similar_aircraft: similarResult.rows
    });
  } catch (error) {
    console.error('Aircraft details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aircraft details' },
      { status: 500 }
    );
  }
}
