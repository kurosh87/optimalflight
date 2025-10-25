/**
 * LLM Flight Parser
 * Uses OpenAI GPT-4 to extract flight information from any email format
 */

import OpenAI from 'openai';
import type { ExtractedFlight, EmailContent } from '@/lib/email-import/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Extract flights using OpenAI GPT-4
 * Most flexible method - can handle any format
 */
export async function extractWithLLM(
  content: EmailContent
): Promise<ExtractedFlight[]> {
  try {
    // Prefer plain text, fallback to HTML (stripped)
    const emailText = content.text || stripHtml(content.html || '');

    if (!emailText || emailText.length < 50) {
      console.warn('Email content too short for LLM extraction');
      return [];
    }

    // Truncate if too long (GPT-4 has limits)
    const truncatedText = emailText.slice(0, 100000);

    const prompt = buildExtractionPrompt(truncatedText);

    console.log('🤖 Calling OpenAI GPT-4 for flight extraction...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at extracting flight information from emails. You always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for more consistent output
      max_tokens: 4096,
      response_format: { type: 'json_object' }, // Force JSON response
    });

    const responseText = completion.choices[0]?.message?.content || '';

    console.log('🤖 GPT-4 response length:', responseText.length);

    // Extract JSON from response
    const flights = parseFlightsFromResponse(responseText);

    // Add token usage metadata
    const tokensUsed =
      (completion.usage?.prompt_tokens || 0) +
      (completion.usage?.completion_tokens || 0);
    console.log(`🤖 Tokens used: ${tokensUsed}`);

    return flights.map((flight) => ({
      ...flight,
      extractionMethod: 'llm',
    }));
  } catch (error: any) {
    console.error('LLM extraction error:', error);

    // Check if it's an API key error
    if (error.message?.includes('api_key') || error.message?.includes('API key')) {
      console.error(
        '❌ OPENAI_API_KEY not configured - LLM extraction unavailable'
      );
    }

    return [];
  }
}

/**
 * Build the prompt for GPT-4
 */
function buildExtractionPrompt(emailText: string): string {
  return `Extract ALL flights from this email confirmation.

CRITICAL INSTRUCTIONS:
1. Extract EVERY flight mentioned (round trips have 2 flights, multi-city has multiple)
2. For each flight, determine if it's "outbound", "return", or "segment" (for multi-city)
3. If there's a booking reference, include it for ALL related flights
4. Return confidence scores (0-1) for each field
5. If layovers exist, treat each flight segment separately
6. Use IATA codes for airports (3 letters: SFO, JFK, etc.)
7. Use YYYY-MM-DD format for dates
8. Use HH:MM format for times (24-hour)

Return a JSON object with a "flights" array.

Example output format:
{
  "flights": [
    {
      "airline": "United Airlines",
      "airlineCode": "UA",
      "flightNumber": "UA837",
      "origin": "SFO",
      "destination": "NRT",
      "departureDate": "2025-10-15",
      "departureTime": "10:30",
      "arrivalDate": "2025-10-16",
      "arrivalTime": "14:45",
      "bookingReference": "ABC123",
      "confirmationNumber": "XYZ789",
      "passengerName": "John Smith",
      "seatNumber": "12A",
      "cabinClass": "economy",
      "terminal": "Terminal 3",
      "gate": "G7",
      "duration": 720,
      "legType": "outbound",
      "segmentNumber": 1,
      "confidence": 0.95,
      "confidenceBreakdown": {
        "flightNumber": 1.0,
        "origin": 1.0,
        "destination": 1.0,
        "departureDate": 0.9,
        "departureTime": 0.9,
        "arrivalDate": 0.9,
        "arrivalTime": 0.9
      }
    }
  ]
}

Rules:
- IATA codes must be exactly 3 letters (e.g., "SFO", "NRT")
- Dates must be YYYY-MM-DD format
- Times must be HH:MM in 24-hour format
- Confidence: 1.0 = certain, 0.5 = guessed, 0.0 = missing
- If field is missing or uncertain, set it to null
- If NO flights found, return: {"flights": []}
- cabinClass must be one of: "economy", "premium-economy", "business", "first"
- legType must be one of: "outbound", "return", "segment"

Email content:
${emailText}`;
}

/**
 * Parse flights from GPT-4's JSON response
 */
function parseFlightsFromResponse(responseText: string): ExtractedFlight[] {
  try {
    // GPT-4 with json_object mode returns a JSON object
    const parsed = JSON.parse(responseText);

    // Extract the flights array from the response
    let flights = parsed.flights || parsed;

    // Handle case where it's a single flight object
    if (!Array.isArray(flights)) {
      if (flights.origin && flights.destination) {
        flights = [flights];
      } else {
        console.warn('LLM response is not in expected format');
        return [];
      }
    }

    // Validate and clean up each flight
    return flights.map(validateAndCleanFlight).filter(Boolean) as ExtractedFlight[];
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    console.error('Response text:', responseText.substring(0, 500));
    return [];
  }
}

/**
 * Validate and clean up a flight object from LLM
 */
function validateAndCleanFlight(flight: any): ExtractedFlight | null {
  // Required fields
  if (!flight.origin || !flight.destination) {
    console.warn('Flight missing required fields (origin/destination)');
    return null;
  }

  // Validate IATA codes (must be 3 letters)
  if (flight.origin.length !== 3 || flight.destination.length !== 3) {
    console.warn('Invalid IATA codes:', flight.origin, flight.destination);
    return null;
  }

  // Ensure uppercase IATA codes
  flight.origin = flight.origin.toUpperCase();
  flight.destination = flight.destination.toUpperCase();

  // Calculate overall confidence if not provided
  if (!flight.confidence) {
    flight.confidence = calculateConfidence(flight);
  }

  // Ensure confidence breakdown exists
  if (!flight.confidenceBreakdown) {
    flight.confidenceBreakdown = generateConfidenceBreakdown(flight);
  }

  return flight as ExtractedFlight;
}

/**
 * Calculate overall confidence from available fields
 */
function calculateConfidence(flight: any): number {
  const requiredFields = [
    'origin',
    'destination',
    'departureDate',
    'departureTime',
  ];
  const presentFields = requiredFields.filter((field) => flight[field]);
  return presentFields.length / requiredFields.length;
}

/**
 * Generate confidence breakdown for each field
 */
function generateConfidenceBreakdown(flight: any): Record<string, number> {
  const breakdown: Record<string, number> = {};

  const fields = [
    'flightNumber',
    'origin',
    'destination',
    'departureDate',
    'departureTime',
    'arrivalDate',
    'arrivalTime',
    'airline',
    'bookingReference',
    'seatNumber',
  ];

  for (const field of fields) {
    breakdown[field] = flight[field] ? 0.9 : 0.0;
  }

  return breakdown;
}

/**
 * Strip HTML tags to get plain text
 */
function stripHtml(html: string): string {
  return (
    html
      // Remove style and script tags with their content
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      // Remove all HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}
