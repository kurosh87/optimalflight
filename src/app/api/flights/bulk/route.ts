import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface BulkFlightData {
  flightNumber?: string;
  airline?: string;
  originAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  arrivalDate?: string;
  seatNumber?: string;
  bookingReference?: string;
}

/**
 * POST /api/flights/bulk
 * Bulk import historical flights
 */
export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const { flights }: { flights: BulkFlightData[] } = await request.json();

    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      return NextResponse.json(
        { error: 'No flights provided' },
        { status: 400 }
      );
    }

    // Validate all flights have required fields
    const invalidFlights = flights.filter(
      (f) => !f.originAirportCode || !f.destinationAirportCode || !f.departureDate
    );

    if (invalidFlights.length > 0) {
      return NextResponse.json(
        { error: 'Some flights are missing required fields' },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // TRANSACTION: All-or-nothing import (prevents partial imports)
    try {
      await sql.transaction(async (tx) => {
        // Import flights one by one (could be optimized with batch insert)
        for (const flight of flights) {
          try {
            // Parse departure date
            const departureDateTime = new Date(flight.departureDate);
            if (isNaN(departureDateTime.getTime())) {
              errors.push(`Invalid departure date for ${flight.originAirportCode}-${flight.destinationAirportCode}`);
              skipped++;
              continue;
            }

            // Parse arrival date if provided
            let arrivalDateTime = null;
            if (flight.arrivalDate) {
              arrivalDateTime = new Date(flight.arrivalDate);
              if (isNaN(arrivalDateTime.getTime())) {
                arrivalDateTime = null; // Ignore invalid arrival dates
              }
            }

            // Check if flight already exists (prevent duplicates)
            const existing = await tx`
              SELECT id FROM flights
              WHERE clerk_user_id = ${userId}
                AND origin_airport_code = ${flight.originAirportCode}
                AND destination_airport_code = ${flight.destinationAirportCode}
                AND departure_date_time::date = ${departureDateTime.toISOString().split('T')[0]}::date
              LIMIT 1
            `;

            if (existing.length > 0) {
              skipped++;
              continue; // Skip duplicates
            }

            // Insert flight
            await tx`
              INSERT INTO flights (
                clerk_user_id,
                flight_number,
                airline,
                origin_airport_code,
                destination_airport_code,
                departure_date_time,
                arrival_date_time,
                seat_number,
                booking_reference,
                status
              ) VALUES (
                ${userId},
                ${flight.flightNumber || null},
                ${flight.airline || null},
                ${flight.originAirportCode},
                ${flight.destinationAirportCode},
                ${departureDateTime.toISOString()},
                ${arrivalDateTime ? arrivalDateTime.toISOString() : null},
                ${flight.seatNumber || null},
                ${flight.bookingReference || null},
                'completed'
              )
            `;

            imported++;
          } catch (error: any) {
            console.error('Error importing flight:', error);
            errors.push(`Failed to import ${flight.originAirportCode}-${flight.destinationAirportCode}: ${error.message}`);
            skipped++;
            // Don't throw - continue with other flights in batch
          }
        }
      });
    } catch (txError: any) {
      // Transaction failed completely
      console.error('Transaction failed for bulk import:', txError);
      return NextResponse.json(
        {
          error: 'Bulk import transaction failed',
          details: txError.message,
          imported: 0, // None imported due to rollback
          skipped: flights.length,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: flights.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in bulk flight import:', error);
    return NextResponse.json(
      { error: 'Failed to import flights', details: error.message },
      { status: 500 }
    );
  }
}
