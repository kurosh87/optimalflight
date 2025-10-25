/**
 * Sample flights for testing and demonstration
 */

export interface SampleFlight {
  flightNumber: string;
  airline: string;
  originAirportCode: string;
  originCity: string;
  originTimezone: string;
  destinationAirportCode: string;
  destinationCity: string;
  destinationTimezone: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // in minutes
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  adaptabilityLevel?: 'low' | 'medium' | 'high';
}

/**
 * Generate sample flights based on current date
 */
export function generateSampleFlights(): SampleFlight[] {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return [
    // Single long-haul eastward flight (JFK to LHR)
    {
      flightNumber: "BA112",
      airline: "British Airways",
      originAirportCode: "JFK",
      originCity: "New York",
      originTimezone: "America/New_York",
      destinationAirportCode: "LHR",
      destinationCity: "London",
      destinationTimezone: "Europe/London",
      departureTime: new Date(tomorrow.setHours(22, 0, 0, 0)),
      arrivalTime: new Date(tomorrow.setHours(10, 0, 0, 0) + 24 * 60 * 60 * 1000), // Next day 10 AM
      duration: 420, // 7 hours
      sleepQuality: 'good',
      adaptabilityLevel: 'medium',
    },

    // Multi-leg trip: NYC → Tokyo → Sydney (Around the world)
    {
      flightNumber: "UA79",
      airline: "United Airlines",
      originAirportCode: "JFK",
      originCity: "New York",
      originTimezone: "America/New_York",
      destinationAirportCode: "NRT",
      destinationCity: "Tokyo",
      destinationTimezone: "Asia/Tokyo",
      departureTime: new Date(nextWeek.setHours(13, 30, 0, 0)),
      arrivalTime: new Date(nextWeek.setHours(16, 45, 0, 0) + 24 * 60 * 60 * 1000),
      duration: 825, // 13h 45min
      sleepQuality: 'fair',
      adaptabilityLevel: 'medium',
    },

    // Second leg: Tokyo to Sydney
    {
      flightNumber: "NH879",
      airline: "ANA",
      originAirportCode: "NRT",
      originCity: "Tokyo",
      originTimezone: "Asia/Tokyo",
      destinationAirportCode: "SYD",
      destinationCity: "Sydney",
      destinationTimezone: "Australia/Sydney",
      departureTime: new Date(nextWeek.setHours(20, 0, 0, 0) + 2 * 24 * 60 * 60 * 1000),
      arrivalTime: new Date(nextWeek.setHours(6, 30, 0, 0) + 3 * 24 * 60 * 60 * 1000),
      duration: 570, // 9h 30min
      sleepQuality: 'good',
      adaptabilityLevel: 'high',
    },

    // Westward long-haul: London to LA
    {
      flightNumber: "AA135",
      airline: "American Airlines",
      originAirportCode: "LHR",
      originCity: "London",
      originTimezone: "Europe/London",
      destinationAirportCode: "LAX",
      destinationCity: "Los Angeles",
      destinationTimezone: "America/Los_Angeles",
      departureTime: new Date(twoWeeks.setHours(11, 0, 0, 0)),
      arrivalTime: new Date(twoWeeks.setHours(14, 30, 0, 0)),
      duration: 630, // 10h 30min
      sleepQuality: 'excellent',
      adaptabilityLevel: 'high',
    },

    // Short haul: Dubai to Singapore
    {
      flightNumber: "EK354",
      airline: "Emirates",
      originAirportCode: "DXB",
      originCity: "Dubai",
      originTimezone: "Asia/Dubai",
      destinationAirportCode: "SIN",
      destinationCity: "Singapore",
      destinationTimezone: "Asia/Singapore",
      departureTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 days from now
      arrivalTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      duration: 420, // 7 hours
      sleepQuality: 'good',
      adaptabilityLevel: 'medium',
    },
  ];
}

/**
 * Sample itinerary: Multi-city business trip
 */
export function getSampleItinerary1(): SampleFlight[] {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 2); // Start in 2 days

  return [
    // Leg 1: New York to Frankfurt
    {
      flightNumber: "LH400",
      airline: "Lufthansa",
      originAirportCode: "JFK",
      originCity: "New York",
      originTimezone: "America/New_York",
      destinationAirportCode: "FRA",
      destinationCity: "Frankfurt",
      destinationTimezone: "Europe/Berlin",
      departureTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 19, 0, 0),
      arrivalTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 8, 30, 0),
      duration: 450,
      sleepQuality: 'fair',
      adaptabilityLevel: 'medium',
    },
    // Leg 2: Frankfurt to Dubai (after 4 days)
    {
      flightNumber: "EK44",
      airline: "Emirates",
      originAirportCode: "FRA",
      originCity: "Frankfurt",
      originTimezone: "Europe/Berlin",
      destinationAirportCode: "DXB",
      destinationCity: "Dubai",
      destinationTimezone: "Asia/Dubai",
      departureTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 4, 14, 15, 0),
      arrivalTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 4, 22, 45, 0),
      duration: 330,
      sleepQuality: 'good',
      adaptabilityLevel: 'medium',
    },
    // Leg 3: Dubai to Singapore (after 3 more days)
    {
      flightNumber: "SQ494",
      airline: "Singapore Airlines",
      originAirportCode: "DXB",
      originCity: "Dubai",
      originTimezone: "Asia/Dubai",
      destinationAirportCode: "SIN",
      destinationCity: "Singapore",
      destinationTimezone: "Asia/Singapore",
      departureTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7, 8, 30, 0),
      arrivalTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7, 20, 0, 0),
      duration: 450,
      sleepQuality: 'excellent',
      adaptabilityLevel: 'high',
    },
  ];
}

/**
 * Sample itinerary: Vacation trip
 */
export function getSampleItinerary2(): SampleFlight[] {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 10); // Start in 10 days

  return [
    // Outbound: LA to Tokyo
    {
      flightNumber: "JL62",
      airline: "Japan Airlines",
      originAirportCode: "LAX",
      originCity: "Los Angeles",
      originTimezone: "America/Los_Angeles",
      destinationAirportCode: "HND",
      destinationCity: "Tokyo",
      destinationTimezone: "Asia/Tokyo",
      departureTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 11, 0, 0),
      arrivalTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 14, 30, 0),
      duration: 690,
      sleepQuality: 'good',
      adaptabilityLevel: 'medium',
    },
    // Return: Tokyo to LA (after 14 days)
    {
      flightNumber: "JL61",
      airline: "Japan Airlines",
      originAirportCode: "HND",
      originCity: "Tokyo",
      originTimezone: "Asia/Tokyo",
      destinationAirportCode: "LAX",
      destinationCity: "Los Angeles",
      destinationTimezone: "America/Los_Angeles",
      departureTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 14, 17, 0, 0),
      arrivalTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 14, 10, 30, 0),
      duration: 630,
      sleepQuality: 'fair',
      adaptabilityLevel: 'medium',
    },
  ];
}
