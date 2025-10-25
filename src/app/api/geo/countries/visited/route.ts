import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/geo/countries/visited
 * Get all countries visited by the user with visit counts and coordinates
 * Returns country centroids calculated from bounding boxes
 */
export async function GET() {
  try {
    const userId = await requireAuth();

    // Query country visits with country details
    // Calculate centroid from bounding box coordinates
    const countryVisits = await sql`
      SELECT
        cv.country_id,
        cv.visit_count,
        cv.first_visit_date,
        cv.last_visit_date,
        c.name as country_name,
        c.iso2,
        c.iso3,
        c.continent,
        -- Calculate centroid from bounding box
        (c.min_latitude + c.max_latitude) / 2 as latitude,
        (c.min_longitude + c.max_longitude) / 2 as longitude
      FROM country_visits cv
      JOIN countries c ON cv.country_id = c.id
      WHERE cv.owner_id = ${userId}
      ORDER BY cv.visit_count DESC, cv.last_visit_date DESC
    `;

    return NextResponse.json({
      countries: countryVisits,
      count: countryVisits.length,
    });
  } catch (error: any) {
    console.error('Error fetching visited countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visited countries', details: error.message },
      { status: 500 }
    );
  }
}
