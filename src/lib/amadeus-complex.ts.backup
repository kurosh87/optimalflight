/**
 * Amadeus API client for flight and airport data
 * Enhanced with usage tracking, circuit breaker, and retry logic
 */

import Amadeus from 'amadeus';
import { amadeusCircuitBreaker } from '@/lib/utils/circuitBreaker';
import { retryAmadeusCall } from '@/lib/utils/retryWithBackoff';
import { amadeusUsageTracker } from '@/lib/services/AmadeusUsageTracker';

// Initialize Amadeus client
// Use lazy initialization to avoid issues with server-side rendering
let amadeusClient: Amadeus | null = null;

function getAmadeusClient(): Amadeus {
  if (!amadeusClient) {
    const apiKey = process.env.AMADEUS_API_KEY;
    const apiSecret = process.env.AMADEUS_API_SECRET;
    const environment = process.env.AMADEUS_ENVIRONMENT || 'test';

    if (!apiKey || !apiSecret) {
      throw new Error('Amadeus API credentials are not configured');
    }

    amadeusClient = new Amadeus({
      clientId: apiKey,
      clientSecret: apiSecret,
      hostname: environment === 'production' ? 'production' : 'test',
    });

    console.log(`[Amadeus] Client initialized for ${environment} environment`);
  }

  return amadeusClient;
}

/**
 * Search for airports by city, airport name, or IATA code
 */
export async function searchAirports(keyword: string, limit: number = 10) {
  try {
    const amadeus = getAmadeusClient();

    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: 'AIRPORT,CITY',
      'page[limit]': limit,
    });

    return response.data.map((location: any) => ({
      code: location.iataCode,
      name: location.name,
      city: location.address?.cityName || location.name,
      country: location.address?.countryName || '',
      timezone: location.timeZoneOffset || '',
      latitude: location.geoCode?.latitude || 0,
      longitude: location.geoCode?.longitude || 0,
      type: location.subType,
    }));
  } catch (error) {
    console.error('Error searching airports:', error);
    throw new Error('Failed to search airports');
  }
}

/**
 * Get detailed airport information by IATA code
 */
export async function getAirportByCode(iataCode: string) {
  try {
    const amadeus = getAmadeusClient();

    const response = await amadeus.referenceData.locations.get({
      keyword: iataCode,
      subType: 'AIRPORT',
    });

    if (response.data.length === 0) {
      return null;
    }

    const location = response.data[0];
    return {
      code: location.iataCode,
      name: location.name,
      city: location.address?.cityName || location.name,
      country: location.address?.countryName || '',
      timezone: location.timeZoneOffset || '',
      latitude: location.geoCode?.latitude || 0,
      longitude: location.geoCode?.longitude || 0,
      type: location.subType,
    };
  } catch (error) {
    console.error('Error getting airport:', error);
    throw new Error('Failed to get airport information');
  }
}

/**
 * Search for flight offers
 */
export async function searchFlightOffers(params: {
  origin: string;
  destination: string;
  departureDate: string;
  adults?: number;
  max?: number;
}) {
  try {
    const amadeus = getAmadeusClient();

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults || 1,
      max: params.max || 10,
    });

    return response.data.map((offer: any) => {
      const segment = offer.itineraries[0].segments[0];
      return {
        flightNumber: `${segment.carrierCode}${segment.number}`,
        airline: segment.carrierCode,
        origin: segment.departure.iataCode,
        destination: segment.arrival.iataCode,
        departureTime: segment.departure.at,
        arrivalTime: segment.arrival.at,
        duration: offer.itineraries[0].duration,
        price: {
          amount: offer.price.total,
          currency: offer.price.currency,
        },
      };
    });
  } catch (error) {
    console.error('Error searching flights:', error);
    throw new Error('Failed to search flights');
  }
}

/**
 * Search for a flight by flight number
 * Extracts carrier code from flight number (e.g., AA1234 → AA + 1234)
 * Then searches for flight offers
 */
export async function searchFlightByNumber(
  flightNumber: string,
  date: string
) {
  const carrierCodeMatch = flightNumber.match(/^([A-Z]{2,3})(\d+)$/);

  if (!carrierCodeMatch) {
    throw new Error('Invalid flight number format. Expected format: AA1234');
  }

  const [, carrierCode, number] = carrierCodeMatch;

  try {
    const statusResult = await getFlightStatus({
      carrierCode,
      flightNumber: number,
      scheduledDepartureDate: date,
    });

    if (statusResult && statusResult.length > 0) {
      return extractFlightDetails(statusResult[0]);
    }

    return null;
  } catch (error) {
    console.error('Error searching flight by number:', error);
    return null;
  }
}

