/**
 * Flight Data Enricher
 * Validates and enriches extracted flight data with complete airport/airline information
 */

import { getDb } from '@/lib/db';
import { airports, airlines } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import type { ExtractedFlight, AirportData, AirlineData, EnrichmentResult } from '@/lib/email-import/types';

export class FlightEnricher {
  /**
   * Enrich and validate extracted flight data
   * - Validates airport codes
   * - Looks up airport/airline details
   * - Validates dates and times
   * - Determines if international
   */
  async enrich(flight: ExtractedFlight): Promise<ExtractedFlight> {
    const enriched = { ...flight };

    // 1. Validate and enrich airport data
    const originAirport = await this.enrichAirport(flight.origin);
    const destinationAirport = await this.enrichAirport(flight.destination);

    if (!originAirport || !destinationAirport) {
      console.warn(`⚠️ Invalid airport codes: ${flight.origin} or ${flight.destination}`);
      enriched.confidence = (enriched.confidence || 0.5) * 0.5; // Reduce confidence
    } else {
      // Add enriched airport data
      enriched.originCity = originAirport.city;
      enriched.originCountry = originAirport.country;
      enriched.originTimezone = originAirport.timezone;

      enriched.destinationCity = destinationAirport.city;
      enriched.destinationCountry = destinationAirport.country;
      enriched.destinationTimezone = destinationAirport.timezone;

      // Determine if international
      enriched.isInternational = originAirport.country !== destinationAirport.country;
    }

    // 2. Enrich airline data
    if (flight.airlineCode || flight.flightNumber) {
      const airlineCode = flight.airlineCode || this.inferAirlineCode(flight.flightNumber);

      if (airlineCode) {
        const airline = await this.enrichAirline(airlineCode);
        if (airline) {
          enriched.airline = enriched.airline || airline.name;
          enriched.airlineCode = airlineCode;
        }
      }
    }

    // 3. Validate and calculate duration
    if (enriched.departureDate && enriched.departureTime && enriched.arrivalDate && enriched.arrivalTime) {
      const duration = this.calculateDuration(
        enriched.departureDate,
        enriched.departureTime,
        enriched.arrivalDate,
        enriched.arrivalTime
      );

      if (duration) {
        enriched.duration = duration;

        // Validate duration is reasonable (1-20 hours typically)
        if (duration < 30 || duration > 1200) {
          // 30 min to 20 hours
          console.warn(`⚠️ Suspicious flight duration: ${duration} minutes`);
          enriched.confidence = (enriched.confidence || 0.5) * 0.8;
        }
      }
    }

    // 4. Validate date/time logic
    enriched.confidence = (enriched.confidence || 0.5) * this.validateDateTimes(enriched);

    return enriched;
  }

  /**
   * Look up airport by IATA code
   */
  private async enrichAirport(iataCode: string): Promise<AirportData | null> {
    if (!iataCode || iataCode.length !== 3) {
      return null;
    }

    try {
      const db = getDb();
      const airport = await db.query.airports.findFirst({
        where: eq(airports.iataCode, iataCode.toUpperCase()),
      });

      if (!airport) {
        console.warn(`Airport not found: ${iataCode}`);
        return null;
      }

      return {
        iataCode: airport.iataCode || iataCode,
        name: airport.airportName,
        city: airport.cityId || 'Unknown',
        country: airport.countryName || 'Unknown',
        timezone: airport.timezone || 'UTC',
        latitude: airport.latitude || undefined,
        longitude: airport.longitude || undefined,
      };
    } catch (error) {
      console.error(`Error enriching airport ${iataCode}:`, error);
      return null;
    }
  }

  /**
   * Look up airline by code
   */
  private async enrichAirline(code: string): Promise<AirlineData | null> {
    if (!code) return null;

    try {
      const db = getDb();
      const airline = await db.query.airlines.findFirst({
        where: or(
          eq(airlines.iataCode, code.toUpperCase()),
          eq(airlines.icaoCode, code.toUpperCase())
        ),
      });

      if (!airline) {
        console.warn(`Airline not found: ${code}`);
        return null;
      }

      return {
        iataCode: airline.iataCode || undefined,
        icaoCode: airline.icaoCode || undefined,
        name: airline.airlineName,
        country: airline.countryName || undefined,
      };
    } catch (error) {
      console.error(`Error enriching airline ${code}:`, error);
      return null;
    }
  }

