import { NextRequest, NextResponse } from 'next/server';
// import { requireAuth } from '@/lib/auth/clerk'; // Using NextAuth instead
import { getDb } from '@/lib/db';
import { flights, subscriptions, flightMonitors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  // const userId = await requireAuth(); // Using NextAuth instead
  const userId = 'temp-user-id'; // TODO: Replace with NextAuth session


  try {
    const { id } = await params;
    const flightId = BigInt(id);

    // Get user's subscription to check trial status
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.ownerId, userId));

    // Check if user has already used their trial
    if (subscription?.hasUsedPremiumTrial) {
      return NextResponse.json(
        { error: 'You have already used your free premium flight trial' },
        { status: 400 }
      );
    }

    // Check if user is already premium
    const isPremium = subscription?.status === 'active';
    if (isPremium) {
      return NextResponse.json(
        { error: 'You already have premium access' },
        { status: 400 }
      );
    }

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

    // Check if flight already has trial activated
    if (flight.isPremiumTrial) {
      return NextResponse.json(
        { error: 'Trial already activated for this flight' },
        { status: 400 }
      );
    }

    // Activate trial for this flight
    await db
      .update(flights)
      .set({
        isPremiumTrial: true,
        updatedAt: new Date(),
      })
      .where(eq(flights.id, flightId));

    // Mark user as having used their trial
    if (subscription) {
      await db
        .update(subscriptions)
        .set({
          hasUsedPremiumTrial: true,
          premiumTrialUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.ownerId, userId));
    } else {
      // Create subscription record if doesn't exist
      await db.insert(subscriptions).values({
        ownerId: userId,
        status: 'free',
        hasUsedPremiumTrial: true,
        premiumTrialUsedAt: new Date(),
      });
    }

    // Create flight monitor for this trial flight
    if (flight.flightNumber && flight.airline) {
      try {
        await db.insert(flightMonitors).values({
          ownerId: userId,
          flightId: flight.id,
          flightNumber: flight.flightNumber,
          carrierCode: flight.airline,
          departureDate: flight.departureTime,
          isActive: true,
        });
        console.log(`Created flight monitor for trial flight ${flight.id}`);
      } catch (monitorError) {
        console.error('Failed to create flight monitor:', monitorError);
        // Don't fail the trial activation if monitor creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Premium trial activated for this flight!',
      flightId: flight.id.toString(),
    });
  } catch (error) {
    console.error('Error activating trial:', error);
    return NextResponse.json(
      { error: 'Failed to activate trial' },
      { status: 500 }
    );
  }
}
