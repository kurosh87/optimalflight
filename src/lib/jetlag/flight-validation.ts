/**
 * Flight Connection Validation System
 * Contextual validation with severity-based handling
 */

import type { FlightLeg } from './multi-leg-calculator';

export type ValidationSeverity =
  | 'BLOCK'      // Physically impossible - prevent plan generation
  | 'ERROR'      // Highly problematic - strong warning, require confirmation
  | 'WARNING'    // Unusual but possible - inform user
  | 'INFO'       // Separate trip detection - offer to split
  | 'OKAY';      // Normal connection

export interface ValidationIssue {
  severity: ValidationSeverity;
  category: 'time' | 'geography' | 'logistics' | 'separation';
  message: string;
  suggestion: string;
  affectedFlights: [FlightLeg, FlightLeg];
  gapHours: number;
}

export interface EdgeCaseDetection {
  type: 'positioning' | 'mileage_run' | 'multi_city' | 'open_jaw' | 'normal';
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  recommendation: string;
}

export interface FlightValidationResult {
  overallValidity: 'valid' | 'needs_confirmation' | 'invalid';
  edgeCase: EdgeCaseDetection;
  issues: ValidationIssue[];
  recommendedAction: 'single_journey' | 'split_trips' | 'fix_errors' | 'confirm_unusual';
  suggestedGroups?: FlightLeg[][]; // For split_trips recommendation
}

// Metropolitan airport groups where inter-airport transfers are reasonable
// ~95% coverage of commercial aviation scenarios
const METRO_AIRPORT_GROUPS: Record<string, string[]> = {
  // North America
  'NYC': ['JFK', 'LGA', 'EWR'],
  'LOS_ANGELES': ['LAX', 'BUR', 'ONT', 'SNA', 'LGB'],
  'SAN_FRANCISCO': ['SFO', 'OAK', 'SJC'],
  'WASHINGTON_DC': ['IAD', 'DCA', 'BWI'],
  'CHICAGO': ['ORD', 'MDW'],
  'HOUSTON': ['IAH', 'HOU'],
  'DALLAS': ['DFW', 'DAL'],
  'SOUTH_FLORIDA': ['MIA', 'FLL', 'PBI'],
  'DETROIT': ['DTW', 'DET'],
  'TORONTO': ['YYZ', 'YTZ', 'YHM'],
  'MONTREAL': ['YUL', 'YMX'],

  // Europe
  'LONDON': ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'],
  'PARIS': ['CDG', 'ORY', 'BVA'],
  'MILAN': ['MXP', 'LIN', 'BGY'],
  'ROME': ['FCO', 'CIA'],
  'BERLIN': ['BER', 'SXF', 'TXL'],
  'STOCKHOLM': ['ARN', 'BMA', 'NYO', 'VST'],
  'OSLO': ['OSL', 'TRF', 'RYG'],
  'BRUSSELS': ['BRU', 'CRL'],
  'BARCELONA': ['BCN', 'GRO', 'REU'],
  'MOSCOW': ['SVO', 'DME', 'VKO'],
  'ISTANBUL': ['IST', 'SAW'],
  'COPENHAGEN_MALMO': ['CPH', 'MMX'],
  'BASEL_MULHOUSE': ['BSL', 'MLH', 'EAP'],

  // Asia-Pacific
  'TOKYO': ['NRT', 'HND'],
  'OSAKA': ['KIX', 'ITM'],
  'SHANGHAI': ['PVG', 'SHA'],
  'BEIJING': ['PEK', 'PKX'],
  'BANGKOK': ['BKK', 'DMK'],
  'SEOUL': ['ICN', 'GMP'],
  'TAIPEI': ['TPE', 'TSA'],
  'JAKARTA': ['CGK', 'HLP'],
  'MANILA': ['MNL', 'CRK'],
  'KUALA_LUMPUR': ['KUL', 'SZB'],
  'CHENGDU': ['CTU', 'TFU'],

  // Middle East & South Asia
  'DUBAI': ['DXB', 'DWC'],
  'TEL_AVIV': ['TLV', 'SDV'],

  // South America
  'SAO_PAULO': ['GRU', 'CGH', 'VCP'],
  'BUENOS_AIRES': ['EZE', 'AEP'],
  'RIO_DE_JANEIRO': ['GIG', 'SDU'],

  // Africa
  'JOHANNESBURG': ['JNB', 'HLA'],
};

