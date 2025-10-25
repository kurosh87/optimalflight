/**
 * Geodesic and Geographic Utility Functions
 * Ported from mobile app for web parity
 */

/**
 * Calculate Haversine distance between two points
 * @param point1 [longitude, latitude]
 * @param point2 [longitude, latitude]
 * @returns Distance in kilometers
 */
export function haversineDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate great circle route between two points
 * @param origin [longitude, latitude]
 * @param destination [longitude, latitude]
 * @param numPoints Number of interpolated points (default: 100)
 * @returns Array of coordinate pairs representing the route
 */
export function generateFlightRoute(
  origin: [number, number],
  destination: [number, number],
  numPoints: number = 100
): [number, number][] {
  const points: [number, number][] = [];

  // Convert to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const [lon1, lat1] = [toRad(origin[0]), toRad(origin[1])];
  const [lon2, lat2] = [toRad(destination[0]), toRad(destination[1])];

  // Calculate angular distance
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
    )
  );

  // Handle edge case where points are very close
  if (d < 0.0001) {
    return [origin, destination];
  }

  // Generate interpolated points along great circle
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;

    const a = Math.sin((1 - fraction) * d) / Math.sin(d);
    const b = Math.sin(fraction * d) / Math.sin(d);

    const x =
      a * Math.cos(lat1) * Math.cos(lon1) +
      b * Math.cos(lat2) * Math.cos(lon2);
    const y =
      a * Math.cos(lat1) * Math.sin(lon1) +
      b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);

    points.push([toDeg(lon), toDeg(lat)]);
  }

  return points;
}

/**
 * Flight route GeoJSON types
 */
export interface FlightRouteFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    flightId: string;
    isPast: boolean;
    origin: string;
    destination: string;
    airline?: string;
    flightNumber?: string;
  };
}

export interface FlightRouteGeoJSON {
  type: 'FeatureCollection';
  features: FlightRouteFeature[];
}

/**
 * Airport marker GeoJSON types
 */
export interface AirportMarkerFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    code: string;
    name: string;
    city: string;
    timezone?: string;
  };
}

export interface AirportMarkersGeoJSON {
  type: 'FeatureCollection';
  features: AirportMarkerFeature[];
}

/**
 * Flight data for route generation
 */
export interface FlightRouteData {
  id: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  originCode: string;
  destinationCode: string;
  isPast: boolean;
  airline?: string;
  flightNumber?: string;
}

/**
 * Airport coordinate data
 */
export interface AirportCoordinates {
  code: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * Create GeoJSON FeatureCollection for flight routes
 * @param flights Array of flight route data
 * @returns GeoJSON FeatureCollection with LineString features
 */
export function createFlightRoutesGeoJSON(
  flights: FlightRouteData[]
): FlightRouteGeoJSON {
  return {
    type: 'FeatureCollection',
    features: flights.map((flight) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateFlightRoute(
          flight.originCoords,
          flight.destinationCoords
        ),
      },
      properties: {
        flightId: flight.id,
        isPast: flight.isPast,
        origin: flight.originCode,
        destination: flight.destinationCode,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
      },
    })),
  };
}

/**
 * Create GeoJSON FeatureCollection for airport markers
 * @param airports Array of airport coordinate data
 * @returns GeoJSON FeatureCollection with Point features
 */
export function createAirportMarkersGeoJSON(
  airports: AirportCoordinates[]
): AirportMarkersGeoJSON {
  return {
    type: 'FeatureCollection',
    features: airports.map((airport) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [airport.longitude, airport.latitude],
      },
      properties: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        timezone: airport.timezone,
      },
    })),
  };
}

/**
 * Get unique airport codes from flights
 * @param flights Array of flights with origin and destination codes
 * @returns Array of unique airport codes
 */
export function getUniqueAirportCodes(
  flights: Array<{ originAirportCode: string; destinationAirportCode: string }>
): string[] {
  const codes = new Set<string>();
  flights.forEach((flight) => {
    codes.add(flight.originAirportCode);
    codes.add(flight.destinationAirportCode);
  });
  return Array.from(codes);
}

/**
 * Calculate midpoint between two coordinates
 * @param point1 [longitude, latitude]
 * @param point2 [longitude, latitude]
 * @returns Midpoint [longitude, latitude]
 */
export function calculateMidpoint(
  point1: [number, number],
  point2: [number, number]
): [number, number] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const [lon1, lat1] = [toRad(point1[0]), toRad(point1[1])];
  const [lon2, lat2] = [toRad(point2[0]), toRad(point2[1])];

  const bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
  const by = Math.cos(lat2) * Math.sin(lon2 - lon1);

  const midLat = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2)
  );
  const midLon = lon1 + Math.atan2(by, Math.cos(lat1) + bx);

  return [toDeg(midLon), toDeg(midLat)];
}

/**
 * Convert kilometers to nautical miles
 * @param km Distance in kilometers
 * @returns Distance in nautical miles
 */
export function kmToNauticalMiles(km: number): number {
  return km * 0.539957;
}

/**
 * Convert kilometers to statute miles
 * @param km Distance in kilometers
 * @returns Distance in statute miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Format distance with appropriate unit
 * @param km Distance in kilometers
 * @param unit Target unit ('km' | 'mi' | 'nm')
 * @returns Formatted distance string
 */
