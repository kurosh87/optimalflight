/**
 * SEO Metadata Generation for Programmatic Pages
 * FlightConnections-style title tags and meta descriptions
 */

import type { Metadata } from 'next';

/**
 * Generate metadata for airport departure pages
 * Title: "Flights from {City Name} ({IATA Code})"
 * Description: Dynamic based on destination count
 */
export function generateAirportDepartureMetadata(
  cityName: string,
  iataCode: string,
  airportName: string,
  destinationCount: number
): Metadata {
  const title = `Flights from ${cityName} (${iataCode.toUpperCase()})`;

  const description = `All direct (non-stop) flights from ${cityName} (${iataCode.toUpperCase()}) on an interactive route map with jetlag optimization. Explore planned flights to ${destinationCount} destinations, find new routes and get detailed information on airlines flying from ${airportName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate metadata for route-specific pages
 * Title: "Flights from {Origin City} to {Destination City}: {ORIGIN} to {DEST} Flights + Flight Schedule"
 */
export function generateRouteMetadata(
  originCity: string,
  originIata: string,
  destinationCity: string,
  destinationIata: string,
  flightCount: number,
  distance: { miles: number; km: number },
  duration: { hours: number; minutes: number }
): Metadata {
  const title = `Flights from ${originCity} to ${destinationCity}: ${originIata.toUpperCase()} to ${destinationIata.toUpperCase()} Flights + Flight Schedule`;

  const description = `Find the best ${originIata.toUpperCase()} to ${destinationIata.toUpperCase()} flights with jetlag optimization. ${flightCount} flights per month, ${distance.miles} miles (${distance.km} km), approximately ${duration.hours}h ${duration.minutes}m flight time. Compare airlines, aircraft, and arrival times for minimal jetlag.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate metadata for airline route map pages
 * Title: "{Airline Name} Route Map: {X} destinations worldwide"
 */
export function generateAirlineRouteMapMetadata(
  airlineName: string,
  iataCode: string,
  destinationCount: number,
  alliance?: string
): Metadata {
  const title = `${airlineName} Route Map: ${destinationCount} destinations worldwide`;

  const allianceText = alliance ? ` Part of ${alliance} alliance network.` : '';
  const description = `Interactive ${airlineName} (${iataCode.toUpperCase()}) route map showing all ${destinationCount} destinations.${allianceText} Find flights with jetlag optimization, aircraft types, and connection times.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate metadata for alliance pages
 * Title: "{Alliance Name} Route Map and Network"
 */
export function generateAllianceMetadata(
  allianceName: string,
  memberCount: number,
  destinationCount: number
): Metadata {
  const title = `${allianceName} Route Map and Network`;

  const description = `Explore the ${allianceName} alliance network with ${memberCount} member airlines flying to ${destinationCount}+ destinations worldwide. Interactive route map with jetlag optimization for alliance travel planning.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate structured data for route pages
 * Schema.org FlightRoute
 */
export function generateRouteStructuredData(
  originAirport: { name: string; iataCode: string },
  destinationAirport: { name: string; iataCode: string },
  distance: { miles: number; km: number }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FlightRoute',
    departureAirport: {
      '@type': 'Airport',
      name: originAirport.name,
      iataCode: originAirport.iataCode,
    },
    arrivalAirport: {
      '@type': 'Airport',
      name: destinationAirport.name,
      iataCode: destinationAirport.iataCode,
    },
    distance: {
      '@type': 'Distance',
      value: distance.miles.toString(),
      unitCode: 'SMI', // Statute miles
    },
  };
}

/**
 * Generate FAQ structured data for route pages
 */
export function generateRouteFAQStructuredData(
  originIata: string,
  destinationIata: string,
  originCity: string,
  destinationCity: string,
  flightCount: number,
  airlines: string[]
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many flights from ${originIata} to ${destinationIata} per day?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are an average of ${Math.round(flightCount / 30)} flights per day from ${originCity} ${originIata} to ${destinationCity} ${destinationIata} operated by ${airlines.join(', ')}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What airlines fly from ${originIata} to ${destinationIata}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Airlines operating ${originIata} to ${destinationIata} include: ${airlines.join(', ')}. FlightOptima shows jetlag scores for each airline's flights.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which flight from ${originIata} to ${destinationIata} has the lowest jetlag?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `FlightOptima ranks all ${originIata} to ${destinationIata} flights by jetlag impact. Morning arrivals typically have 30-40% less jetlag. Use our jetlag score filter to find the healthiest flight options.`,
        },
      },
    ],
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `https://optimalflight.com${crumb.url}`,
    })),
  };
}

/**
 * Calculate total pages that can be generated
 */
export function calculateTotalPages(
  airportCount: number,
  routeCount: number,
  airlineCount: number,
  allianceCount: number = 3
): number {
  const airportPages = airportCount;
  const routePages = routeCount * 2; // Bidirectional
  const airlinePages = airlineCount;
  const alliancePages = allianceCount;

  return airportPages + routePages + airlinePages + alliancePages;
}

/**
 * Example usage for page generation estimates
 */
export const PAGE_ESTIMATES = {
  airports: 10000, // Airports with >0 destinations
  routes: 75000, // Active routes
  airlines: 300, // Active airlines
  alliances: 3,
  total: calculateTotalPages(10000, 75000, 300, 3), // ~160,000 pages
};
