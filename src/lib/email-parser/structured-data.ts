/**
 * Structured Data Extractor
 * Extracts flight information from JSON-LD and microdata in HTML emails
 */

import type { ExtractedFlight } from '@/lib/email-import/types';

/**
 * Extract flights from structured data in HTML
 * Airlines often include JSON-LD or microdata with flight details
 */
export function extractFromStructuredData(html: string): ExtractedFlight[] {
  const flights: ExtractedFlight[] = [];

  // Try JSON-LD first (most common)
  const jsonLdFlights = extractFromJsonLd(html);
  flights.push(...jsonLdFlights);

  // Try microdata
  if (flights.length === 0) {
    const microdataFlights = extractFromMicrodata(html);
    flights.push(...microdataFlights);
  }

  return flights;
}

/**
 * Extract flight data from JSON-LD structured data
 * Schema.org FlightReservation type
 */
function extractFromJsonLd(html: string): ExtractedFlight[] {
  const flights: ExtractedFlight[] = [];

  try {
    // Find all JSON-LD script tags
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const matches = html.matchAll(jsonLdRegex);

    for (const match of matches) {
      try {
        const jsonText = match[1];
        const data = JSON.parse(jsonText);

        // Handle both single objects and arrays
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          const flight = extractFlightFromJsonLdItem(item);
          if (flight) {
            flights.push(flight);
          }
        }
      } catch (error) {
        // Invalid JSON, skip
        console.warn('Invalid JSON-LD:', error);
      }
    }
  } catch (error) {
    console.error('JSON-LD extraction error:', error);
  }

  return flights;
}

/**
 * Extract flight from a single JSON-LD item
 * Supports Schema.org FlightReservation and Flight types
 */
function extractFlightFromJsonLdItem(item: any): ExtractedFlight | null {
  if (!item || typeof item !== 'object') return null;

  // Check for FlightReservation
  if (item['@type'] === 'FlightReservation') {
    const reservation = item.reservationFor;
    if (!reservation) return null;

    const flight = reservation;
    const departureAirport = flight.departureAirport;
    const arrivalAirport = flight.arrivalAirport;

    if (!departureAirport || !arrivalAirport) return null;

    return {
      flightNumber: flight.flightNumber || undefined,
      airline: flight.airline?.name || undefined,
      airlineCode: flight.airline?.iataCode || undefined,

      origin: departureAirport.iataCode || departureAirport.name || '',
      destination: arrivalAirport.iataCode || arrivalAirport.name || '',

      departureDate: extractDate(flight.departureTime) || '',
      departureTime: extractTime(flight.departureTime) || '',
      arrivalDate: extractDate(flight.arrivalTime) || '',
      arrivalTime: extractTime(flight.arrivalTime) || '',

      bookingReference: item.reservationNumber || item.confirmationNumber || undefined,
      confirmationNumber: item.confirmationNumber || undefined,

      extractionMethod: 'structured-data',
      confidence: 0.95, // High confidence for structured data
      confidenceBreakdown: {
        flightNumber: flight.flightNumber ? 1.0 : 0.5,
        origin: departureAirport.iataCode ? 1.0 : 0.7,
        destination: arrivalAirport.iataCode ? 1.0 : 0.7,
        departureDate: flight.departureTime ? 1.0 : 0.5,
        departureTime: flight.departureTime ? 1.0 : 0.5,
        arrivalDate: flight.arrivalTime ? 1.0 : 0.5,
        arrivalTime: flight.arrivalTime ? 1.0 : 0.5,
      },
    };
  }

  // Check for direct Flight type
  if (item['@type'] === 'Flight') {
    const departureAirport = item.departureAirport;
    const arrivalAirport = item.arrivalAirport;

    if (!departureAirport || !arrivalAirport) return null;

    return {
      flightNumber: item.flightNumber || undefined,
      airline: item.airline?.name || item.provider?.name || undefined,
      airlineCode: item.airline?.iataCode || undefined,

      origin: departureAirport.iataCode || departureAirport.name || '',
      destination: arrivalAirport.iataCode || arrivalAirport.name || '',

      departureDate: extractDate(item.departureTime) || '',
      departureTime: extractTime(item.departureTime) || '',
      arrivalDate: extractDate(item.arrivalTime) || '',
      arrivalTime: extractTime(item.arrivalTime) || '',

      extractionMethod: 'structured-data',
      confidence: 0.95,
    };
  }

  return null;
}

/**
 * Extract from microdata (HTML attributes)
 * Less common but some airlines use it
 */
function extractFromMicrodata(html: string): ExtractedFlight[] {
  const flights: ExtractedFlight[] = [];

  // This is a simplified implementation
  // Full microdata parsing would require a proper parser

  const flightReservationRegex = /itemtype=["']https?:\/\/schema\.org\/FlightReservation["']/gi;
  if (flightReservationRegex.test(html)) {
    // Found microdata, but full parsing is complex
    // For now, return empty and rely on LLM fallback
    console.log('Microdata detected but full parsing not implemented');
  }

  return flights;
}

/**
 * Extract date from ISO 8601 datetime string
 * Returns YYYY-MM-DD format
 */
function extractDate(datetime?: string): string | null {
  if (!datetime) return null;

  try {
    const date = new Date(datetime);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Extract time from ISO 8601 datetime string
 * Returns HH:MM format in local time
 */
function extractTime(datetime?: string): string | null {
  if (!datetime) return null;

  try {
    const date = new Date(datetime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return null;
  }
}
