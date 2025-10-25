/**
 * Kiwi API Adapter with Jetlag Scoring
 *
 * Transforms Kiwi API results into scored flight options
 */

import { FlightOption, scoreAndRankFlights, FlightScore } from './flight-scorer';

// Kiwi API types (simplified)
export interface KiwiRoute {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  local_departure: string;
  utc_departure: string;
  local_arrival: string;
  utc_arrival: string;
  duration: {
    total: number; // seconds
  };
  airlines: string[];
  route: Array<{
    airline: string;
    flight_no: number;
    equipment?: string | null;
  }>;
  price?: number;
  currency?: string;
  deep_link?: string; // Kiwi.com booking URL
  booking_token?: string; // Booking token for Kiwi API
}

export interface KiwiSearchResult {
  data: KiwiRoute[];
  _results: number;
}

/**
 * Map airport IATA code to timezone
 * This should ideally come from the airports database
 */
const AIRPORT_TIMEZONES: Record<string, string> = {
  // North America
  'JFK': 'America/New_York',
  'EWR': 'America/New_York',
  'LGA': 'America/New_York',
  'LAX': 'America/Los_Angeles',
  'SFO': 'America/Los_Angeles',
  'ORD': 'America/Chicago',
  'DFW': 'America/Chicago',
  'DEN': 'America/Denver',
  'SEA': 'America/Los_Angeles',
  'YYZ': 'America/Toronto',
  'YVR': 'America/Vancouver',

  // Europe
  'LHR': 'Europe/London',
  'CDG': 'Europe/Paris',
  'FRA': 'Europe/Berlin',
  'AMS': 'Europe/Amsterdam',
  'MAD': 'Europe/Madrid',
  'FCO': 'Europe/Rome',
  'ZRH': 'Europe/Zurich',
  'MUC': 'Europe/Berlin',
  'IST': 'Europe/Istanbul',

  // Asia
  'NRT': 'Asia/Tokyo',
  'HND': 'Asia/Tokyo',
  'ICN': 'Asia/Seoul',
  'PVG': 'Asia/Shanghai',
  'PEK': 'Asia/Shanghai',
  'HKG': 'Asia/Hong_Kong',
  'SIN': 'Asia/Singapore',
  'BKK': 'Asia/Bangkok',
  'DEL': 'Asia/Kolkata',
  'BOM': 'Asia/Kolkata',
  'DXB': 'Asia/Dubai',
  'DOH': 'Asia/Qatar',

  // Oceania
  'SYD': 'Australia/Sydney',
  'MEL': 'Australia/Melbourne',
  'AKL': 'Pacific/Auckland',

  // South America
  'GRU': 'America/Sao_Paulo',
  'EZE': 'America/Argentina/Buenos_Aires',
  'SCL': 'America/Santiago',
  'BOG': 'America/Bogota',
  'LIM': 'America/Lima',

  // Middle East
  'CAI': 'Africa/Cairo',
  'TLV': 'Asia/Jerusalem',

  // Africa
  'JNB': 'Africa/Johannesburg',
  'CPT': 'Africa/Johannesburg',
  'NBO': 'Africa/Nairobi',
};

/**
 * Get timezone for airport IATA code
 * Falls back to querying airports database if not in hardcoded map
 */
function getAirportTimezone(iataCode: string): string {
  const timezone = AIRPORT_TIMEZONES[iataCode.toUpperCase()];
  if (!timezone) {
    console.warn(`Unknown timezone for airport ${iataCode}, using UTC`);
    return 'UTC';
  }
  return timezone;
}

/**
 * Transform Kiwi route to FlightOption
 */
function kiwiRouteToFlightOption(route: KiwiRoute): FlightOption {
  const originTimezone = getAirportTimezone(route.flyFrom);
  const destinationTimezone = getAirportTimezone(route.flyTo);

  return {
    id: route.id,
    originIata: route.flyFrom,
    destinationIata: route.flyTo,
    originCity: route.cityFrom,
    destinationCity: route.cityTo,
    originTimezone,
    destinationTimezone,
    departureTime: new Date(route.local_departure),
    arrivalTime: new Date(route.local_arrival),
    durationMinutes: route.duration.total / 60,
    airline: route.airlines[0], // Primary airline
    aircraftType: route.route[0]?.equipment || undefined,
    stops: route.route.length - 1, // Number of segments minus 1 = stops
  };
}

/**
 * Score Kiwi search results for jetlag impact
 */
export function scoreKiwiResults(kiwiResults: KiwiSearchResult): Array<{
  flight: FlightOption;
  score: FlightScore;
  kiwiRoute: KiwiRoute;
}> {
  // Transform to FlightOptions
  const flightOptions = kiwiResults.data.map(kiwiRouteToFlightOption);

  // Score and rank
  const scoredFlights = scoreAndRankFlights(flightOptions);

  // Combine with original Kiwi data
  return scoredFlights.map((scored, index) => ({
    flight: scored,
    score: scored.score,
    kiwiRoute: kiwiResults.data.find(r => r.id === scored.id)!,
  }));
}

/**
 * Get top N flights ranked by jetlag score
 */
export function getTopFlightsByJetlagScore(
  kiwiResults: KiwiSearchResult,
  limit: number = 10
): Array<{
  flight: FlightOption;
  score: FlightScore;
  kiwiRoute: KiwiRoute;
}> {
  const scored = scoreKiwiResults(kiwiResults);
  return scored.slice(0, limit);
}

/**
 * Filter flights by minimum jetlag score
 */
export function filterByMinimumScore(
  kiwiResults: KiwiSearchResult,
  minScore: number = 6.0
): Array<{
  flight: FlightOption;
  score: FlightScore;
  kiwiRoute: KiwiRoute;
}> {
  const scored = scoreKiwiResults(kiwiResults);
  return scored.filter(result => result.score.overallScore >= minScore);
}

/**
 * Get flights grouped by recommendation level
 */
export function groupByRecommendation(kiwiResults: KiwiSearchResult): {
  excellent: Array<{ flight: FlightOption; score: FlightScore; kiwiRoute: KiwiRoute }>;
  good: Array<{ flight: FlightOption; score: FlightScore; kiwiRoute: KiwiRoute }>;
  fair: Array<{ flight: FlightOption; score: FlightScore; kiwiRoute: KiwiRoute }>;
  poor: Array<{ flight: FlightOption; score: FlightScore; kiwiRoute: KiwiRoute }>;
} {
  const scored = scoreKiwiResults(kiwiResults);

  return {
    excellent: scored.filter(r => r.score.recommendation === 'excellent'),
    good: scored.filter(r => r.score.recommendation === 'good'),
    fair: scored.filter(r => r.score.recommendation === 'fair'),
    poor: scored.filter(r => r.score.recommendation === 'poor'),
  };
}
