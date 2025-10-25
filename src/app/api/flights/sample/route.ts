import { flights } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateSampleFlights, getSampleItinerary1, getSampleItinerary2 } from "@/lib/data/sample-flights";
import { getDb } from "@/lib/db";
import { calculateJetlagPlan } from "@/lib/jetlag/calculator";
import { invalidateUserFlights } from "@/lib/redis";
// import { requireAuth } from "@/lib/auth/clerk"; // Using NextAuth instead

export async function POST(request: Request) {
  const db = getDb();
  // const userId = await requireAuth(); // Using NextAuth instead
  const userId = 'temp-user-id'; // TODO: Replace with NextAuth session


  try {
    const body = await request.json();
    const { itinerary } = body; // 'random', 'business', 'vacation'

    let sampleFlights;

    if (itinerary === 'business') {
      sampleFlights = getSampleItinerary1();
    } else if (itinerary === 'vacation') {
      sampleFlights = getSampleItinerary2();
    } else {
      // Random selection of flights
      sampleFlights = generateSampleFlights().slice(0, 3);
    }

    // Clear existing flights first (optional - for testing)
    // await db.delete(flights).where(eq(flights.ownerId, userId));

    // Insert sample flights
    const insertedFlights = [];
    for (const flight of sampleFlights) {
      // Calculate jetlag plan for this flight
      const flightDurationHours = flight.duration / 60;
      const jetlagPlan = calculateJetlagPlan({
        originTimezone: flight.originTimezone,
        destinationTimezone: flight.destinationTimezone,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        flightDuration: flightDurationHours,
      });

      const [newFlight] = await db
        .insert(flights)
        .values({
          ownerId: userId,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          originAirportCode: flight.originAirportCode,
          originCity: flight.originCity,
          originTimezone: flight.originTimezone,
          destinationAirportCode: flight.destinationAirportCode,
          destinationCity: flight.destinationCity,
          destinationTimezone: flight.destinationTimezone,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          duration: flight.duration,
          jetlagPlan: JSON.stringify(jetlagPlan),
          sleepQualityOverride: flight.sleepQuality || null,
          adaptabilityOverride: flight.adaptabilityLevel || null,
          status: "upcoming",
        })
        .returning();

      // Convert BigInt to string for JSON serialization
      insertedFlights.push({
        ...newFlight,
        id: newFlight.id.toString(),
        duration: newFlight.duration ? Number(newFlight.duration) : null,
      });
    }

    // CRITICAL: Invalidate cache so new flights show up
    await invalidateUserFlights(userId);

    return NextResponse.json({
      success: true,
      count: insertedFlights.length,
      flights: insertedFlights,
    });
  } catch (error) {
    console.error("Error creating sample flights:", error);
    return NextResponse.json(
      { error: "Failed to create sample flights" },
      { status: 500 }
    );
  }
}

// Clear all flights for current user
export async function DELETE() {
  const db = getDb();
  // const userId = await requireAuth(); // Using NextAuth instead
  const userId = 'temp-user-id'; // TODO: Replace with NextAuth session


  try {
    await db.delete(flights).where(eq(flights.ownerId, userId));

    // Invalidate cache
    await invalidateUserFlights(userId);

    return NextResponse.json({ success: true, message: "All flights cleared" });
  } catch (error) {
    console.error("Error clearing flights:", error);
    return NextResponse.json(
      { error: "Failed to clear flights" },
      { status: 500 }
    );
  }
}
