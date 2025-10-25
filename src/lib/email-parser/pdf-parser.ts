/**
 * PDF Parser
 * Extracts flight information from PDF attachments (boarding passes, confirmations)
 */

import type { ExtractedFlight, Attachment } from '@/lib/email-import/types';

// @ts-ignore - pdf-parse is a CommonJS module
const pdfParse = require('pdf-parse');

/**
 * Extract flights from PDF attachments
 */
export async function extractFromPDF(
  attachments: Attachment[]
): Promise<ExtractedFlight[]> {
  const flights: ExtractedFlight[] = [];

  for (const attachment of attachments) {
    try {
      console.log(`📄 Processing PDF: ${attachment.filename}`);

      // Decode base64 content
      const buffer = Buffer.from(attachment.content, 'base64');

      // Extract text from PDF
      const data = await pdfParse(buffer);
      const text = data.text;

      console.log(`📄 Extracted ${text.length} characters from PDF`);

      // Try to extract flight info from text
      const flight = extractFlightFromPdfText(text, attachment.filename);

      if (flight) {
        flights.push(flight);
      }
    } catch (error) {
      console.error(`Failed to parse PDF ${attachment.filename}:`, error);
    }
  }

  return flights;
}

/**
 * Extract flight data from PDF text using pattern matching
 * This is a basic implementation - real-world PDFs vary greatly
 */
function extractFlightFromPdfText(
  text: string,
  filename: string
): ExtractedFlight | null {
  // Common patterns in boarding passes and confirmations

  // Flight number pattern: AA1234, UA 837, etc.
  const flightNumberMatch = text.match(
    /(?:Flight|FLT|Flight No\.?)\s*[:;]?\s*([A-Z]{2}\s?\d{1,4})/i
  );
  const flightNumber = flightNumberMatch?.[1]?.replace(/\s/g, '');

  // Airport codes: 3-letter IATA codes
  const airportMatches = text.match(/\b[A-Z]{3}\b/g);
  const uniqueAirports = airportMatches
    ? [...new Set(airportMatches)].filter(
        (code) =>
          // Filter out common non-airport 3-letter words
          !['THE', 'AND', 'FOR', 'YOU', 'ALL', 'NOT', 'ARE', 'BUT'].includes(code)
      )
    : [];

  // Need at least 2 airport codes
  if (uniqueAirports.length < 2) {
    console.warn('Could not find origin/destination in PDF');
    return null;
  }

  // Try to determine which is origin vs destination
  // Usually origin comes before destination
  const [origin, destination] = uniqueAirports.slice(0, 2);

  // Date pattern: various formats
  const dateMatches = text.match(
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi
  );

  // Time pattern: HH:MM format
  const timeMatches = text.match(/\b([0-2]?\d:[0-5]\d)\b/g);

  // Booking reference: usually 6 alphanumeric characters
  const bookingRefMatch = text.match(/(?:PNR|Confirmation|Booking|Record)\s*[:;]?\s*([A-Z0-9]{6})/i);
  const bookingReference = bookingRefMatch?.[1];

  // Seat number
  const seatMatch = text.match(/(?:Seat|SEAT)\s*[:;]?\s*(\d{1,2}[A-Z])/i);
  const seatNumber = seatMatch?.[1];

  // We need at least origin, destination, and one date/time
  if (!origin || !destination || (!dateMatches && !timeMatches)) {
    console.warn('Insufficient flight data in PDF');
    return null;
  }

  // Parse dates and times (simplified - real implementation would be more robust)
  const departureDate = dateMatches?.[0] ? parseDateString(dateMatches[0]) : '';
  const departureTime = timeMatches?.[0] || '';
  const arrivalTime = timeMatches?.[1] || timeMatches?.[0] || '';

  return {
    flightNumber,
    origin,
    destination,
    departureDate,
    departureTime,
    arrivalDate: departureDate, // Assume same day unless we parse more carefully
    arrivalTime,
    bookingReference,
    seatNumber,

    extractionMethod: 'structured-data',
    confidence: 0.6, // Medium confidence for PDF extraction
    confidenceBreakdown: {
      flightNumber: flightNumber ? 0.8 : 0.3,
      origin: 0.7,
      destination: 0.7,
      departureDate: departureDate ? 0.7 : 0.3,
      departureTime: departureTime ? 0.7 : 0.3,
      arrivalTime: arrivalTime ? 0.6 : 0.3,
    },
  };
}

/**
 * Parse date string to YYYY-MM-DD format
 * Handles common formats: "15 Jan 2025", "01/15/2025", etc.
 */
function parseDateString(dateStr: string): string {
  try {
    // Try to parse with Date constructor
    const date = new Date(dateStr);

    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // If that fails, try manual parsing
    // Handle MM/DD/YYYY
    const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (slashMatch) {
      let [, month, day, year] = slashMatch;
      if (year.length === 2) {
        year = '20' + year; // Assume 2000s
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return '';
  } catch {
    return '';
  }
}
