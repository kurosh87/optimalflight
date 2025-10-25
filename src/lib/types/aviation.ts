/**
 * Aviation Knowledge Graph Types
 * Core entities for flight search and route visualization
 */

export interface Airport {
  id: string;
  iata: string; // 3-letter code (e.g., "SFO")
  icao: string; // 4-letter code (e.g., "KSFO")
  name: string;
  city: string;
  country: string;
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
  latitude: number;
  longitude: number;
  altitude: number; // meters above sea level
  // Jetlag-specific metadata
  jetlagFacilities: {
    sleepPods: boolean;
    quietZones: boolean;
    showers: boolean;
    spas: boolean;
  };
  connectivity: number; // Number of routes from this airport
}

export interface Airline {
  id: string;
  iata: string; // 2-letter code (e.g., "UA")
  icao: string; // 3-letter code (e.g., "UAL")
  name: string;
  alliance: 'Star Alliance' | 'OneWorld' | 'SkyTeam' | null;
  country: string;
  fleetSize: number;
  // Service quality metrics
  serviceRating: number; // 1-10
  onTimePerformance: number; // percentage (0-100)
}

export interface Aircraft {
  id: string;
  icao: string; // e.g., "B77W" for Boeing 777-300ER
  name: string;
  manufacturer: string;
  // Comfort metrics for jetlag
  cabinPressure: number; // altitude equivalent in feet
  humidity: number; // percentage
  seatPitch: {
    economy: number;
    premiumEconomy: number;
    business: number;
    first: number;
  };
  jetlagComfortScore: number; // 1-10 (higher is better)
}

export interface Route {
  id: string;
  originAirportId: string;
  destinationAirportId: string;
  airlineId: string;
  distance: number; // in km
  duration: number; // in minutes
  frequency: number; // flights per week
  aircraftTypes: string[]; // array of aircraft ICAOs
  // Jetlag scoring
  timeZonesCrossed: number;
  direction: 'eastbound' | 'westbound' | 'northbound' | 'southbound';
  jetlagScore: number; // 1-10 (lower is better)
}

export interface Flight {
  id: string;
  routeId: string;
  flightNumber: string;
  departureTime: string; // ISO 8601
  arrivalTime: string; // ISO 8601
  price: number;
  currency: string;
  stops: number;
  // Jetlag optimization
  arrivalTimeOptimality: number; // 1-10 (higher is better)
  jetlagRecoveryDays: number; // Estimated recovery time
}

export interface FlightLeg {
  flightNumber: string;
  airline: Airline;
  aircraft: Aircraft;
  origin: Airport;
  destination: Airport;
  departure: string; // ISO 8601
  arrival: string; // ISO 8601
  duration: number; // minutes
  layoverAfter?: number; // minutes
}

export interface FlightOption {
  id: string;
  legs: FlightLeg[];
  totalPrice: number;
  totalDuration: number; // minutes
  // JETLAG SCORING (primary differentiator)
  jetlagImpact: {
    score: number; // 1-10 (1 = minimal jetlag, 10 = severe)
    timeZonesCrossed: number;
    direction: string;
    estimatedRecoveryDays: number;
    arrivalTimeOptimality: number; // How well timed is arrival
    explanation: string; // Human-readable explanation
    recommendations: string[]; // ["Arrive during daylight hours", etc.]
  };
  // Additional rankings
  comfortScore: number; // Based on aircraft, airline service
  carbonEmissions: number; // kg CO2
  bookingUrl: string; // Deep link to airline or OTA
}

export interface PassengerInfo {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearchRequest {
  origin: string; // IATA code or city name
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // for round trips
  passengers: PassengerInfo;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  // Jetlag-specific filters
  maxJetlagScore?: number; // Filter out high-jetlag options
  preferredArrivalTimeRange?: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  userCircadianProfile?: {
    chronotype: 'morning' | 'evening' | 'neutral';
    sleepPreference: number; // hours per night
  };
  // Standard filters
  maxStops?: number;
  airlines?: string[]; // IATA codes
  alliances?: Array<'Star Alliance' | 'OneWorld' | 'SkyTeam'>;
  maxPrice?: number;
  aircraftTypes?: string[]; // prefer specific aircraft
}

export interface FlightSearchResponse {
  results: FlightOption[];
  metadata: {
    searchId: string;
    totalResults: number;
    currency: string;
    searchTime: number; // ms
  };
}

export interface SearchFilters {
  // Price & Time
  priceRange: [number, number];
  departureTimeRange: [string, string]; // HH:MM format
  arrivalTimeRange: [string, string];
  maxDuration: number; // minutes

  // Routing
  maxStops: number;
  preferredLayoverAirports: string[]; // IATA codes
  avoidAirports: string[]; // IATA codes

  // Airlines & Alliances
  airlines: string[];
  alliances: string[];
  excludeAirlines: string[];

  // Aircraft & Comfort
  aircraftTypes: string[]; // prefer widebody, etc.
  minSeatPitch: number; // inches
  amenities: Array<'wifi' | 'power' | 'entertainment' | 'meals'>;

  // JETLAG OPTIMIZATION (key differentiator)
  maxJetlagScore: number; // 1-10
  prioritizeArrivalTiming: boolean; // optimize for circadian rhythm
  minimizeRecoveryTime: boolean;
  preferDaytimeArrivals: boolean;

  // Booking Preferences
  bookingClass: 'economy' | 'premium' | 'business' | 'first';
  baggageIncluded: boolean;
  refundable: boolean;
}

export type SortOption =
  | 'jetlag_score' // UNIQUE: Lowest jetlag impact first
  | 'price_low'
  | 'duration_short'
  | 'departure_early'
  | 'arrival_optimal' // UNIQUE: Best arrival time for body clock
  | 'comfort_high'
  | 'carbon_low';

export interface Recommendation {
  type: 'best_value' | 'lowest_jetlag' | 'fastest' | 'cheapest';
  flightId: string;
  reason: string;
  savings?: {
    priceDifference?: number;
    timeSaved?: number; // hours
    recoverySavings?: number; // days
    productivityValue?: number; // dollars
  };
  metrics?: {
    priceDifference?: number;
    recoverySavings?: string;
    productivityValue?: number;
  };
}

export interface MultiCityRequest {
  cities: string[]; // ordered list of cities
  dates: string[]; // date for each leg
  passengers: PassengerInfo;
  optimizationGoal: 'minimize_jetlag' | 'minimize_price' | 'minimize_time';
  constraints: {
    maxJetlagScore?: number;
    maxTotalPrice?: number;
    preferredAirlines?: string[];
  };
}

export interface MultiCityItinerary {
  legs: FlightOption[];
  totalJetlagImpact: number;
  totalPrice: number;
  totalDuration: number;
  recommendations: string[];
}

export interface UserCircadianProfile {
  userId: string;
  // Basic profile
  chronotype: 'morning' | 'intermediate' | 'evening'; // lark, neutral, owl
  averageSleepDuration: number; // hours
  preferredBedtime: string; // HH:MM
  preferredWakeTime: string; // HH:MM
  // Travel history (learn from past trips)
  pastTrips: Array<{
    route: Route;
    reportedJetlagSeverity: number; // 1-10
    actualRecoveryDays: number;
    notes: string;
  }>;
}

export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}
