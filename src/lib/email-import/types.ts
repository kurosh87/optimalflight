/**
 * TypeScript types for email-based flight import system
 */

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content: string; // base64 encoded
}

export interface ExtractedFlight {
  // Core flight data
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:MM

  // Additional data
  bookingReference?: string;
  confirmationNumber?: string;
  passengerName?: string;
  seatNumber?: string;
  cabinClass?: string; // economy, premium-economy, business, first
  terminal?: string;
  gate?: string;
  aircraft?: string;
  duration?: number; // minutes

  // Enriched data (added during processing)
  originCity?: string;
  originCountry?: string;
  originTimezone?: string;
  destinationCity?: string;
  destinationCountry?: string;
  destinationTimezone?: string;
  isInternational?: boolean;

  // Metadata
  extractionMethod: 'structured-data' | 'llm' | 'ocr' | 'hybrid';
  confidence: number; // 0-1
  confidenceBreakdown?: {
    [field: string]: number;
  };
  rawData?: any;

  // Context
  legType?: 'outbound' | 'return' | 'segment';
  segmentNumber?: number;
  relatedFlights?: string[]; // booking refs of related flights
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: 'exact' | 'fuzzy' | 'booking-ref' | 'flight-number';
  existingFlightId?: string;
  existingFlight?: any;
  confidence: number;
  shouldUpdate?: boolean;
  mergeSuggestions?: string[];
}

export interface SkippedFlight {
  flight: ExtractedFlight;
  reason: string;
  existingFlightId?: string;
}

export interface ProcessingResult {
  success: boolean;
  flightsDetected: number;
  flightsCreated: number;
  flightsSkipped: number;
  flightsUpdated: number;

  createdFlights: any[];
  skippedFlights: SkippedFlight[];
  updatedFlights: any[];

  errors: string[];
  warnings: string[];

  requiresReview: boolean;
  reviewUrl?: string;

  processingTimeMs?: number;
  llmTokensUsed?: number;
}

export interface EmailContent {
  html?: string;
  text?: string;
  attachments?: Attachment[];
}

export interface InboundEmailPayload {
  from: string;
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: string; // base64
  }>;
}

export interface AirportData {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export interface AirlineData {
  iataCode?: string;
  icaoCode?: string;
  name: string;
  country?: string;
}

export interface EnrichmentResult {
  origin?: AirportData;
  destination?: AirportData;
  airline?: AirlineData;
  isInternational: boolean;
  timezoneValid: boolean;
  durationReasonable: boolean;
}

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'partial'
  | 'failed'
  | 'review_needed';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function calculateConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export function calculateOverallConfidence(flight: ExtractedFlight): number {
  const requiredFields = [
    'origin',
    'destination',
    'departureDate',
    'departureTime',
    'arrivalDate',
    'arrivalTime',
  ];

  const breakdown = flight.confidenceBreakdown || {};
  const scores = requiredFields.map((field) => breakdown[field] || (flight[field as keyof ExtractedFlight] ? 1 : 0));

  return scores.reduce((sum, score) => sum + score, 0) / requiredFields.length;
}
