/**
 * Airport data for jet lag tracking
 */

export interface Airport {
  code: string; // IATA code
  icao?: string; // ICAO code
  name: string;
  city: string;
  cityId?: string; // For linking to city pages
  country: string;
  countryIso2?: string; // For linking to country pages
  timezone: string;
  latitude: number;
  longitude: number;
  elevation: number; // in meters
  description?: string;
  terminals?: number;
  runways?: number;
}

export const AIRPORTS: Airport[] = [
  {
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    country: "United States",
    timezone: "America/New_York",
    latitude: 40.6413,
    longitude: -73.7781,
    elevation: 4,
    description: "Major international gateway serving the New York metropolitan area. One of the busiest airports in the United States.",
    terminals: 6,
    runways: 4,
  },
  {
    code: "LHR",
    name: "London Heathrow Airport",
    city: "London",
    country: "United Kingdom",
    timezone: "Europe/London",
    latitude: 51.4700,
    longitude: -0.4543,
    elevation: 25,
    description: "The busiest airport in Europe and primary hub for British Airways. Located west of Central London.",
    terminals: 4,
    runways: 2,
  },
  {
    code: "NRT",
    name: "Narita International Airport",
    city: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    latitude: 35.7720,
    longitude: 140.3929,
    elevation: 43,
    description: "Main international airport serving Tokyo, located in Narita, Chiba. Major hub for international travelers to Japan.",
    terminals: 3,
    runways: 2,
  },
  {
    code: "SYD",
    name: "Sydney Kingsford Smith Airport",
    city: "Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
    latitude: -33.9399,
    longitude: 151.1753,
    elevation: 6,
    description: "Australia's busiest airport, located in the Sydney suburb of Mascot. Named after pioneering Australian aviator Charles Kingsford Smith.",
    terminals: 3,
    runways: 3,
  },
  {
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "United States",
    timezone: "America/Los_Angeles",
    latitude: 33.9416,
    longitude: -118.4085,
    elevation: 38,
    description: "Primary international airport serving Los Angeles and the greater Southern California region. Third-busiest airport in the world by passenger traffic.",
    terminals: 9,
    runways: 4,
  },
  {
    code: "DXB",
    name: "Dubai International Airport",
    city: "Dubai",
    country: "United Arab Emirates",
    timezone: "Asia/Dubai",
    latitude: 25.2532,
    longitude: 55.3657,
    elevation: 19,
    description: "World's busiest airport by international passenger traffic and home to Emirates airline. Major connecting hub between continents.",
    terminals: 3,
    runways: 2,
  },
  {
    code: "SIN",
    name: "Singapore Changi Airport",
    city: "Singapore",
    country: "Singapore",
    timezone: "Asia/Singapore",
    latitude: 1.3644,
    longitude: 103.9915,
    elevation: 7,
    description: "Consistently rated as one of the world's best airports. Features the famous Jewel with indoor waterfall and extensive gardens.",
    terminals: 4,
    runways: 2,
  },
  {
    code: "CDG",
    name: "Paris Charles de Gaulle Airport",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    latitude: 49.0097,
    longitude: 2.5479,
    elevation: 119,
    description: "Largest international airport in France and second-busiest in Europe. Named after French leader Charles de Gaulle.",
    terminals: 3,
    runways: 4,
  },
  {
    code: "HND",
    name: "Tokyo Haneda Airport",
    city: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    latitude: 35.5494,
    longitude: 139.7798,
    elevation: 11,
    description: "One of two primary airports serving Tokyo. Closer to downtown Tokyo than Narita, handling primarily domestic flights with growing international service.",
    terminals: 3,
    runways: 4,
  },
  {
    code: "FRA",
    name: "Frankfurt Airport",
    city: "Frankfurt",
    country: "Germany",
    timezone: "Europe/Berlin",
    latitude: 50.0379,
    longitude: 8.5622,
    elevation: 111,
    description: "Busiest airport in Germany and major European hub. Home base for Lufthansa and a key cargo center.",
    terminals: 2,
    runways: 4,
  },
  {
    code: "ORD",
    name: "O'Hare International Airport",
    city: "Chicago",
    country: "United States",
    timezone: "America/Chicago",
    latitude: 41.9742,
    longitude: -87.9073,
    elevation: 205,
    description: "Major hub for United Airlines and American Airlines. One of the world's busiest airports by aircraft movements.",
    terminals: 4,
    runways: 8,
  },
  {
    code: "ICN",
    name: "Incheon International Airport",
    city: "Seoul",
    country: "South Korea",
    timezone: "Asia/Seoul",
    latitude: 37.4602,
    longitude: 126.4407,
    elevation: 7,
    description: "South Korea's largest airport and a major hub for East Asian travel. Consistently rated among the world's best airports.",
    terminals: 2,
    runways: 4,
  },
];

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find((airport) => airport.code.toLowerCase() === code.toLowerCase());
}

export function searchAirports(query: string): Airport[] {
  const q = query.toLowerCase();
  return AIRPORTS.filter(
    (airport) =>
      airport.code.toLowerCase().includes(q) ||
      airport.name.toLowerCase().includes(q) ||
      airport.city.toLowerCase().includes(q) ||
      airport.country.toLowerCase().includes(q)
  );
}