function getMetroGroup(airportCode: string): string | null {
  for (const [metro, airports] of Object.entries(METRO_AIRPORT_GROUPS)) {
    if (airports.includes(airportCode)) return metro;
  }
  return null;
}

function areAirportsInSameMetro(code1: string, code2: string): boolean {
  const metro1 = getMetroGroup(code1);
  const metro2 = getMetroGroup(code2);
  return metro1 !== null && metro1 === metro2;
}

// Simplified distance calculation (Haversine formula)
// Airport coordinates for distance-based validation
const AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
  // North America
  'JFK': { lat: 40.6413, lon: -73.7781 },
  'LGA': { lat: 40.7769, lon: -73.8740 },
  'EWR': { lat: 40.6895, lon: -74.1745 },
  'LAX': { lat: 33.9416, lon: -118.4085 },
  'SFO': { lat: 37.6213, lon: -122.3790 },
  'OAK': { lat: 37.7213, lon: -122.2200 },
  'ORD': { lat: 41.9742, lon: -87.9073 },
  'IAD': { lat: 38.9531, lon: -77.4565 },
  'DCA': { lat: 38.8521, lon: -77.0377 },
  'YYZ': { lat: 43.6777, lon: -79.6248 },
  'YVR': { lat: 49.1939, lon: -123.1844 },

  // Europe
  'LHR': { lat: 51.4700, lon: -0.4543 },
  'LGW': { lat: 51.1537, lon: -0.1821 },
  'CDG': { lat: 49.0097, lon: 2.5479 },
  'ORY': { lat: 48.7233, lon: 2.3794 },
  'FCO': { lat: 41.8003, lon: 12.2389 },
  'AMS': { lat: 52.3105, lon: 4.7683 },
  'FRA': { lat: 50.0379, lon: 8.5622 },
  'MUC': { lat: 48.3537, lon: 11.7750 },
  'MAD': { lat: 40.4983, lon: -3.5676 },
  'BCN': { lat: 41.2974, lon: 2.0833 },
  'IST': { lat: 41.2753, lon: 28.7519 },
  'SAW': { lat: 40.8986, lon: 29.3092 },

  // Asia-Pacific
  'NRT': { lat: 35.7720, lon: 140.3929 },
  'HND': { lat: 35.5494, lon: 139.7798 },
  'ICN': { lat: 37.4602, lon: 126.4407 },
  'PVG': { lat: 31.1443, lon: 121.8083 },
  'PEK': { lat: 40.0799, lon: 116.6031 },
  'HKG': { lat: 22.3080, lon: 113.9185 },
  'SIN': { lat: 1.3644, lon: 103.9915 },
  'BKK': { lat: 13.6900, lon: 100.7501 },
  'TPE': { lat: 25.0797, lon: 121.2342 },
  'KUL': { lat: 2.7456, lon: 101.7072 },
  'SYD': { lat: -33.9399, lon: 151.1753 },
  'MEL': { lat: -37.6690, lon: 144.8410 },

  // Middle East
  'DXB': { lat: 25.2532, lon: 55.3657 },
  'DOH': { lat: 25.2731, lon: 51.6080 },
  'AUH': { lat: 24.4330, lon: 54.6511 },

  // South America
  'GRU': { lat: -23.4356, lon: -46.4731 },
  'GIG': { lat: -22.8099, lon: -43.2505 },
  'EZE': { lat: -34.8222, lon: -58.5358 },
  'SCL': { lat: -33.3930, lon: -70.7858 },

  // Africa
  'JNB': { lat: -26.1367, lon: 28.2411 },
  'CPT': { lat: -33.9715, lon: 18.6021 },
  'CAI': { lat: 30.1219, lon: 31.4056 },
};

