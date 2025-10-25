/**
 * Input Validation Schemas for Flight Endpoints
 *
 * CRITICAL: Prevents XSS, SQL injection, data corruption, and DoS attacks
 *
 * Applied to:
 * - POST /api/flights (flight creation)
 * - PATCH /api/flights/[id] (flight updates)
 * - POST /api/extension/parse-flight (extension import)
 */

import { z } from 'zod';

// Airport code validation (3 uppercase letters)
const AirportCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Airport code must be 3 uppercase letters (e.g., JFK, LAX)');

// Timezone validation (IANA format)
const TimezoneSchema = z
  .string()
  .max(50)
  .regex(/^[A-Za-z_\/]+$/, 'Invalid timezone format (e.g., America/New_York)');

// Date/time validation (ISO 8601)
const DateTimeSchema = z
  .string()
  .datetime({ message: 'Must be valid ISO 8601 datetime (e.g., 2025-12-01T08:00:00Z)' });

// City name validation (prevent XSS)
const CityNameSchema = z
  .string()
  .min(1, 'City name required')
  .max(100, 'City name too long')
  .trim()
  .regex(/^[a-zA-Z\s\-',]+$/, 'City name contains invalid characters');

// Flight number validation
const FlightNumberSchema = z
  .string()
  .max(20, 'Flight number too long')
  .regex(/^[A-Z0-9]+$/, 'Flight number must be alphanumeric')
  .optional()
  .nullable();

// Airline name validation (prevent XSS)
const AirlineSchema = z
  .string()
  .max(100, 'Airline name too long')
  .trim()
  .regex(/^[a-zA-Z\s\-&.]+$/, 'Airline name contains invalid characters')
  .optional()
  .nullable();

// Duration validation (minutes, max 33 hours)
const DurationSchema = z
  .number()
  .int('Duration must be an integer')
  .min(0, 'Duration cannot be negative')
  .max(2000, 'Duration too long (max 33 hours)')
  .optional();

// Sleep quality validation
const SleepQualitySchema = z
  .enum(['poor', 'fair', 'good', 'excellent'])
  .optional()
  .nullable();

// Adaptability validation
const AdaptabilitySchema = z
  .enum(['low', 'medium', 'high'])
  .optional()
  .nullable();

// Seat number validation
const SeatNumberSchema = z
  .string()
  .max(10, 'Seat number too long')
  .regex(/^[A-Z0-9]+$/, 'Invalid seat number format')
  .optional()
  .nullable();

// Booking reference validation
const BookingReferenceSchema = z
  .string()
  .max(20, 'Booking reference too long')
  .regex(/^[A-Z0-9]+$/, 'Invalid booking reference format')
  .optional()
  .nullable();

/**
 * Complete Flight Creation Schema
 *
 * Used for POST /api/flights
 */
export const FlightCreateSchema = z.object({
  // Required fields
  originAirportCode: AirportCodeSchema,
  destinationAirportCode: AirportCodeSchema,
  originCity: CityNameSchema,
  destinationCity: CityNameSchema,
  originTimezone: TimezoneSchema,
  destinationTimezone: TimezoneSchema,
  departureTime: DateTimeSchema,
  arrivalTime: DateTimeSchema,

  // Optional fields
  flightNumber: FlightNumberSchema,
  airline: AirlineSchema,
  duration: DurationSchema,
  sleepQualityOverride: SleepQualitySchema,
  adaptabilityOverride: AdaptabilitySchema,
  seatNumber: SeatNumberSchema,
  bookingReference: BookingReferenceSchema,

  // Trip association
  tripId: z.string().optional().nullable(),
});

/**
 * Flight Update Schema
 *
 * Used for PATCH /api/flights/[id]
 * All fields optional (partial update)
 */
export const FlightUpdateSchema = z.object({
  originAirportCode: AirportCodeSchema.optional(),
  destinationAirportCode: AirportCodeSchema.optional(),
  originCity: CityNameSchema.optional(),
  destinationCity: CityNameSchema.optional(),
  originTimezone: TimezoneSchema.optional(),
  destinationTimezone: TimezoneSchema.optional(),
  departureTime: DateTimeSchema.optional(),
  arrivalTime: DateTimeSchema.optional(),
  flightNumber: FlightNumberSchema,
  airline: AirlineSchema,
  duration: DurationSchema,
  sleepQualityOverride: SleepQualitySchema,
  adaptabilityOverride: AdaptabilitySchema,
  seatNumber: SeatNumberSchema,
  bookingReference: BookingReferenceSchema,
  tripId: z.string().optional().nullable(),
}).partial();

/**
 * Extension Flight Import Schema
 *
 * Used for POST /api/extension/parse-flight
 * More lenient (extension provides what it can extract)
 */
export const ExtensionFlightSchema = z.object({
  origin: AirportCodeSchema.optional(),
  destination: AirportCodeSchema.optional(),
  departureDate: z.string().optional(),
  departureTime: z.string().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  flightNumber: FlightNumberSchema,
  airline: AirlineSchema,
  bookingReference: BookingReferenceSchema,
  seatNumber: SeatNumberSchema,
  source: z.enum(['extension', 'manual']).optional(),
  extractionMethod: z.enum(['auto', 'manual', 'llm']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  url: z.string().url().optional().nullable(),
  html: z.string().optional(),
  screenshot: z.string().optional(),
  text: z.string().optional(),
});

/**
 * Helper function to validate and sanitize flight data
 */
export function validateFlightInput(
  data: unknown,
  schema: typeof FlightCreateSchema | typeof FlightUpdateSchema | typeof ExtensionFlightSchema
) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return {
      success: false as const,
      errors,
      data: null,
    };
  }

  return {
    success: true as const,
    errors: null,
    data: result.data,
  };
}

/**
 * Common validation errors for better UX
 */
export const ValidationErrors = {
  INVALID_AIRPORT_CODE: 'Airport code must be exactly 3 uppercase letters (e.g., JFK, LAX, SFO)',
  INVALID_DATE_FORMAT: 'Date must be in ISO 8601 format (e.g., 2025-12-01T08:00:00Z)',
  INVALID_TIMEZONE: 'Timezone must be in IANA format (e.g., America/New_York)',
  CITY_TOO_LONG: 'City name must be less than 100 characters',
  FLIGHT_NUMBER_INVALID: 'Flight number must be alphanumeric (e.g., AA1234, UA500)',
  XSS_DETECTED: 'Input contains invalid characters',
  FIELD_REQUIRED: 'This field is required',
  DURATION_TOO_LONG: 'Flight duration cannot exceed 33 hours (2000 minutes)',
};
