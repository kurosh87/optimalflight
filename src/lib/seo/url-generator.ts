/**
 * FlightConnections-Style URL Generation
 * Programmatic page generation for SEO
 *
 * Generates 160K-500K+ SEO-optimized pages:
 * - Airport departure pages (~10,000)
 * - Route pages bidirectional (~150,000)
 * - Airline route maps (~300)
 * - Alliance pages (~3)
 */

/**
 * Generate slug from airport/city name
 * Examples: "New York City" → "new-york-city"
 *           "São Paulo" → "sao-paulo"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Normalize unicode (São → Sao)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .trim();
}

/**
 * Airport Departure Page URL
 * Pattern: /flights-from-{city-name}-{iata-code}
 *
 * Examples:
 * - /flights-from-new-york-city-jfk
 * - /flights-from-dubai-dxb
 * - /flights-from-london-lhr
 */
export function generateAirportDepartureURL(
  cityName: string,
  iataCode: string
): string {
  const citySlug = generateSlug(cityName);
  const code = iataCode.toLowerCase();
  return `/flights-from-${citySlug}-${code}`;
}

/**
 * Route-Specific Page URL (Directional)
 * Pattern: /flights-from-{origin-code}-to-{destination-code}
 *
 * Note: Bidirectional - generates BOTH directions
 *
 * Examples:
 * - /flights-from-jfk-to-lhr
 * - /flights-from-lhr-to-jfk (separate page)
 */
export function generateRouteURL(
  originIata: string,
  destinationIata: string
): string {
  const origin = originIata.toLowerCase();
  const dest = destinationIata.toLowerCase();
  return `/flights-from-${origin}-to-${dest}`;
}

/**
 * Generate BOTH directions for a route
 */
export function generateBidirectionalRouteURLs(
  iata1: string,
  iata2: string
): [string, string] {
  return [
    generateRouteURL(iata1, iata2),
    generateRouteURL(iata2, iata1),
  ];
}

/**
 * Airline Route Map Page URL
 * Pattern: /route-map-{airline-name}-{airline-code}
 *
 * Examples:
 * - /route-map-united-airlines-ua
 * - /route-map-delta-dl
 * - /route-map-lufthansa-lh
 */
export function generateAirlineRouteMapURL(
  airlineName: string,
  iataCode: string
): string {
  const nameSlug = generateSlug(airlineName);
  const code = iataCode.toLowerCase();
  return `/route-map-${nameSlug}-${code}`;
}

/**
 * Alliance Page URL
 * Pattern: /route-map-{alliance-name}
 *
 * Examples:
 * - /route-map-star-alliance
 * - /route-map-oneworld
 * - /route-map-skyteam
 */
export function generateAllianceURL(allianceName: string): string {
  const slug = generateSlug(allianceName);
  return `/route-map-${slug}`;
}

/**
 * Regional Route Map URL
 * Pattern: /route-map-regional-{region-code}
 *
 * Examples:
 * - /route-map-regional-ys (South America)
 * - /route-map-regional-eu (Europe)
 */
export function generateRegionalRouteMapURL(regionCode: string): string {
  return `/route-map-regional-${regionCode.toLowerCase()}`;
}

/**
 * Generate all URLs for programmatic page generation
 */
export interface PageGenerationManifest {
  airportPages: Array<{
    url: string;
    iataCode: string;
    cityName: string;
    totalDestinations: number;
  }>;
  routePages: Array<{
    url: string;
    originIata: string;
    destinationIata: string;
    direction: 'outbound' | 'inbound';
  }>;
  airlinePages: Array<{
    url: string;
    iataCode: string;
    airlineName: string;
  }>;
  alliancePages: Array<{
    url: string;
    allianceName: string;
  }>;
}

/**
 * Generate complete page manifest for static site generation
 * This would generate 160K-500K+ pages for FlightOptima
 */
export async function generatePageManifest(
  airports: Array<{ iataCode: string; cityName: string; destinationCount: number }>,
  routes: Array<{ originIata: string; destinationIata: string }>,
  airlines: Array<{ iataCode: string; airlineName: string }>,
  alliances: Array<{ allianceName: string }>
): Promise<PageGenerationManifest> {
  const manifest: PageGenerationManifest = {
    airportPages: [],
    routePages: [],
    airlinePages: [],
    alliancePages: [],
  };

  // Generate airport departure pages (~10,000)
  for (const airport of airports) {
    if (airport.destinationCount > 0) {
      manifest.airportPages.push({
        url: generateAirportDepartureURL(airport.cityName, airport.iataCode),
        iataCode: airport.iataCode,
        cityName: airport.cityName,
        totalDestinations: airport.destinationCount,
      });
    }
  }

  // Generate bidirectional route pages (~150,000)
  for (const route of routes) {
    // Outbound direction
    manifest.routePages.push({
      url: generateRouteURL(route.originIata, route.destinationIata),
      originIata: route.originIata,
      destinationIata: route.destinationIata,
      direction: 'outbound',
    });

    // Inbound direction (reverse)
    manifest.routePages.push({
      url: generateRouteURL(route.destinationIata, route.originIata),
      originIata: route.destinationIata,
      destinationIata: route.originIata,
      direction: 'inbound',
    });
  }

  // Generate airline route map pages (~300)
  for (const airline of airlines) {
    manifest.airlinePages.push({
      url: generateAirlineRouteMapURL(airline.airlineName, airline.iataCode),
      iataCode: airline.iataCode,
      airlineName: airline.airlineName,
    });
  }

  // Generate alliance pages (3)
  for (const alliance of alliances) {
    manifest.alliancePages.push({
      url: generateAllianceURL(alliance.allianceName),
      allianceName: alliance.allianceName,
    });
  }

  return manifest;
}

/**
 * Parse URL parameters back to entities
 * For dynamic route handlers
 */
export function parseAirportDepartureURL(url: string): {
  cityName: string;
  iataCode: string;
} | null {
  const match = url.match(/^\/flights-from-(.+)-([a-z]{3})$/);
  if (!match) return null;

  return {
    cityName: match[1].replace(/-/g, ' '),
    iataCode: match[2].toUpperCase(),
  };
}

export function parseRouteURL(url: string): {
  originIata: string;
  destinationIata: string;
} | null {
  const match = url.match(/^\/flights-from-([a-z]{3})-to-([a-z]{3})$/);
  if (!match) return null;

  return {
    originIata: match[1].toUpperCase(),
    destinationIata: match[2].toUpperCase(),
  };
}

export function parseAirlineRouteMapURL(url: string): {
  airlineName: string;
  iataCode: string;
} | null {
  const match = url.match(/^\/route-map-(.+)-([a-z]{2,3})$/);
  if (!match) return null;

  return {
    airlineName: match[1].replace(/-/g, ' '),
    iataCode: match[2].toUpperCase(),
  };
}
