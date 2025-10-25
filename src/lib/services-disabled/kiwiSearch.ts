/**
 * Kiwi Tequila API Service - Multi-Product Implementation
 *
 * Kiwi.com has 3 SEPARATE API products, each with its own API key:
 * 1. Standard Search (/search) → KIWI_API_KEY (jetlag)
 * 2. Multi-City Search (/flights_multi) → KIWI_MULTI_API_KEY (jetlagmulti)
 * 3. Nomad Search (/nomad) → KIWI_NOMAD_API_KEY (jetlagnomad)
 */

interface KiwiApiKeys {
  standard: string;  // For /v2/search
  multiCity: string; // For /v2/flights_multi
  nomad: string;     // For /v2/nomad
}

export interface KiwiSearchParams {
  // Origin/Destination
  fly_from: string;
  fly_to: string;

  // Dates (DD/MM/YYYY format required by Kiwi)
  date_from: string;
  date_to: string;
  return_from?: string;
  return_to?: string;

  // Trip type
  flight_type?: 'round' | 'oneway';

  // Passengers
  adults?: number;

  // Preferences
  max_stopovers?: number;
  max_fly_duration?: number;

  // Filters
  curr?: string;
  locale?: string;
  sort?: 'quality' | 'price' | 'duration' | 'date';
  limit?: number;
}

export interface KiwiBaglimit {
  hand_height?: number;
  hand_length?: number;
  hand_weight?: number;
  hand_width?: number;
  hold_height?: number;
  hold_length?: number;
  hold_weight?: number;
  hold_width?: number;
  hold_dimensions_sum?: number;
}

export interface KiwiBagsPrice {
  hand?: number;  // Cabin bag price
  '1'?: number;   // First checked bag
  '2'?: number;   // Second checked bag
}

export interface KiwiConversion {
  [currency: string]: number;
}

export interface KiwiRoute {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  airline: string;
  flight_no: number;
  operating_carrier: string;
  equipment: string | null;
  local_departure: string;
  utc_departure: string;
  local_arrival: string;
  utc_arrival: string;
  return: number;

  // Virtual interlining & travel hacks
  bags_recheck_required?: boolean;
  vi_connection?: boolean;
  guarantee?: boolean;
}

export interface KiwiSearchResult {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;

  // Timing
  local_departure: string;
  utc_departure: string;
  local_arrival: string;
  utc_arrival: string;

  // Route segments
  route: KiwiRoute[];

  // Pricing
  price: number;  // In EUR by default
  conversion?: KiwiConversion;  // Price in other currencies
  bags_price?: KiwiBagsPrice;   // Baggage prices in EUR

  // Baggage limits
  baglimit?: KiwiBaglimit;

  // Quality
  quality: number;

  // Duration (seconds)
  duration: {
    departure: number;
    return: number;
    total: number;
  };

  // Booking
  booking_token: string;  // Required for booking API
  deep_link: string;

  // Availability
  availability: {
    seats: number;
  };

  // Virtual Interlining & Travel Hacks
  virtual_interlining?: boolean;        // Entire itinerary is virtually interlined
  throw_away_ticketing?: boolean;       // Contains hidden segments (Travel Hack)
  hidden_city_ticketing?: boolean;      // Contains hidden city segments (Travel Hack)
  facilitated_booking_available?: boolean;
}

export interface KiwiSearchResponse {
  search_id: string;
  currency: string;
  data: KiwiSearchResult[];
  _results: number;
  search_params: any;
}

export interface KiwiMultiCityLeg {
  fly_from: string;
  fly_to: string;
  date_from: string;
  date_to: string;
}

export interface KiwiNomadViaStop {
  locations: string[];  // Array of IATA codes
  nights_range?: [number, number];  // [from, to] nights to spend
  date_range?: [string, string];    // [from_date, to_date] in DD/MM/YYYY
}

export interface KiwiNomadParams {
  fly_from: string;  // Origin IATA code
  fly_to: string;    // Return destination IATA code
  date_from: string; // Departure date DD/MM/YYYY
  date_to: string;   // Departure date range DD/MM/YYYY
  via: KiwiNomadViaStop[];  // Stops to visit
  return_from?: string;
  return_to?: string;
  nights_on_trip_from?: number;
  nights_on_trip_to?: number;
  adults?: number;
  max_stopovers?: number;
  curr?: string;
  locale?: string;
  limit?: number;
}

export interface KiwiLocation {
  id: string;
  name: string;
  code: string;
  type: 'airport' | 'city' | 'country';
  lat: number;
  lon: number;
  timezone: string;
  city?: { id: string; name: string; code: string };
  country?: { id: string; name: string; code: string };
}

export class KiwiTequilaService {
  private baseUrl = 'https://api.tequila.kiwi.com';
  private apiKeys: KiwiApiKeys;

  constructor(apiKeys: KiwiApiKeys) {
    if (!apiKeys.standard || !apiKeys.multiCity || !apiKeys.nomad) {
      throw new Error('All 3 Kiwi API keys are required (standard, multiCity, nomad)');
    }
    this.apiKeys = apiKeys;
  }

