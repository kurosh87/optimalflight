import { flights } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
// import { requireAuth } from "@/lib/auth/clerk"; // Using NextAuth instead

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  // const userId = await requireAuth(); // Using NextAuth instead
  const userId = 'temp-user-id'; // TODO: Replace with NextAuth session


  try {
    const { id } = await params;
    const flightId = BigInt(id);

    const [flight] = await db
      .select()
      .from(flights)
      .where(and(eq(flights.id, flightId), eq(flights.ownerId, userId)));

    if (!flight) {
      return NextResponse.json(
        { error: "Flight not found" },
        { status: 404 }
      );
    }

    if (!flight.jetlagPlan) {
      return NextResponse.json(
        { error: "No jetlag plan available for this flight" },
        { status: 404 }
      );
    }

    const jetlagPlan = JSON.parse(flight.jetlagPlan);

    return NextResponse.json({
      flightId: flight.id.toString(),
      origin: flight.originCity,
      destination: flight.destinationCity,
      jetlagPlan,
    });
  } catch (error) {
    console.error("Error fetching jetlag plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch jetlag plan" },
      { status: 500 }
    );
  }
}
