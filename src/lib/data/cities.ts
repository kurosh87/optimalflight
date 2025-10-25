/**
 * City data for jet lag and travel information
 */

export interface City {
  slug: string;
  name: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  description: string;
  population?: number;
  attractions?: string[];
  jetlagTips?: string[];
  bestTimeToVisit?: string;
  airports: string[]; // IATA codes
}

export const CITIES: City[] = [
  {
    slug: "new-york",
    name: "New York",
    country: "United States",
    timezone: "America/New_York",
    latitude: 40.7128,
    longitude: -74.0060,
    description: "The city that never sleeps, New York is a global hub for business, culture, and entertainment. With iconic landmarks like the Statue of Liberty, Times Square, and Central Park, NYC attracts millions of travelers annually.",
    population: 8336000,
    attractions: ["Statue of Liberty", "Times Square", "Central Park", "Empire State Building", "Brooklyn Bridge"],
    jetlagTips: [
      "Adjust to Eastern Time Zone (UTC-5/-4)",
      "Get sunlight exposure in the morning for eastward travelers",
      "Stay awake until local bedtime on arrival day",
      "Hydrate well during your flight"
    ],
    bestTimeToVisit: "April to June, September to November",
    airports: ["JFK", "LGA", "EWR"]
  },
  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    timezone: "Europe/London",
    latitude: 51.5074,
    longitude: -0.1278,
    description: "A historic and modern metropolis, London combines centuries of history with cutting-edge culture. From Buckingham Palace to the London Eye, the city offers endless attractions for travelers.",
    population: 8982000,
    attractions: ["Big Ben", "Tower of London", "British Museum", "Buckingham Palace", "London Eye"],
    jetlagTips: [
      "Adjust to Greenwich Mean Time (UTC+0/+1)",
      "For westward travel from Americas, stay awake during the day",
      "Melatonin can help regulate sleep patterns",
      "Avoid heavy meals late in the evening"
    ],
    bestTimeToVisit: "March to May, September to November",
    airports: ["LHR", "LGW", "STN", "LTN"]
  },
  {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    description: "A fascinating blend of ancient tradition and futuristic innovation, Tokyo is one of the world's most dynamic cities. Experience everything from serene temples to bustling tech districts.",
    population: 13960000,
    attractions: ["Senso-ji Temple", "Tokyo Skytree", "Shibuya Crossing", "Meiji Shrine", "Tsukiji Market"],
    jetlagTips: [
      "Adjust to Japan Standard Time (UTC+9)",
      "Large time difference from Americas and Europe requires gradual adjustment",
      "Get sunlight exposure early in the day",
      "Consider arriving in the evening to immediately sync with local sleep schedule"
    ],
    bestTimeToVisit: "March to May, September to November",
    airports: ["NRT", "HND"]
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    timezone: "Asia/Dubai",
    latitude: 25.2048,
    longitude: 55.2708,
    description: "A desert oasis transformed into a global luxury destination, Dubai features world-class shopping, stunning architecture like the Burj Khalifa, and pristine beaches.",
    population: 3400000,
    attractions: ["Burj Khalifa", "Dubai Mall", "Palm Jumeirah", "Dubai Marina", "Gold Souk"],
    jetlagTips: [
      "Adjust to Gulf Standard Time (UTC+4)",
      "Stay hydrated in the desert climate",
      "Moderate time difference from Europe makes adjustment easier",
      "Avoid outdoor activities during peak heat hours"
    ],
    bestTimeToVisit: "November to March",
    airports: ["DXB", "DWC"]
  },
  {
    slug: "singapore",
    name: "Singapore",
    country: "Singapore",
    timezone: "Asia/Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    description: "A vibrant city-state known for its cleanliness, efficiency, and multicultural atmosphere. Singapore blends modern architecture with lush gardens and diverse culinary scenes.",
    population: 5850000,
    attractions: ["Marina Bay Sands", "Gardens by the Bay", "Sentosa Island", "Chinatown", "Little India"],
    jetlagTips: [
      "Adjust to Singapore Time (UTC+8)",
      "Equatorial location means consistent daylight hours year-round",
      "Humid climate requires extra hydration",
      "Take advantage of 24-hour dining to adjust meal times"
    ],
    bestTimeToVisit: "February to April",
    airports: ["SIN"]
  },
  {
    slug: "sydney",
    name: "Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
    description: "Australia's largest city, Sydney is famous for its stunning harbor, iconic Opera House, and beautiful beaches. The city offers a perfect blend of urban sophistication and outdoor lifestyle.",
    population: 5312000,
    attractions: ["Sydney Opera House", "Harbour Bridge", "Bondi Beach", "Royal Botanic Garden", "Darling Harbour"],
    jetlagTips: [
      "Adjust to Australian Eastern Time (UTC+10/+11)",
      "Major time difference from most countries requires several days to adjust",
      "Take advantage of outdoor activities to get sunlight exposure",
      "Split long flights with stopovers if possible"
    ],
    bestTimeToVisit: "September to November, March to May",
    airports: ["SYD"]
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    country: "United States",
    timezone: "America/Los_Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
    description: "The entertainment capital of the world, Los Angeles offers sunshine, beaches, and Hollywood glamour. From Santa Monica to Beverly Hills, LA embodies the California dream.",
    population: 3979000,
    attractions: ["Hollywood Sign", "Santa Monica Pier", "Getty Center", "Griffith Observatory", "Venice Beach"],
    jetlagTips: [
      "Adjust to Pacific Time Zone (UTC-8/-7)",
      "Year-round sunshine helps with circadian rhythm adjustment",
      "For eastward travelers, avoid afternoon naps",
      "Beach activities provide excellent light exposure"
    ],
    bestTimeToVisit: "March to May, September to November",
    airports: ["LAX", "BUR", "SNA"]
  },
  {
    slug: "paris",
    name: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    description: "The City of Light captivates visitors with its art, architecture, and culinary excellence. From the Eiffel Tower to the Louvre, Paris remains one of the world's most romantic destinations.",
    population: 2161000,
    attractions: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Arc de Triomphe", "Sacré-Cœur"],
    jetlagTips: [
      "Adjust to Central European Time (UTC+1/+2)",
      "Walking tours help combat jet lag through light exposure",
      "Café culture allows flexible meal timing during adjustment",
      "Evening light in summer can aid westward travelers"
    ],
    bestTimeToVisit: "April to June, September to October",
    airports: ["CDG", "ORY"]
  },
  {
    slug: "hong-kong",
    name: "Hong Kong",
    country: "Hong Kong SAR",
    timezone: "Asia/Hong_Kong",
    latitude: 22.3193,
    longitude: 114.1694,
    description: "A dynamic fusion of East and West, Hong Kong is a vertical city with a spectacular skyline, world-class dining, and bustling markets alongside tranquil temples.",
    population: 7482000,
    attractions: ["Victoria Peak", "Tsim Sha Tsui", "Temple Street Night Market", "Lantau Island", "Star Ferry"],
    jetlagTips: [
      "Adjust to Hong Kong Time (UTC+8)",
      "Compact city layout makes it easy to stay active and adjust",
      "Dim sum breakfast can help reset your eating schedule",
      "Harbor views and outdoor escalators provide sunlight exposure"
    ],
    bestTimeToVisit: "October to December",
    airports: ["HKG"]
  },
  {
    slug: "frankfurt",
    name: "Frankfurt",
    country: "Germany",
    timezone: "Europe/Berlin",
    latitude: 50.1109,
    longitude: 8.6821,
    description: "Germany's financial hub combines modern skyscrapers with historic charm. As a major European transport hub, Frankfurt offers excellent museums, green spaces, and traditional German culture.",
    population: 753000,
    attractions: ["Römerberg", "Main Tower", "Städel Museum", "Palmengarten", "Frankfurt Cathedral"],
    jetlagTips: [
      "Adjust to Central European Time (UTC+1/+2)",
      "Major aviation hub makes it ideal for breaking up long journeys",
      "Walking along the Main River provides natural light exposure",
      "German meal schedules help establish routine"
    ],
    bestTimeToVisit: "April to October",
    airports: ["FRA"]
  },
  {
    slug: "san-francisco",
    name: "San Francisco",
    country: "United States",
    timezone: "America/Los_Angeles",
    latitude: 37.7749,
    longitude: -122.4194,
    description: "Known for the Golden Gate Bridge, cable cars, and vibrant tech culture, San Francisco offers stunning bay views, diverse neighborhoods, and innovative cuisine.",
    population: 873000,
    attractions: ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf", "Painted Ladies", "Chinatown"],
    jetlagTips: [
      "Adjust to Pacific Time Zone (UTC-8/-7)",
      "Mild climate year-round aids adjustment",
      "Outdoor activities like hiking help reset circadian rhythm",
      "Fog can reduce light exposure - seek sunny spots"
    ],
    bestTimeToVisit: "September to November",
    airports: ["SFO", "OAK", "SJC"]
  }
];

/**
 * Get city by slug
 */
export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find(city => city.slug === slug);
}

/**
 * Get cities by country
 */
export function getCitiesByCountry(country: string): City[] {
  return CITIES.filter(city => city.country === country);
}

/**
 * Get all unique countries
 */
export function getAllCountries(): string[] {
  return Array.from(new Set(CITIES.map(city => city.country)));
}