  /**
   * Get headers for specific API type
   */
  private getHeaders(apiType: 'standard' | 'multiCity' | 'nomad'): HeadersInit {
    const keyMap = {
      standard: this.apiKeys.standard,
      multiCity: this.apiKeys.multiCity,
      nomad: this.apiKeys.nomad,
    };

    return {
      'Content-Type': 'application/json',
      'apikey': keyMap[apiType],
    };
  }

  /**
   * 1. STANDARD SEARCH (one-way or return)
   * Endpoint: /v2/search
   * Uses: KIWI_API_KEY (jetlag)
   */
  async searchFlights(params: KiwiSearchParams): Promise<KiwiSearchResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `${this.baseUrl}/v2/search?${queryParams}`;

    console.log(`[Kiwi Standard] ${params.fly_from} → ${params.fly_to}`);

    // Add timeout protection (10 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('standard'),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kiwi standard search failed (${response.status}): ${errorText}`);
      }

      const data: KiwiSearchResponse = await response.json();
      console.log(`[Kiwi Standard] Found ${data._results} results`);

      return data;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Kiwi API request timeout after 10 seconds');
      }

      throw error;
    }
  }

  /**
   * 2. MULTI-CITY SEARCH
   * Endpoint: /v2/flights_multi
   * Uses: KIWI_MULTI_API_KEY (jetlagmulti)
   */
  async searchMultiCity(
    legs: KiwiMultiCityLeg[],
    options?: {
      adults?: number;
      curr?: string;
      locale?: string;
      max_fly_duration?: number;
    }
  ): Promise<KiwiSearchResponse> {
    const body = {
      requests: legs,
      passengers: {
        adults: options?.adults || 1,
      },
      currency: options?.curr || 'USD',
      locale: options?.locale || 'en',
      ...(options?.max_fly_duration && { max_fly_duration: options.max_fly_duration }),
    };

    console.log(`[Kiwi Multi-city] ${legs.length} legs`);

    const response = await fetch(`${this.baseUrl}/v2/flights_multi`, {
      method: 'POST',
      headers: this.getHeaders('multiCity'),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kiwi multi-city failed (${response.status}): ${errorText}`);
    }

    const data: KiwiSearchResponse = await response.json();
    console.log(`[Kiwi Multi-city] Found ${data._results} results`);

    return data;
  }

  /**
   * 3. NOMAD SEARCH (flexible multi-destination)
   * Endpoint: /v2/nomad
   * Uses: KIWI_NOMAD_API_KEY (jetlagnomad)
   *
   * Nomad finds the most efficient order to visit multiple destinations
   */
  async searchNomad(params: KiwiNomadParams): Promise<KiwiSearchResponse> {
    const { via, ...queryParams } = params;

    // Build query parameters (excluding 'via' which goes in body)
    const urlParams = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, String(value));
      }
    });

    const url = `${this.baseUrl}/v2/nomad?${urlParams}`;

    console.log(`[Kiwi Nomad] ${params.fly_from} → ${params.fly_to} via ${via?.length || 0} stops`);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('nomad'),
      body: JSON.stringify({ via }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kiwi nomad failed (${response.status}): ${errorText}`);
    }

    const data: KiwiSearchResponse = await response.json();
    console.log(`[Kiwi Nomad] Found ${data._results} itineraries`);

    return data;
  }

  /**
   * 4. LOCATION SEARCH (autocomplete)
   * Endpoint: /locations/query
   * Uses: Standard API key
   */
  async searchLocations(
    query: string,
    options?: {
      locale?: string;
      location_types?: string[];
      limit?: number;
    }
  ): Promise<{ locations: KiwiLocation[] }> {
    const queryParams = new URLSearchParams({
      term: query,
      locale: options?.locale || 'en-US',
      limit: String(options?.limit || 10),
    });

    if (options?.location_types) {
      queryParams.append('location_types', options.location_types.join(','));
    }

    const url = `${this.baseUrl}/locations/query?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders('standard'),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kiwi location search failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Helper: Convert ISO date (YYYY-MM-DD) to Kiwi format (DD/MM/YYYY)
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Helper: Parse Kiwi date (DD/MM/YYYY) to ISO (YYYY-MM-DD)
   */
  parseDate(kiwiDate: string): string {
    const [day, month, year] = kiwiDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}

// Lazy-initialized singleton instance with all 3 API keys
let kiwiServiceInstance: KiwiTequilaService | null = null;

export const kiwiService = new Proxy({} as KiwiTequilaService, {
  get(target, prop) {
    if (!kiwiServiceInstance) {
      kiwiServiceInstance = new KiwiTequilaService({
        standard: process.env.KIWI_API_KEY || '',
        multiCity: process.env.KIWI_MULTI_API_KEY || '',
        nomad: process.env.KIWI_NOMAD_API_KEY || '',
      });
    }
    return (kiwiServiceInstance as any)[prop];
  }
});
