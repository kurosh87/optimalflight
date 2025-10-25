/**
 * Flight Search API using Amadeus
 * POST /api/flights/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { amadeus } from '@/lib/amadeus';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, adults = 1, cabinClass } = body;

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call Amadeus API
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: adults.toString(),
      travelClass: cabinClass || 'ECONOMY',
      max: 20,
    });

    const flights = response.data;

    // Transform to our format
    const results = flights.map((flight: any) => ({
      id: flight.id,
      price: parseFloat(flight.price.total),
      currency: flight.price.currency,
      airline: flight.validatingAirlineCodes[0],
      segments: flight.itineraries[0].segments.map((seg: any) => ({
        departure: seg.departure.iataCode,
        arrival: seg.arrival.iataCode,
        departureTime: seg.departure.at,
        arrivalTime: seg.arrival.at,
        airline: seg.carrierCode,
        flightNumber: seg.number,
        aircraft: seg.aircraft?.code,
      })),
      duration: flight.itineraries[0].duration,
      stops: flight.itineraries[0].segments.length - 1,
    }));

    return NextResponse.json({
      results,
      count: results.length,
      searchParams: { origin, destination, departureDate, returnDate },
    });
  } catch (error: any) {
    console.error('Amadeus API error:', error);

    return NextResponse.json(
      {
        error: 'Flight search failed',
        details: error.description || error.message,
        fallback: 'Try adjusting your search parameters'
      },
      { status: 500 }
    );
  }
}