function calculateDistance(airport1: string, airport2: string): number {
  const coords1 = AIRPORT_COORDS[airport1];
  const coords2 = AIRPORT_COORDS[airport2];

  if (!coords1 || !coords2) {
    // Fallback: assume far apart if we don't have coordinates
    return 5000;
  }

  const R = 3959; // Earth's radius in miles
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateMinimumTravelTime(distanceMiles: number): number {
  if (distanceMiles < 50) {
    return 1.5; // Urban transfer: 1.5 hours minimum
  } else if (distanceMiles < 200) {
    return 3; // Regional: 3 hours minimum
  } else if (distanceMiles < 500) {
    return 5; // Longer regional: 5 hours minimum
  } else {
    const flightHours = distanceMiles / 500; // ~500mph cruise
    return flightHours + 3; // Add 3h for airport processes
  }
}

interface ConnectionRequirements {
  minimumMinutes: number;
  typicalMinutes: number;
  reasoning: string;
}

function getMinimumConnectionTime(
  arrivalAirport: string,
  departureAirport: string
): ConnectionRequirements {
  const sameAirport = arrivalAirport === departureAirport;
  const sameMetro = areAirportsInSameMetro(arrivalAirport, departureAirport);

  if (sameAirport) {
    // International-to-international at same airport
    return {
      minimumMinutes: 60,
      typicalMinutes: 120,
      reasoning: 'Connection at same airport'
    };
  }

  if (sameMetro) {
    // Inter-airport transfer in same metro area
    return {
      minimumMinutes: 180, // 3 hours minimum for ground transfer
      typicalMinutes: 240, // 4 hours is safer
      reasoning: `Ground transfer between ${arrivalAirport} and ${departureAirport} in same metro area`
    };
  }

  // Different cities entirely
  const distance = calculateDistance(arrivalAirport, departureAirport);
  const travelTimeHours = estimateMinimumTravelTime(distance);

  return {
    minimumMinutes: Math.ceil(travelTimeHours * 60),
    typicalMinutes: Math.ceil(travelTimeHours * 60 * 1.5),
    reasoning: `${distance.toFixed(0)} miles between cities - requires ground/air transport`
  };
}

function detectEdgeCase(flights: FlightLeg[]): EdgeCaseDetection {
  if (flights.length < 2) {
    return {
      type: 'normal',
      confidence: 'high',
      explanation: 'Single flight',
      recommendation: 'Process as single-leg journey'
    };
  }

  // Positioning flight: Short domestic followed by long international
  if (flights.length === 2) {
    const [first, second] = flights;
    const firstShort = first.flightDuration < 3;
    const secondLong = second.flightDuration > 8;
    const sameLocation = first.destinationAirportCode === second.originAirportCode;

    if (firstShort && secondLong && sameLocation) {
      return {
        type: 'positioning',
        confidence: 'high',
        explanation: 'Short positioning flight to hub, followed by long-haul international',
        recommendation: 'Treat as single connected journey with intermediate layover'
      };
    }
  }

  // Multi-city vacation: Multiple long stays
  const hasMultipleLongStays = flights.filter((f, i) => {
    if (i === flights.length - 1) return false;
    const next = flights[i + 1];
    const gap = (next.departureTime.getTime() - f.arrivalTime.getTime()) / (1000 * 60 * 60);
    return gap >= 48 && gap < 336; // 2-14 days
  }).length >= 2;

  if (hasMultipleLongStays) {
    return {
      type: 'multi_city',
      confidence: 'high',
      explanation: 'Multiple destinations with multi-day stays',
      recommendation: 'Plan jetlag adaptation for each city, accounting for cumulative fatigue'
    };
  }

  // Open-jaw: Different origin and final destination with disconnected segments
  const missingSegments = flights.filter((f, i) => {
    if (i === flights.length - 1) return false;
    const next = flights[i + 1];
    return f.destinationAirportCode !== next.originAirportCode &&
           !areAirportsInSameMetro(f.destinationAirportCode, next.originAirportCode);
  });

  if (missingSegments.length > 0) {
    return {
      type: 'open_jaw',
      confidence: 'high',
      explanation: 'Flights don\'t connect - likely ground transportation between segments',
      recommendation: 'Treat as separate trips with ground travel in between'
    };
  }

  return {
    type: 'normal',
    confidence: 'high',
    explanation: 'Standard connected itinerary',
    recommendation: 'Process as single multi-leg journey'
  };
}

function detectTripGroups(flights: FlightLeg[]): FlightLeg[][] {
  // Sort flights by departure time first
  const sorted = [...flights].sort((a, b) =>
    a.departureTime.getTime() - b.departureTime.getTime()
  );

  const groups: FlightLeg[][] = [];
  let currentGroup: FlightLeg[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gapHours = (curr.departureTime.getTime() - prev.arrivalTime.getTime()) / (1000 * 60 * 60);

    const sameLocation = prev.destinationAirportCode === curr.originAirportCode;
    const sameMetro = areAirportsInSameMetro(prev.destinationAirportCode, curr.originAirportCode);

    // Connected if: same location OR same metro area, AND reasonable gap (< 48 hours)
    const isConnected = (sameLocation || sameMetro) && gapHours >= 0 && gapHours < 48;

    if (isConnected) {
      // Add to current group
      currentGroup.push(curr);
    } else {
      // NOT connected - start new group
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }

  // Add final group
  groups.push(currentGroup);

  return groups;
}

export function validateFlightConnections(flights: FlightLeg[]): FlightValidationResult {
  if (flights.length === 0) {
    return {
      overallValidity: 'invalid',
      edgeCase: { type: 'normal', confidence: 'high', explanation: 'No flights', recommendation: '' },
      issues: [],
      recommendedAction: 'fix_errors'
    };
  }

  if (flights.length === 1) {
    return {
      overallValidity: 'valid',
      edgeCase: { type: 'normal', confidence: 'high', explanation: 'Single flight', recommendation: 'Process as single-leg journey' },
      issues: [],
      recommendedAction: 'single_journey'
    };
  }

  const sorted = [...flights].sort((a, b) =>
    a.departureTime.getTime() - b.departureTime.getTime()
  );

  const issues: ValidationIssue[] = [];

  // Validate each connection
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    const gapHours = (next.departureTime.getTime() - curr.arrivalTime.getTime()) / (1000 * 60 * 60);

    // BLOCK: Time travel
    if (gapHours < 0) {
      issues.push({
        severity: 'BLOCK',
        category: 'time',
        message: `Flight ${next.flightNumber || next.originAirportCode} departs ${Math.abs(gapHours).toFixed(1)}h BEFORE flight ${curr.flightNumber || curr.destinationAirportCode} arrives`,
        suggestion: 'This is physically impossible. Check your flight dates and times.',
        affectedFlights: [curr, next],
        gapHours
      });
      continue;
    }

    const sameAirport = curr.destinationAirportCode === next.originAirportCode;
    const sameMetro = areAirportsInSameMetro(curr.destinationAirportCode, next.originAirportCode);

    // BLOCK: Impossible inter-city connection
    if (!sameAirport && !sameMetro && gapHours > 0) {
      const distance = calculateDistance(curr.destinationAirportCode, next.originAirportCode);
      const needed = estimateMinimumTravelTime(distance);

      if (gapHours < needed) {
        issues.push({
          severity: 'BLOCK',
          category: 'geography',
          message: `Only ${gapHours.toFixed(1)}h between ${curr.destinationAirportCode} and ${next.originAirportCode} (${distance.toFixed(0)} miles, need ${needed.toFixed(1)}h minimum)`,
          suggestion: 'Not enough time to travel between these airports. Missing a connecting flight?',
          affectedFlights: [curr, next],
          gapHours
        });
        continue;
      }
    }

    // ERROR: Tight connection at same airport
    if (sameAirport) {
      const mct = getMinimumConnectionTime(curr.destinationAirportCode, next.originAirportCode);

      if (gapHours < (mct.minimumMinutes / 60)) {
        issues.push({
          severity: 'ERROR',
          category: 'logistics',
          message: `Only ${(gapHours * 60).toFixed(0)} minute connection at ${curr.destinationAirportCode} - below airline MCT`,
          suggestion: 'This connection is too tight. You risk missing your flight if there are any delays.',
          affectedFlights: [curr, next],
          gapHours
        });
        continue;
      }
    }

    // ERROR: Tight metro-area transfer
    if (sameMetro && !sameAirport) {
      const mct = getMinimumConnectionTime(curr.destinationAirportCode, next.originAirportCode);

      if (gapHours < (mct.minimumMinutes / 60)) {
        issues.push({
          severity: 'ERROR',
          category: 'logistics',
          message: `Only ${gapHours.toFixed(1)}h for ground transfer from ${curr.destinationAirportCode} to ${next.originAirportCode}`,
          suggestion: 'This inter-airport connection is very tight. Consider allowing 4+ hours for ground transfer.',
          affectedFlights: [curr, next],
          gapHours
        });
        continue;
      }
    }

    // WARNING: Unusually long layover at same location
    if (sameAirport && gapHours >= 24 && gapHours < 168) {
      issues.push({
        severity: 'WARNING',
        category: 'logistics',
        message: `${Math.floor(gapHours / 24)} day layover at ${curr.destinationCity} (${curr.destinationAirportCode})`,
        suggestion: 'Very long layover detected. Is this intentional, or are there missing flights?',
        affectedFlights: [curr, next],
        gapHours
      });
    }

    // INFO: Separate trip detection (different locations)
    if (!sameAirport && !sameMetro && gapHours >= 24) {
      issues.push({
        severity: 'INFO',
        category: 'separation',
        message: `Flights don't connect: ${curr.destinationAirportCode} → ${next.originAirportCode} with ${Math.floor(gapHours / 24)} day gap`,
        suggestion: 'These appear to be separate trips. Create individual jetlag recovery plans?',
        affectedFlights: [curr, next],
        gapHours
      });
    }

    // INFO: Separate trip detection (same location, very long gap)
    if (sameAirport && gapHours >= 168) {
      issues.push({
        severity: 'INFO',
        category: 'separation',
        message: `${Math.floor(gapHours / 24)} day stay in ${curr.destinationCity} between flights`,
        suggestion: 'Long stay detected. Treat as separate outbound and return trips?',
        affectedFlights: [curr, next],
        gapHours
      });
    }
  }

  const edgeCase = detectEdgeCase(sorted);

  // Determine overall validity
  const hasBlocking = issues.some(i => i.severity === 'BLOCK');
  const hasErrors = issues.some(i => i.severity === 'ERROR');
  const hasWarnings = issues.some(i => i.severity === 'WARNING');
  const hasSeparation = issues.some(i => i.severity === 'INFO' && i.category === 'separation');

  let overallValidity: FlightValidationResult['overallValidity'];
  let recommendedAction: FlightValidationResult['recommendedAction'];
  let suggestedGroups: FlightLeg[][] | undefined;

  // PRIORITY: Check for separated trips FIRST, even if there are blocking issues
  // Disconnected flights should be split into separate journeys regardless of other validation issues
  if (hasSeparation) {
    // Separate trips detected - split them regardless of other issues
    overallValidity = 'needs_confirmation';
    recommendedAction = 'split_trips';
    suggestedGroups = detectTripGroups(sorted);
  } else if (hasBlocking) {
    overallValidity = 'invalid';
    recommendedAction = 'fix_errors';
  } else if (hasErrors) {
    overallValidity = 'needs_confirmation';
    recommendedAction = 'confirm_unusual';
  } else if (hasWarnings) {
    overallValidity = 'needs_confirmation';
    recommendedAction = 'confirm_unusual';
  } else {
    overallValidity = 'valid';
    recommendedAction = 'single_journey';
  }

  return {
    overallValidity,
    edgeCase,
    issues,
    recommendedAction,
    suggestedGroups
  };
}
