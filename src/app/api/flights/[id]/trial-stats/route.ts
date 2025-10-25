import { NextRequest, NextResponse } from 'next/server';
// import { requireAuth } from '@/lib/auth/clerk'; // Using NextAuth instead
import { getDb } from '@/lib/db';
import { flights } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateTrialStats } from '@/lib/services/TrialStatsService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  // const userId = await requireAuth(); // Using NextAuth instead
  const userId = 'temp-user-id'; // TODO: Replace with NextAuth session


  try {
    const { id } = await params;
    const flightId = BigInt(id);

    // Get the flight
    const [flight] = await db
      .select()
      .from(flights)
      .where(and(eq(flights.id, flightId), eq(flights.ownerId, userId)));

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Check if this was a trial flight
    if (!flight.isPremiumTrial) {
      return NextResponse.json(
        { error: 'This flight was not a premium trial' },
        { status: 400 }
      );
    }

    // Calculate stats
    const stats = await calculateTrialStats(flight.id);

    return NextResponse.json({
      flightId: flight.id.toString(),
      stats,
      flightStatus: flight.status,
    });
  } catch (error) {
    console.error('Error fetching trial stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trial stats' },
      { status: 500 }
    );
  }
}
