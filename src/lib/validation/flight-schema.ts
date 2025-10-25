import { z } from 'zod';

export const FlightDataSchema = z.object({
  flightNumber: z.string().min(1),
  airline: z.string().optional(),
  airlineCode: z.string().length(2).optional(),
  originAirportCode: z.string().length(3),
  originCity: z.string().optional(),
  originTimezone: z.string().optional(),
  destinationAirportCode: z.string().length(3),
  destinationCity: z.string().optional(),
  destinationTimezone: z.string().optional(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  duration: z.number().positive().optional(),
  confirmationCode: z.string().optional(),
  seatNumber: z.string().optional(),
  gate: z.string().optional(),
  terminal: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type FlightData = z.infer<typeof FlightDataSchema>;

export function safeValidateFlightData(data: unknown) {
  const result = FlightDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}