/**
 * Get flight status by flight number and date
 * Enhanced with circuit breaker, retry logic, and usage tracking
 */
export async function getFlightStatus(params: {
  carrierCode: string;
  flightNumber: string;
  scheduledDepartureDate: string;
}) {
  // Track API usage
  await amadeusUsageTracker.trackRequest('flight-status');

  // Use circuit breaker to prevent cascading failures
  const result = await amadeusCircuitBreaker.execute(async () => {
    // Retry with exponential backoff
    return await retryAmadeusCall(async () => {
      const amadeus = getAmadeusClient();

      const response = await amadeus.schedule.flights.get({
        carrierCode: params.carrierCode,
        flightNumber: params.flightNumber,
        scheduledDepartureDate: params.scheduledDepartureDate,
      });

      // Return raw response data for detailed processing
      return response.data;
    });
  });

  if (!result || result.length === 0) {
    return null;
  }

  // Return full flight data for enhanced change detection
  return result;
}

/**
 * Convert Amadeus duration format (PT2H30M) to minutes
 */
export function parseDuration(duration: string): number {
  const matches = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!matches) return 0;

  const hours = matches[1] ? parseInt(matches[1].replace('H', '')) : 0;
  const minutes = matches[2] ? parseInt(matches[2].replace('M', '')) : 0;

  return hours * 60 + minutes;
}

/**
 * Extract comprehensive flight information from Amadeus response
 * Includes aircraft, terminal, gate, baggage, and timing details
 */
export function extractFlightDetails(flightData: any) {
  if (!flightData || !flightData.flightPoints) {
    return null;
  }

  const departurePoint = flightData.flightPoints.find((p: any) => p.departure);
  const arrivalPoint = flightData.flightPoints.find((p: any) => p.arrival);

  if (!departurePoint) {
    return null;
  }

  // Extract timings
  const depTimings = departurePoint.departure?.timings || [];
  const arrTimings = arrivalPoint?.arrival?.timings || [];

  const std = depTimings.find((t: any) => t.qualifier === 'STD')?.value;
  const etd = depTimings.find((t: any) => t.qualifier === 'ETD')?.value;
  const atd = depTimings.find((t: any) => t.qualifier === 'ATD')?.value;

  const sta = arrTimings.find((t: any) => t.qualifier === 'STA')?.value;
  const eta = arrTimings.find((t: any) => t.qualifier === 'ETA')?.value;
  const ata = arrTimings.find((t: any) => t.qualifier === 'ATA')?.value;

  // Calculate delay
  let delayMinutes = 0;
  if (std && etd) {
    delayMinutes = Math.round((new Date(etd).getTime() - new Date(std).getTime()) / 60000);
  }

  // Determine status
  let status = 'scheduled';
  if (atd) {
    status = 'departed';
  } else if (ata) {
    status = 'arrived';
  } else if (delayMinutes >= 15) {
    status = 'delayed';
  }

  return {
    // Basic info
    flightNumber: `${flightData.flightDesignator?.carrierCode}${flightData.flightDesignator?.flightNumber}`,
    carrierCode: flightData.flightDesignator?.carrierCode,
    status,

    // Airport codes
    originCode: departurePoint.iataCode,
    destinationCode: arrivalPoint?.iataCode,

    // Departure info
    departure: {
      scheduled: std,
      estimated: etd,
      actual: atd,
      terminal: departurePoint.departure?.terminal?.code,
      gate: departurePoint.departure?.gate?.mainGate,
      boardingTime: departurePoint.departure?.boardingTime,
      gateClosingTime: departurePoint.departure?.gateClosingTime,
    },

    // Arrival info
    arrival: {
      scheduled: sta,
      estimated: eta,
      actual: ata,
      terminal: arrivalPoint?.arrival?.terminal?.code,
      gate: arrivalPoint?.arrival?.gate?.mainGate,
      baggageClaim: arrivalPoint?.arrival?.baggageClaim?.carouselNumber,
    },

    // Aircraft info
    aircraft: {
      type: flightData.legs?.[0]?.aircraftEquipment?.aircraftType,
      registration: flightData.legs?.[0]?.aircraftEquipment?.registration,
    },

    // Timing
    delayMinutes,
    scheduledDepartureTime: std,
    estimatedDepartureTime: etd || std,
    actualDepartureTime: atd,
    scheduledArrivalTime: sta,
    estimatedArrivalTime: eta || sta,
    actualArrivalTime: ata,

    // Raw data for advanced processing
    raw: flightData,
  };
}
