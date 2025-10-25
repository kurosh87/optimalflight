/**
 * Aircraft Characteristics Database
 * Real-world jetlag-relevant specs for common aircraft types
 */

import { AircraftCharacteristics } from './holistic-scorer';

// Database of aircraft with jetlag-relevant characteristics
export const AIRCRAFT_DATABASE: Record<string, AircraftCharacteristics> = {
  // ============================================================================
  // NEXT-GEN AIRCRAFT (2010+) - Superior cabin environment
  // ============================================================================

  '787-8': {
    type: '787-8',
    manufacturer: 'Boeing',
    cabinPressure: 6000,      // 6,000 ft vs 8,000 ft standard
    cabinHumidity: 15,         // Higher than typical 10-12%
    noiseLevel: 'quiet',
    windowSize: 'large',       // 65% larger than standard
    seatComfort: 7,
    aisleWidth: 'standard',
    entertainment: 8,
    sleepScore: 8.5,           // Excellent for sleep
    generation: 'nextgen',
  },

  '787-9': {
    type: '787-9',
    manufacturer: 'Boeing',
    cabinPressure: 6000,
    cabinHumidity: 15,
    noiseLevel: 'quiet',
    windowSize: 'large',
    seatComfort: 7,
    aisleWidth: 'standard',
    entertainment: 8,
    sleepScore: 8.5,
    generation: 'nextgen',
  },

  '787-10': {
    type: '787-10',
    manufacturer: 'Boeing',
    cabinPressure: 6000,
    cabinHumidity: 15,
    noiseLevel: 'quiet',
    windowSize: 'large',
    seatComfort: 7,
    aisleWidth: 'standard',
    entertainment: 8,
    sleepScore: 8.5,
    generation: 'nextgen',
  },

  'A350-900': {
    type: 'A350-900',
    manufacturer: 'Airbus',
    cabinPressure: 6000,
    cabinHumidity: 20,         // Best in class
    noiseLevel: 'quiet',
    windowSize: 'large',
    seatComfort: 8,
    aisleWidth: 'wide',
    entertainment: 8,
    sleepScore: 9,             // Best aircraft for jetlag
    generation: 'nextgen',
  },

  'A350-1000': {
    type: 'A350-1000',
    manufacturer: 'Airbus',
    cabinPressure: 6000,
    cabinHumidity: 20,
    noiseLevel: 'quiet',
    windowSize: 'large',
    seatComfort: 8,
    aisleWidth: 'wide',
    entertainment: 9,
    sleepScore: 9,
    generation: 'nextgen',
  },

  'A220-300': {
    type: 'A220-300',
    manufacturer: 'Airbus',
    cabinPressure: 6000,
    cabinHumidity: 15,
    noiseLevel: 'quiet',
    windowSize: 'large',
    seatComfort: 7,
    aisleWidth: 'standard',
    entertainment: 7,
    sleepScore: 8,
    generation: 'nextgen',
  },

  // ============================================================================
  // MODERN AIRCRAFT (2000-2010) - Good but not best-in-class
  // ============================================================================

  '777-300ER': {
    type: '777-300ER',
    manufacturer: 'Boeing',
    cabinPressure: 8000,       // Standard altitude
    cabinHumidity: 10,         // Standard
    noiseLevel: 'moderate',
    windowSize: 'standard',
    seatComfort: 7,
    aisleWidth: 'wide',
    entertainment: 7,
    sleepScore: 7,
    generation: 'modern',
  },

  '777-200ER': {
    type: '777-200ER',
    manufacturer: 'Boeing',
    cabinPressure: 8000,
    cabinHumidity: 10,
    noiseLevel: 'moderate',
    windowSize: 'standard',
    seatComfort: 7,
    aisleWidth: 'wide',
    entertainment: 7,
    sleepScore: 7,
    generation: 'modern',
  },

  'A380-800': {
    type: 'A380-800',
    manufacturer: 'Airbus',
    cabinPressure: 8000,
    cabinHumidity: 15,         // Better than standard
    noiseLevel: 'quiet',       // Very quiet upper deck
    windowSize: 'standard',
    seatComfort: 8,
    aisleWidth: 'wide',
    entertainment: 8,
    sleepScore: 8,             // Spacious and quiet
    generation: 'modern',
  },

  'A330-300': {
    type: 'A330-300',
    manufacturer: 'Airbus',
    cabinPressure: 8000,
    cabinHumidity: 10,
    noiseLevel: 'moderate',
    windowSize: 'standard',
    seatComfort: 6,
    aisleWidth: 'standard',
    entertainment: 6,
    sleepScore: 6,
    generation: 'modern',
  },

  'A330-200': {
    type: 'A330-200',
    manufacturer: 'Airbus',
    cabinPressure: 8000,
    cabinHumidity: 10,
    noiseLevel: 'moderate',
    windowSize: 'standard',
    seatComfort: 6,
    aisleWidth: 'standard',
    entertainment: 6,
    sleepScore: 6,
    generation: 'modern',
  },

  // ============================================================================
  // LEGACY AIRCRAFT (pre-2000) - Older, less comfortable
  // ============================================================================

  '767-300': {
    type: '767-300',
    manufacturer: 'Boeing',
    cabinPressure: 8000,
    cabinHumidity: 8,          // Dry
    noiseLevel: 'moderate',
    windowSize: 'small',
    seatComfort: 5,
    aisleWidth: 'narrow',
    entertainment: 5,
    sleepScore: 5,
    generation: 'legacy',
  },

  '767-400': {
    type: '767-400',
    manufacturer: 'Boeing',
    cabinPressure: 8000,
    cabinHumidity: 8,
    noiseLevel: 'moderate',
    windowSize: 'small',
    seatComfort: 5,
    aisleWidth: 'narrow',
    entertainment: 5,
    sleepScore: 5,
    generation: 'legacy',
  },

  '747-400': {
    type: '747-400',
    manufacturer: 'Boeing',
    cabinPressure: 8000,
    cabinHumidity: 8,
    noiseLevel: 'loud',        // Upper deck quieter
    windowSize: 'small',
    seatComfort: 6,
    aisleWidth: 'standard',
    entertainment: 6,
    sleepScore: 5,
    generation: 'legacy',
  },

  'A340-300': {
    type: 'A340-300',
    manufacturer: 'Airbus',
    cabinPressure: 8000,
    cabinHumidity: 8,
    noiseLevel: 'moderate',
    windowSize: 'small',
    seatComfort: 5,
    aisleWidth: 'standard',
    entertainment: 5,
    sleepScore: 5,
    generation: 'legacy',
  },

  // ============================================================================
  // NARROW-BODY AIRCRAFT (used on some long routes)
  // ============================================================================

  'A321neo': {
    type: 'A321neo',
    manufacturer: 'Airbus',
    cabinPressure: 7000,
    cabinHumidity: 12,
    noiseLevel: 'quiet',
    windowSize: 'standard',
    seatComfort: 6,
    aisleWidth: 'narrow',
    entertainment: 7,
    sleepScore: 6,
    generation: 'nextgen',
  },

  '737 MAX 9': {
    type: '737 MAX 9',
    manufacturer: 'Boeing',
    cabinPressure: 8000,
    cabinHumidity: 10,
    noiseLevel: 'moderate',
    windowSize: 'standard',
    seatComfort: 5,
    aisleWidth: 'narrow',
    entertainment: 6,
    sleepScore: 5,
    generation: 'nextgen',
  },

  '737-900': {
    type: '737-900',
    manufacturer: 'Boeing',
    cabinPressure: 8000,
    cabinHumidity: 8,
    noiseLevel: 'moderate',
    windowSize: 'small',
    seatComfort: 5,
    aisleWidth: 'narrow',
    entertainment: 5,
    sleepScore: 4,
    generation: 'modern',
  },
};