  /**
   * Infer airline code from flight number
   * E.g., "UA837" -> "UA"
   */
  private inferAirlineCode(flightNumber?: string): string | undefined {
    if (!flightNumber) return undefined;

    // Extract airline code (usually first 2 letters)
    const match = flightNumber.match(/^([A-Z]{2})/);
    return match?.[1];
  }

  /**
   * Calculate flight duration in minutes
   */
  private calculateDuration(
    departureDate: string,
    departureTime: string,
    arrivalDate: string,
    arrivalTime: string
  ): number | undefined {
    try {
      const departure = new Date(`${departureDate}T${departureTime}:00`);
      const arrival = new Date(`${arrivalDate}T${arrivalTime}:00`);

      const durationMs = arrival.getTime() - departure.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      return durationMinutes > 0 ? durationMinutes : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Validate date/time logic
   * Returns confidence multiplier (0-1)
   */
  private validateDateTimes(flight: ExtractedFlight): number {
    let confidenceMultiplier = 1.0;

    try {
      if (!flight.departureDate || !flight.departureTime || !flight.arrivalDate || !flight.arrivalTime) {
        return 0.5; // Missing critical time data
      }

      const departure = new Date(`${flight.departureDate}T${flight.departureTime}:00`);
      const arrival = new Date(`${flight.arrivalDate}T${flight.arrivalTime}:00`);

      // Validate arrival is after departure
      if (arrival <= departure) {
        console.warn('⚠️ Arrival before departure - likely timezone issue');
        confidenceMultiplier *= 0.6;
      }

      // Validate flight is not too far in the past
      const now = new Date();
      const monthsAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (departure < monthsAgo) {
        console.warn('⚠️ Flight is more than 30 days in the past');
        confidenceMultiplier *= 0.7;
      }

      // Validate flight is not too far in the future (more than 2 years)
      const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);

      if (departure > twoYearsFromNow) {
        console.warn('⚠️ Flight is more than 2 years in the future');
        confidenceMultiplier *= 0.8;
      }
    } catch (error) {
      console.error('Error validating date/times:', error);
      return 0.5;
    }

    return confidenceMultiplier;
  }
}

/**
 * Convert enriched flight to database format
 */
export function toFlightRecord(
  userId: string,
  flight: ExtractedFlight,
  emailImportId?: string
): any {
  // Combine date and time into full timestamps
  const departureTime = new Date(`${flight.departureDate}T${flight.departureTime}:00`);
  const arrivalTime = new Date(`${flight.arrivalDate}T${flight.arrivalTime}:00`);

  return {
    ownerId: userId,
    flightNumber: flight.flightNumber || null,
    airline: flight.airline || null,

    originAirportCode: flight.origin,
    originCity: flight.originCity || flight.origin,
    originTimezone: flight.originTimezone || 'UTC',
    originCountry: flight.originCountry || null,

    destinationAirportCode: flight.destination,
    destinationCity: flight.destinationCity || flight.destination,
    destinationTimezone: flight.destinationTimezone || 'UTC',
    destinationCountry: flight.destinationCountry || null,

    departureTime,
    arrivalTime,
    duration: flight.duration || null,

    isInternational: flight.isInternational || false,

    // Import metadata
    bookingReference: flight.bookingReference || null,
    confirmationNumber: flight.confirmationNumber || null,
    emailImportId: emailImportId ? BigInt(emailImportId) : null,
    importConfidence: flight.confidence || 0.5,
    requiresReview: (flight.confidence || 0.5) < 0.7,
    deduplicationHash: null, // Will be set by duplicate detector

    // Flight details
    aircraft: flight.aircraft || null,
    cabinClass: flight.cabinClass || null,
    seatNumber: flight.seatNumber || null,
    terminal: flight.terminal || null,
    gate: flight.gate || null,

    status: 'upcoming',
  };
}
