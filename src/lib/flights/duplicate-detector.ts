/**
 * Duplicate Flight Detector
 * Smart detection and handling of duplicate flights
 */

import { getDb } from '@/lib/db';
import { flights } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import crypto from 'crypto';
import type { ExtractedFlight, DuplicateCheckResult } from '@/lib/email-import/types';

export class DuplicateDetector {
  constructor(private userId: string) {}

  /**
   * Check if an extracted flight is a duplicate of an existing flight
   * Returns comprehensive match result with merge suggestions
   */
  async check(flight: ExtractedFlight): Promise<DuplicateCheckResult> {
    const db = getDb();

    // Get user's existing flights
    const userFlights = await db.query.flights.findMany({
      where: eq(flights.ownerId, this.userId),
    });

    if (userFlights.length === 0) {
      return { isDuplicate: false, confidence: 1.0 };
    }

    // Strategy 1: Exact match by deduplication hash
    const hash = this.generateDeduplicationHash(flight);
    const hashMatch = userFlights.find((f) => f.deduplicationHash === hash);

    if (hashMatch) {
      return {
        isDuplicate: true,
        matchType: 'exact',
        existingFlightId: hashMatch.id.toString(),
        existingFlight: hashMatch,
        confidence: 1.0,
        shouldUpdate: false, // Don't update exact matches
      };
    }

    // Strategy 2: Match by booking reference
    if (flight.bookingReference) {
      const bookingMatch = userFlights.find(
        (f) => f.bookingReference === flight.bookingReference
      );

      if (bookingMatch) {
        // Check if this is the same flight or a related flight (e.g., return leg)
        const isSameFlight = this.isSameFlight(flight, bookingMatch);

        if (isSameFlight) {
          return {
            isDuplicate: true,
            matchType: 'booking-ref',
            existingFlightId: bookingMatch.id.toString(),
            existingFlight: bookingMatch,
            confidence: 0.95,
            shouldUpdate: this.shouldUpdate(flight, bookingMatch),
            mergeSuggestions: this.getMergeSuggestions(flight, bookingMatch),
          };
        }
        // If different route but same booking, it's a different leg
      }
    }

    // Strategy 3: Match by flight number + departure date
    if (flight.flightNumber && flight.departureDate) {
      const flightNumberMatch = userFlights.find((f) => {
        if (f.flightNumber !== flight.flightNumber) return false;

        // Same date or within 24 hours (in case of timezone confusion)
        const existingDate = new Date(f.departureTime);
        const newDate = new Date(`${flight.departureDate}T${flight.departureTime || '00:00'}:00`);
        const hoursDiff = Math.abs(existingDate.getTime() - newDate.getTime()) / (1000 * 60 * 60);

        return hoursDiff < 24;
      });

      if (flightNumberMatch) {
        return {
          isDuplicate: true,
          matchType: 'flight-number',
          existingFlightId: flightNumberMatch.id.toString(),
          existingFlight: flightNumberMatch,
          confidence: 0.9,
          shouldUpdate: this.shouldUpdate(flight, flightNumberMatch),
        };
      }
    }

    // Strategy 4: Fuzzy match (same route + similar time)
    const fuzzyMatch = userFlights.find((f) => {
      // Same origin and destination
      if (f.originAirportCode !== flight.origin || f.destinationAirportCode !== flight.destination) {
        return false;
      }

      // Departure time within 2 hours
      const existingTime = new Date(f.departureTime);
      const newTime = new Date(`${flight.departureDate}T${flight.departureTime}:00`);
      const hoursDiff = Math.abs(existingTime.getTime() - newTime.getTime()) / (1000 * 60 * 60);

      return hoursDiff < 2;
    });

    if (fuzzyMatch) {
      return {
        isDuplicate: true,
        matchType: 'fuzzy',
        existingFlightId: fuzzyMatch.id.toString(),
        existingFlight: fuzzyMatch,
        confidence: 0.75,
        shouldUpdate: false, // Too risky - ask user
        mergeSuggestions: ['Possible duplicate - please review manually'],
      };
    }

    // No duplicate found
    return { isDuplicate: false, confidence: 1.0 };
  }