/**
 * Default aircraft characteristics for unknown types
 */
export const DEFAULT_AIRCRAFT: AircraftCharacteristics = {
  type: 'Unknown',
  manufacturer: 'Other',
  cabinPressure: 8000,
  cabinHumidity: 10,
  noiseLevel: 'moderate',
  windowSize: 'standard',
  seatComfort: 6,
  aisleWidth: 'standard',
  entertainment: 6,
  sleepScore: 6,
  generation: 'modern',
};

/**
 * Get aircraft characteristics by type code
 * Handles variations in naming (e.g., "787-9" vs "Boeing 787-9" vs "789")
 */
export function getAircraftCharacteristics(aircraftType: string | null | undefined): AircraftCharacteristics {
  if (!aircraftType) return DEFAULT_AIRCRAFT;

  // Normalize aircraft type
  const normalized = aircraftType
    .toUpperCase()
    .replace(/BOEING\s*/i, '')
    .replace(/AIRBUS\s*/i, '')
    .replace(/\s+/g, '')
    .trim();

  // Common IATA equipment codes
  const equipmentCodeMap: Record<string, string> = {
    '789': '787-9',
    '788': '787-8',
    '781': '787-10',
    '359': 'A350-900',
    '351': 'A350-1000',
    '77W': '777-300ER',
    '77L': '777-200ER',
    '388': 'A380-800',
    '333': 'A330-300',
    '332': 'A330-200',
    '763': '767-300',
    '764': '767-400',
    '744': '747-400',
    '343': 'A340-300',
    '32N': 'A321neo',
    '7M9': '737 MAX 9',
    '739': '737-900',
    '223': 'A220-300',
  };

  // Check equipment code map
  if (equipmentCodeMap[normalized]) {
    const mapped = equipmentCodeMap[normalized];
    if (AIRCRAFT_DATABASE[mapped]) {
      return AIRCRAFT_DATABASE[mapped];
    }
  }

  // Direct lookup
  if (AIRCRAFT_DATABASE[normalized]) {
    return AIRCRAFT_DATABASE[normalized];
  }

  // Try partial matches
  for (const key of Object.keys(AIRCRAFT_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return AIRCRAFT_DATABASE[key];
    }
  }

  // Unknown aircraft - return default
  console.warn(`Unknown aircraft type: ${aircraftType}, using default characteristics`);
  return DEFAULT_AIRCRAFT;
}

