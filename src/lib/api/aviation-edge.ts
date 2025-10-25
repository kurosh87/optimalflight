/**
 * Aviation Edge API Integration
 * $49/month Developer tier for current route data
 * https://aviation-edge.com
 */

const AVIATION_EDGE_API_KEY = process.env.AVIATION_EDGE_API_KEY || '';
const BASE_URL = 'https://aviation-edge.com/v2/public';

export interface AviationEdgeRoute {
  airlineIata: string;
  airlineIcao: string;
  departureIata: string;
  departureIcao: string;
  arrivalIata: string;
  arrivalIcao: string;
}

export interface AviationEdgeSchedule {
  airline: {
    iataCode: string;
    icaoCode: string;
  };
  flight: {
    iataNumber: string;
    icaoNumber: string;
  };
  departure: {
    iataCode: string;
    icaoCode: string;
    terminal: string;
    scheduledTime: string;
  };
  arrival: {
    iataCode: string;
    icaoCode: string;
    terminal: string;
    scheduledTime: string;
  };
  aircraft: {
    modelCode: string;
    modelText: string;
  };
  codeshared: any;
}

/**
 * Get all routes for a specific airline
 */
export async function getAirlineRoutes(airlineIata: string): Promise<AviationEdgeRoute[]> {
  if (!AVIATION_EDGE_API_KEY) {
    console.warn('AVIATION_EDGE_API_KEY not set');
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/routes?key=${AVIATION_EDGE_API_KEY}&airlineIata=${airlineIata}`
    );

    if (!response.ok) {
      throw new Error(`Aviation Edge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching airline routes:', error);
    return [];
  }
}

/**
 * Get flight schedules from an airport
 * 6 months forward visibility
 */
export async function getAirportSchedules(
  airportIata: string,
  departureDate: string
): Promise<AviationEdgeSchedule[]> {
  if (!AVIATION_EDGE_API_KEY) {
    console.warn('AVIATION_EDGE_API_KEY not set');
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/flightsSchedule?key=${AVIATION_EDGE_API_KEY}&airportIata=${airportIata}&departure_date=${departureDate}`
    );

    if (!response.ok) {
      throw new Error(`Aviation Edge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching airport schedules:', error);
    return [];
  }
}

/**
 * Get all routes from Aviation Edge
 * Use sparingly - expensive API call
 */
export async function getAllRoutes(): Promise<AviationEdgeRoute[]> {
  if (!AVIATION_EDGE_API_KEY) {
    console.warn('AVIATION_EDGE_API_KEY not set');
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/routes?key=${AVIATION_EDGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Aviation Edge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all routes:', error);
    return [];
  }
}

/**
 * Sync routes from Aviation Edge to database
 * Run daily to keep routes current
 */
export async function syncRoutesFromAviationEdge() {
  console.log('🔄 Syncing routes from Aviation Edge...');

  const routes = await getAllRoutes();

  console.log(`📊 Received ${routes.length} routes from Aviation Edge`);

  // TODO: Compare with database and update
  // Mark routes not in API as potentially inactive
  // Add new routes
  // Update existing routes

  return {
    total: routes.length,
    new: 0, // Count of new routes added
    updated: 0, // Count of routes updated
    inactive: 0, // Count of routes marked inactive
  };
}

/**
 * Rate limiting helper
 * Aviation Edge: Be respectful with API calls
 */
class AviationEdgeClient {
  private lastCallTime: number = 0;
  private minDelay: number = 1000; // 1 second between calls

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastCall));
    }

    this.lastCallTime = Date.now();
  }

  async getAirlineRoutes(airlineIata: string): Promise<AviationEdgeRoute[]> {
    await this.rateLimit();
    return getAirlineRoutes(airlineIata);
  }

  async getAirportSchedules(airportIata: string, date: string): Promise<AviationEdgeSchedule[]> {
    await this.rateLimit();
    return getAirportSchedules(airportIata, date);
  }
}

export const aviationEdgeClient = new AviationEdgeClient();
