/**
 * Airline data for flight tracking and jet lag planning
 */

export interface Airline {
  code: string; // IATA code
  name: string;
  country: string;
  slug: string;
  description: string;
  founded?: number;
  headquarters?: string;
  fleet?: number;
  destinations?: number;
  alliance?: "Star Alliance" | "SkyTeam" | "Oneworld" | null;
  hubAirports?: string[]; // IATA codes
}

export const AIRLINES: Airline[] = [
  {
    code: "AA",
    name: "American Airlines",
    country: "United States",
    slug: "american-airlines",
    description: "American Airlines is the world's largest airline by fleet size and revenue. Operating extensive domestic and international routes, AA is a founding member of the Oneworld alliance.",
    founded: 1926,
    headquarters: "Fort Worth, Texas",
    fleet: 945,
    destinations: 350,
    alliance: "Oneworld",
    hubAirports: ["DFW", "CLT", "PHX", "MIA", "ORD"],
  },
  {
    code: "BA",
    name: "British Airways",
    country: "United Kingdom",
    slug: "british-airways",
    description: "British Airways is the flag carrier of the United Kingdom. Known for its premium service and extensive global network, BA operates from its hub at London Heathrow.",
    founded: 1974,
    headquarters: "London, United Kingdom",
    fleet: 273,
    destinations: 183,
    alliance: "Oneworld",
    hubAirports: ["LHR", "LGW"],
  },
  {
    code: "UA",
    name: "United Airlines",
    country: "United States",
    slug: "united-airlines",
    description: "United Airlines is a major American airline with a comprehensive global network. As a Star Alliance member, United offers extensive connectivity across six continents.",
    founded: 1926,
    headquarters: "Chicago, Illinois",
    fleet: 843,
    destinations: 342,
    alliance: "Star Alliance",
    hubAirports: ["EWR", "ORD", "IAH", "DEN", "SFO", "LAX"],
  },
  {
    code: "DL",
    name: "Delta Air Lines",
    country: "United States",
    slug: "delta-air-lines",
    description: "Delta Air Lines is one of the major American airlines, operating an extensive domestic and international network. A founding member of SkyTeam alliance.",
    founded: 1924,
    headquarters: "Atlanta, Georgia",
    fleet: 914,
    destinations: 325,
    alliance: "SkyTeam",
    hubAirports: ["ATL", "DTW", "MSP", "SLC", "SEA"],
  },
  {
    code: "LH",
    name: "Lufthansa",
    country: "Germany",
    slug: "lufthansa",
    description: "Lufthansa is Germany's flag carrier and Europe's largest airline. Known for German efficiency and quality service, Lufthansa is a key Star Alliance member.",
    founded: 1953,
    headquarters: "Cologne, Germany",
    fleet: 710,
    destinations: 220,
    alliance: "Star Alliance",
    hubAirports: ["FRA", "MUC"],
  },
  {
    code: "AF",
    name: "Air France",
    country: "France",
    slug: "air-france",
    description: "Air France is France's flag carrier, renowned for its style and service. Operating from Paris Charles de Gaulle, AF is a founding member of SkyTeam alliance.",
    founded: 1933,
    headquarters: "Tremblay-en-France, France",
    fleet: 224,
    destinations: 175,
    alliance: "SkyTeam",
    hubAirports: ["CDG", "ORY"],
  },
  {
    code: "EK",
    name: "Emirates",
    country: "United Arab Emirates",
    slug: "emirates",
    description: "Emirates is the largest airline in the Middle East, known for luxurious service and its hub-and-spoke model through Dubai. Operates the world's largest fleet of Airbus A380s.",
    founded: 1985,
    headquarters: "Dubai, United Arab Emirates",
    fleet: 252,
    destinations: 157,
    alliance: null,
    hubAirports: ["DXB"],
  },
  {
    code: "SQ",
    name: "Singapore Airlines",
    country: "Singapore",
    slug: "singapore-airlines",
    description: "Singapore Airlines is consistently ranked among the world's best airlines, known for exceptional service and innovation. Operates from Singapore Changi as its hub.",
    founded: 1947,
    headquarters: "Singapore",
    fleet: 157,
    destinations: 137,
    alliance: "Star Alliance",
    hubAirports: ["SIN"],
  },
  {
    code: "QF",
    name: "Qantas",
    country: "Australia",
    slug: "qantas",
    description: "Qantas is Australia's flag carrier and the country's largest airline. With a strong focus on long-haul international flights, Qantas is known for safety and reliability.",
    founded: 1920,
    headquarters: "Sydney, Australia",
    fleet: 131,
    destinations: 85,
    alliance: "Oneworld",
    hubAirports: ["SYD", "MEL"],
  },
  {
    code: "NH",
    name: "All Nippon Airways",
    country: "Japan",
    slug: "all-nippon-airways",
    description: "All Nippon Airways (ANA) is Japan's largest airline, known for exceptional service and modern fleet. ANA has won numerous awards for passenger satisfaction.",
    founded: 1952,
    headquarters: "Tokyo, Japan",
    fleet: 223,
    destinations: 146,
    alliance: "Star Alliance",
    hubAirports: ["NRT", "HND"],
  },
  {
    code: "CX",
    name: "Cathay Pacific",
    country: "Hong Kong",
    slug: "cathay-pacific",
    description: "Cathay Pacific is Hong Kong's flag carrier, offering premium service across Asia and beyond. Known for its excellent business class and extensive Asian network.",
    founded: 1946,
    headquarters: "Hong Kong",
    fleet: 166,
    destinations: 119,
    alliance: "Oneworld",
    hubAirports: ["HKG"],
  },
  {
    code: "TK",
    name: "Turkish Airlines",
    country: "Turkey",
    slug: "turkish-airlines",
    description: "Turkish Airlines flies to more countries than any other airline, leveraging Istanbul's strategic geographic position. Known for traditional hospitality and modern fleet.",
    founded: 1933,
    headquarters: "Istanbul, Turkey",
    fleet: 376,
    destinations: 315,
    alliance: "Star Alliance",
    hubAirports: ["IST"],
  },
];

/**
 * Get airline by code
 */
export function getAirlineByCode(code: string): Airline | undefined {
  return AIRLINES.find((airline) => airline.code.toLowerCase() === code.toLowerCase());
}

/**
 * Get airline by slug
 */
export function getAirlineBySlug(slug: string): Airline | undefined {
  return AIRLINES.find((airline) => airline.slug === slug);
}

/**
 * Get airlines by alliance
 */
export function getAirlinesByAlliance(alliance: string): Airline[] {
  return AIRLINES.filter((airline) => airline.alliance === alliance);
}

/**
 * Get airlines by country
 */
export function getAirlinesByCountry(country: string): Airline[] {
  return AIRLINES.filter((airline) => airline.country === country);
}
