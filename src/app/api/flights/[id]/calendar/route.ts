import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { flights } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { exportJetlagPlanToCalendar, generateCalendarFilename } from '@/lib/jetlag/calendar-export';
import { JetlagPlan } from '@/lib/jetlag/calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flightId = BigInt(id);
    const db = getDb();

    // Fetch the flight with its jetlag plan
    const [flight] = await db
      .select()
      .from(flights)
      .where(eq(flights.id, flightId))
      .limit(1);

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    if (!flight.jetlagPlan) {
      return NextResponse.json(
        { error: 'No jetlag plan found for this flight. Please generate one first.' },
        { status: 404 }
      );
    }

    // Parse the jetlag plan and convert date strings back to Date objects
    const jetlagPlanRaw = JSON.parse(flight.jetlagPlan as string);

    // Helper to recursively convert date strings to Date objects
    const convertDates = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        // Try to parse ISO date strings
        const date = new Date(obj);
        if (!isNaN(date.getTime()) && obj.match(/^\d{4}-\d{2}-\d{2}T/)) {
          return date;
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      }
      if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = convertDates(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const jetlagPlan: JetlagPlan = convertDates(jetlagPlanRaw);

    // Export to calendar
    const result = exportJetlagPlanToCalendar(jetlagPlan);

    if (result.error) {
      console.error('Calendar export error:', result.error);
      return NextResponse.json(
        { error: 'Failed to generate calendar file', details: result.error.message },
        { status: 500 }
      );
    }

    // Generate filename
    const filename = generateCalendarFilename(
      flight.originAirportCode || 'ORIGIN',
      flight.destinationAirportCode || 'DEST',
      flight.departureTime
    );

    // Return the .ics file
    return new NextResponse(result.value, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating calendar export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
