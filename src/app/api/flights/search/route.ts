import { NextResponse } from "next/server";
// TODO: Replace Clerk auth with NextAuth or custom auth solution
// import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/flights/search
 *
 * Search for available flights between two airports on a given date.
 *
 * This is a mock implementation that generates realistic flight data.
 * In production, this would integrate with flight search APIs like:
 * - Amadeus API
 * - Skyscanner API
 * - Kayak API
 * - Google Flights QPX Express
 */
export async function POST(request: Request) {
  try {
    // TODO: Implement proper authentication
    const userId = 'temp-user-id'; // PLACEHOLDER - replace with actual auth
    // const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { origin, destination, departureDate } = await request.json();

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate mock flight data
    // In production, replace this with actual API calls
    const flights = generateMockFlights(origin, destination, departureDate);

    return NextResponse.json({
      flights,
      searchParams: {
        origin,
        destination,
        departureDate,
      },
    });
  } catch (error) {
    console.error("Error searching flights:", error);
    return NextResponse.json(
      { error: "Failed to search flights" },
      { status: 500 }
    );
  }
}

/**
 * Generate mock flight data for demonstration purposes
 * This simulates what a real flight search API would return
 */
function generateMockFlights(
  origin: string,
  destination: string,
  departureDate: string
) {
  const airlines = [
    { name: "United Airlines", prefix: "UA", aircraft: ["Boeing 737", "Boeing 787", "Airbus A320"] },
    { name: "Delta Air Lines", prefix: "DL", aircraft: ["Boeing 737", "Airbus A350", "Airbus A321"] },
    { name: "American Airlines", prefix: "AA", aircraft: ["Boeing 737 MAX", "Boeing 777", "Airbus A321"] },
    { name: "Southwest Airlines", prefix: "WN", aircraft: ["Boeing 737"] },
    { name: "JetBlue Airways", prefix: "B6", aircraft: ["Airbus A320", "Airbus A321"] },
    { name: "Alaska Airlines", prefix: "AS", aircraft: ["Boeing 737", "Airbus A320"] },
  ];

  const cabinClasses = ["economy", "premium_economy", "business", "first"] as const;

  const flights = [];
  const numFlights = Math.floor(Math.random() * 6) + 5; // 5-10 flights

  const departureDateTime = new Date(departureDate);

  for (let i = 0; i < numFlights; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = `${airline.prefix}${Math.floor(Math.random() * 9000) + 1000}`;
    const aircraft = airline.aircraft[Math.floor(Math.random() * airline.aircraft.length)];

    // Random departure time between 5 AM and 11 PM
    const departureHour = Math.floor(Math.random() * 18) + 5;
    const departureMinute = Math.floor(Math.random() * 60);

    const departure = new Date(departureDateTime);
    departure.setHours(departureHour, departureMinute, 0, 0);

    // Random flight duration between 1-15 hours (60-900 minutes)
    const durationMinutes = Math.floor(Math.random() * 840) + 60;

    const arrival = new Date(departure.getTime() + durationMinutes * 60 * 1000);

    // Random number of stops (0-2)
    const stops = Math.random() < 0.4 ? 0 : Math.random() < 0.7 ? 1 : 2;

    // Pricing logic
    const basePrice = 150 + Math.floor(Math.random() * 800); // $150-$950
    const stopsPenalty = stops * 50; // Cheaper with stops
    const directBonus = stops === 0 ? 100 : 0; // Non-stop costs more

    const cabinClass = cabinClasses[Math.floor(Math.random() * cabinClasses.length)];
    const cabinMultiplier =
      cabinClass === "economy" ? 1 :
      cabinClass === "premium_economy" ? 1.5 :
      cabinClass === "business" ? 3 :
      4; // first class

    const finalPrice = Math.round((basePrice - stopsPenalty + directBonus) * cabinMultiplier);

    flights.push({
      id: `flight_${i}_${Date.now()}`,
      airline: airline.name,
      flightNumber,
      aircraftType: aircraft,
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      duration: durationMinutes,
      price: {
        amount: finalPrice,
        currency: "USD",
      },
      cabinClass,
      stops,
      available: Math.random() > 0.1, // 90% availability
    });
  }

  // Sort by price (cheapest first)
  flights.sort((a, b) => a.price.amount - b.price.amount);

  return flights;
}
