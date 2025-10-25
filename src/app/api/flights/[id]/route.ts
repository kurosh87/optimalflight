import { NextRequest, NextResponse } from "next/server";
// import { requireAuth } from "@/lib/auth/clerk"; // Using NextAuth instead
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { flights } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAirportByCode } from "@/lib/amadeus";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const userId = await requireAuth(); // Using NextAuth instead
    const userId = 'temp-user-id'; // TODO: Replace with NextAuth session

    const { id } = await params;

    // BUG FIX: Validate ID format before BigInt conversion
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid flight ID format" },
        { status: 400 }
      );
    }

    const flightId = BigInt(id);

    // Fetch the flight
    const [flight] = await db
      .select()
      .from(flights)
      .where(and(eq(flights.id, flightId), eq(flights.ownerId, userId)))
      .limit(1);

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // Fetch enhanced airport data from Amadeus
    let originAirportDetails = null;
    let destinationAirportDetails = null;

    try {
      [originAirportDetails, destinationAirportDetails] = await Promise.all([
        getAirportByCode(flight.originAirportCode),
        getAirportByCode(flight.destinationAirportCode),
      ]);
    } catch (error) {
      console.error("Error fetching airport details:", error);
      // Continue without enhanced data
    }

    // BUG FIX: Safely parse jetlagPlan JSON with try-catch
    let parsedJetlagPlan = null;
    if (flight.jetlagPlan) {
      try {
        parsedJetlagPlan = JSON.parse(flight.jetlagPlan);
      } catch (error) {
        console.error("Invalid jetlagPlan JSON for flight", flight.id, error);
        // Continue with null instead of crashing
        parsedJetlagPlan = null;
      }
    }

    // Serialize BigInt fields
    const serializedFlight = {
      ...flight,
      id: flight.id.toString(),
      duration: flight.duration ? Number(flight.duration) : null,
      jetlagPlan: parsedJetlagPlan,
      originAirportDetails,
      destinationAirportDetails,
    };

    return NextResponse.json(serializedFlight);
  } catch (error) {
    console.error("Error fetching flight:", error);
    return NextResponse.json(
      { error: "Failed to fetch flight" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const userId = await requireAuth(); // Using NextAuth instead
    const userId = 'temp-user-id'; // TODO: Replace with NextAuth session

    const { id } = await params;

    // BUG FIX: Validate ID format before BigInt conversion
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid flight ID format" },
        { status: 400 }
      );
    }

    const flightId = BigInt(id);

    // Delete the flight (only if owned by user)
    await db
      .delete(flights)
      .where(and(eq(flights.id, flightId), eq(flights.ownerId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { error: "Failed to delete flight" },
      { status: 500 }
    );
  }
}