export function formatDistance(
  km: number,
  unit: 'km' | 'mi' | 'nm' = 'km'
): string {
  switch (unit) {
    case 'mi':
      return `${kmToMiles(km).toFixed(0)} mi`;
    case 'nm':
      return `${kmToNauticalMiles(km).toFixed(0)} nm`;
    default:
      return `${km.toFixed(0)} km`;
  }
}

/**
 * Route frequency label data
 */
export interface RouteFrequencyLabel {
  originCode: string;
  destinationCode: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  flightCount: number;
  averageFlightsPerYear?: number;
}

/**
 * Route frequency label GeoJSON feature
 */
export interface RouteFrequencyLabelFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    origin: string;
    destination: string;
    flightCount: number;
    averagePerYear?: number;
    routeKey: string;
  };
}

/**
 * Route frequency labels GeoJSON
 */
export interface RouteFrequencyLabelsGeoJSON {
  type: 'FeatureCollection';
  features: RouteFrequencyLabelFeature[];
}

/**
 * Create GeoJSON FeatureCollection for route frequency labels
 * Places a label at the midpoint of each route showing flight count
 * @param routeFrequencies Array of route frequency data
 * @returns GeoJSON FeatureCollection with Point features
 */
export function createRouteFrequencyLabelsGeoJSON(
  routeFrequencies: RouteFrequencyLabel[]
): RouteFrequencyLabelsGeoJSON {
  return {
    type: 'FeatureCollection',
    features: routeFrequencies.map((route) => {
      const midpoint = calculateMidpoint(route.originCoords, route.destinationCoords);
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: midpoint,
        },
        properties: {
          origin: route.originCode,
          destination: route.destinationCode,
          flightCount: route.flightCount,
          averagePerYear: route.averageFlightsPerYear,
          routeKey: `${route.originCode}-${route.destinationCode}`,
        },
      };
    }),
  };
}

/**
 * Home base data with coordinates
 */
export interface HomeBaseData {
  airportCode: string;
  coordinates: [number, number];
  isPrimary: boolean;
}

/**
 * Home base pilot line (route from home base to destination)
 */
export interface PilotLine {
  homeBaseCode: string;
  homeBaseCoords: [number, number];
  destinationCode: string;
  destinationCoords: [number, number];
  flightCount: number;
  isPrimaryBase: boolean;
}

/**
 * Home base marker GeoJSON feature
 */
export interface HomeBaseMarkerFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    airportCode: string;
    isPrimary: boolean;
  };
}

/**
 * Pilot line GeoJSON feature (radiating lines from home bases)
 */
export interface PilotLineFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    homeBase: string;
    destination: string;
    flightCount: number;
    isPrimaryBase: boolean;
  };
}

/**
 * Create GeoJSON for home base markers
 * @param homeBases Array of home base data
 * @returns GeoJSON FeatureCollection with Point features
 */
export function createHomeBaseMarkersGeoJSON(
  homeBases: HomeBaseData[]
): { type: 'FeatureCollection'; features: HomeBaseMarkerFeature[] } {
  return {
    type: 'FeatureCollection',
    features: homeBases.map((base) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: base.coordinates,
      },
      properties: {
        airportCode: base.airportCode,
        isPrimary: base.isPrimary,
      },
    })),
  };
}

/**
 * Create GeoJSON for pilot lines (radiating routes from home bases)
 * @param pilotLines Array of pilot line data
 * @returns GeoJSON FeatureCollection with LineString features
 */
export function createPilotLinesGeoJSON(
  pilotLines: PilotLine[]
): { type: 'FeatureCollection'; features: PilotLineFeature[] } {
  return {
    type: 'FeatureCollection',
    features: pilotLines.map((line) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: generateFlightRoute(line.homeBaseCoords, line.destinationCoords, 50),
      },
      properties: {
        homeBase: line.homeBaseCode,
        destination: line.destinationCode,
        flightCount: line.flightCount,
        isPrimaryBase: line.isPrimaryBase,
      },
    })),
  };
}

/**
 * Country visit data with coordinates
 */
export interface CountryVisitData {
  countryId: string;
  countryName: string;
  iso2: string;
  iso3?: string;
  continent?: string;
  visitCount: number;
  latitude: number;
  longitude: number;
  firstVisitDate?: string;
  lastVisitDate?: string;
}

/**
 * Country flag marker GeoJSON feature
 */
export interface CountryFlagMarkerFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    countryId: string;
    countryName: string;
    iso2: string;
    visitCount: number;
    flagEmoji: string;
  };
}

/**
 * Country flag markers GeoJSON
 */
export interface CountryFlagMarkersGeoJSON {
  type: 'FeatureCollection';
  features: CountryFlagMarkerFeature[];
}

/**
 * Convert ISO2 country code to flag emoji
 * @param iso2 Two-letter country code (e.g., 'US', 'GB', 'JP')
 * @returns Flag emoji string
 */
export function countryCodeToFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🏳️';

  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * Create GeoJSON FeatureCollection for country flag markers
 * Shows countries visited with flag emojis and visit counts
 * @param countryVisits Array of country visit data
 * @returns GeoJSON FeatureCollection with Point features
 */
export function createCountryFlagMarkersGeoJSON(
  countryVisits: CountryVisitData[]
): CountryFlagMarkersGeoJSON {
  return {
    type: 'FeatureCollection',
    features: countryVisits.map((country) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [country.longitude, country.latitude],
      },
      properties: {
        countryId: country.countryId,
        countryName: country.countryName,
        iso2: country.iso2,
        visitCount: country.visitCount,
        flagEmoji: countryCodeToFlagEmoji(country.iso2),
      },
    })),
  };
}