/**
 * Compare two aircraft for jetlag suitability
 */
export function compareAircraft(
  type1: string,
  type2: string
): {
  better: string;
  reason: string;
  sleepScoreDiff: number;
} {
  const aircraft1 = getAircraftCharacteristics(type1);
  const aircraft2 = getAircraftCharacteristics(type2);

  const diff = aircraft1.sleepScore - aircraft2.sleepScore;

  if (Math.abs(diff) < 0.5) {
    return {
      better: 'equal',
      reason: 'Both aircraft have similar jetlag impact',
      sleepScoreDiff: diff,
    };
  }

  const better = diff > 0 ? type1 : type2;
  const betterAircraft = diff > 0 ? aircraft1 : aircraft2;
  const worseAircraft = diff > 0 ? aircraft2 : aircraft1;

  const reasons: string[] = [];

  if (betterAircraft.cabinPressure < worseAircraft.cabinPressure) {
    reasons.push(`lower cabin altitude (${betterAircraft.cabinPressure}ft vs ${worseAircraft.cabinPressure}ft)`);
  }

  if (betterAircraft.cabinHumidity > worseAircraft.cabinHumidity) {
    reasons.push(`higher humidity (${betterAircraft.cabinHumidity}% vs ${worseAircraft.cabinHumidity}%)`);
  }

  if (betterAircraft.noiseLevel === 'quiet' && worseAircraft.noiseLevel !== 'quiet') {
    reasons.push('quieter cabin');
  }

  if (betterAircraft.generation === 'nextgen' && worseAircraft.generation !== 'nextgen') {
    reasons.push('next-generation technology');
  }

  return {
    better,
    reason: reasons.join(', '),
    sleepScoreDiff: Math.abs(diff),
  };
}