  /**
   * Generate deduplication hash from key flight fields
   * Used for exact match detection
   */
  generateDeduplicationHash(flight: ExtractedFlight | any): string {
    // Create hash from key fields (normalized to lowercase)
    const key = [
      flight.flightNumber || flight.flight_number,
      flight.origin || flight.originAirportCode,
      flight.destination || flight.destinationAirportCode,
      flight.departureDate || this.extractDate(flight.departureTime),
      flight.departureTime || this.extractTime(flight.departureTime),
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .join('|');

    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Check if extracted flight matches existing flight's details
   * (same route and date, not just same booking)
   */
  private isSameFlight(extracted: ExtractedFlight, existing: any): boolean {
    return (
      extracted.origin === existing.originAirportCode &&
      extracted.destination === existing.destinationAirportCode &&
      extracted.departureDate === this.extractDate(existing.departureTime)
    );
  }

  /**
   * Determine if we should update the existing flight with new data
   * Update if new data has higher confidence or more complete fields
   */
  private shouldUpdate(extracted: ExtractedFlight, existing: any): boolean {
    // Count non-null fields in each
    const extractedFields = Object.values(extracted).filter((v) => v != null).length;
    const existingFields = Object.values(existing).filter((v) => v != null).length;

    // Update if extracted has more data
    if (extractedFields > existingFields) {
      return true;
    }

    // Update if extracted has higher confidence
    const extractedConfidence = extracted.confidence || 0;
    const existingConfidence = existing.importConfidence || 0;

    return extractedConfidence > existingConfidence;
  }

  /**
   * Generate suggestions for merging data from extracted flight into existing
   */
  private getMergeSuggestions(extracted: ExtractedFlight, existing: any): string[] {
    const suggestions: string[] = [];

    // Check for new data that could be added
    if (extracted.seatNumber && !existing.seatNumber) {
      suggestions.push(`Add seat number: ${extracted.seatNumber}`);
    }

    if (extracted.gate && !existing.gate) {
      suggestions.push(`Add gate: ${extracted.gate}`);
    }

    if (extracted.terminal && !existing.terminal) {
      suggestions.push(`Add terminal: ${extracted.terminal}`);
    }

    if (extracted.confirmationNumber && !existing.confirmationNumber) {
      suggestions.push(`Add confirmation number: ${extracted.confirmationNumber}`);
    }

    if (extracted.cabinClass && !existing.cabinClass) {
      suggestions.push(`Add cabin class: ${extracted.cabinClass}`);
    }

    if (suggestions.length === 0) {
      suggestions.push('No new data to merge');
    }

    return suggestions;
  }

  /**
   * Extract date from timestamp
   */
  private extractDate(timestamp: any): string {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  /**
   * Extract time from timestamp
   */
  private extractTime(timestamp: any): string {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }
}

/**
 * Merge extracted flight data into existing flight
 * Returns updated flight data
 */
export function mergeFlightData(
  extracted: ExtractedFlight,
  existing: any
): Partial<typeof flights.$inferInsert> {
  return {
    // Update these fields if extracted has better data
    flightNumber: extracted.flightNumber || existing.flightNumber,
    airline: extracted.airline || existing.airline,
    seatNumber: extracted.seatNumber || existing.seatNumber,
    gate: extracted.gate || existing.gate,
    terminal: extracted.terminal || existing.terminal,
    aircraft: extracted.aircraft || existing.aircraft,
    cabinClass: extracted.cabinClass || existing.cabinClass,
    bookingReference: extracted.bookingReference || existing.bookingReference,
    confirmationNumber: extracted.confirmationNumber || existing.confirmationNumber,
    importConfidence: Math.max(extracted.confidence || 0, existing.importConfidence || 0),
    reviewedByUser: false, // Reset review status if data changed
    updatedAt: new Date(),
  };
}
