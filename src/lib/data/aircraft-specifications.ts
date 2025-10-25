/**
 * Static Aircraft Specifications Database
 *
 * Real specifications for aircraft families, mapped by aircraft name patterns.
 * Sources: Boeing.com, Airbus.com, Aviation Week, Flightradar24
 */

export interface AircraftSpec {
  family: string;
  manufacturer: string;
  generation: 'nextgen' | 'modern' | 'legacy';
  cabinPressureAltitudeFeet: number;
  humidityPercent: number;
  noiseLevelDb: number;
  cabinAirRefreshRateMinutes: number;
  typicalSeatPitchInches: number;
  windowSizeSqIn: number;
  overheadBinSpaceCuFt: number;
  firstFlightYear: number;
  isActive: boolean;
}

/**
 * Aircraft specifications by family
 */
export const AIRCRAFT_SPECS: Record<string, AircraftSpec> = {
  // ============================================================================
  // NEXT-GEN AIRCRAFT (2010+) - Best jetlag performance
  // ============================================================================

  'Boeing 787': {
    family: 'Boeing 787 Dreamliner',
    manufacturer: 'Boeing',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6000,    // Industry-leading low pressure
    humidityPercent: 16,                 // Best in class
    noiseLevelDb: 72,                    // Quietest
    cabinAirRefreshRateMinutes: 2,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 280,                 // 65% larger windows
    overheadBinSpaceCuFt: 140,
    firstFlightYear: 2009,
    isActive: true,
  },

  'Airbus A350': {
    family: 'Airbus A350 XWB',
    manufacturer: 'Airbus',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6000,
    humidityPercent: 15,
    noiseLevelDb: 72,
    cabinAirRefreshRateMinutes: 2,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 250,
    overheadBinSpaceCuFt: 145,
    firstFlightYear: 2013,
    isActive: true,
  },

  'Airbus A220': {
    family: 'Airbus A220',
    manufacturer: 'Airbus',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6500,
    humidityPercent: 14,
    noiseLevelDb: 73,
    cabinAirRefreshRateMinutes: 2.5,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 240,
    overheadBinSpaceCuFt: 130,
    firstFlightYear: 2013,
    isActive: true,
  },

  'Boeing 737 MAX': {
    family: 'Boeing 737 MAX',
    manufacturer: 'Boeing',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6500,
    humidityPercent: 13,
    noiseLevelDb: 74,
    cabinAirRefreshRateMinutes: 2.5,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 200,
    overheadBinSpaceCuFt: 135,
    firstFlightYear: 2016,
    isActive: true,
  },

  'Airbus A321neo': {
    family: 'Airbus A321neo',
    manufacturer: 'Airbus',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6500,
    humidityPercent: 13,
    noiseLevelDb: 74,
    cabinAirRefreshRateMinutes: 2.5,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 210,
    overheadBinSpaceCuFt: 130,
    firstFlightYear: 2016,
    isActive: true,
  },

  'Airbus A330neo': {
    family: 'Airbus A330neo',
    manufacturer: 'Airbus',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6500,
    humidityPercent: 14,
    noiseLevelDb: 73,
    cabinAirRefreshRateMinutes: 2.5,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 220,
    overheadBinSpaceCuFt: 140,
    firstFlightYear: 2017,
    isActive: true,
  },

  // ============================================================================
  // MODERN AIRCRAFT (2000-2010) - Good jetlag performance
  // ============================================================================

  'Boeing 777': {
    family: 'Boeing 777',
    manufacturer: 'Boeing',
    generation: 'modern',
    cabinPressureAltitudeFeet: 7500,
    humidityPercent: 12,
    noiseLevelDb: 75,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 220,
    overheadBinSpaceCuFt: 130,
    firstFlightYear: 1994,
    isActive: true,
  },

  'Airbus A330': {
    family: 'Airbus A330',
    manufacturer: 'Airbus',
    generation: 'modern',
    cabinPressureAltitudeFeet: 7500,
    humidityPercent: 12,
    noiseLevelDb: 75,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 210,
    overheadBinSpaceCuFt: 125,
    firstFlightYear: 1992,
    isActive: true,
  },

  'Boeing 737-800': {
    family: 'Boeing 737-800 (NG)',
    manufacturer: 'Boeing',
    generation: 'modern',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 11,
    noiseLevelDb: 76,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 190,
    overheadBinSpaceCuFt: 120,
    firstFlightYear: 1997,
    isActive: true,
  },

  'Airbus A320': {
    family: 'Airbus A320',
    manufacturer: 'Airbus',
    generation: 'modern',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 11,
    noiseLevelDb: 76,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 30,
    windowSizeSqIn: 200,
    overheadBinSpaceCuFt: 115,
    firstFlightYear: 1987,
    isActive: true,
  },

  'Airbus A380': {
    family: 'Airbus A380',
    manufacturer: 'Airbus',
    generation: 'modern',
    cabinPressureAltitudeFeet: 7500,
    humidityPercent: 13,
    noiseLevelDb: 74,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 32,
    windowSizeSqIn: 230,
    overheadBinSpaceCuFt: 150,
    firstFlightYear: 2005,
    isActive: false, // Production ended
  },

  // ============================================================================
  // LEGACY AIRCRAFT (Pre-2000) - Poor jetlag performance
  // ============================================================================

  'Boeing 747': {
    family: 'Boeing 747',
    manufacturer: 'Boeing',
    generation: 'legacy',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 10,
    noiseLevelDb: 78,
    cabinAirRefreshRateMinutes: 4,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 180,
    overheadBinSpaceCuFt: 110,
    firstFlightYear: 1969,
    isActive: false,
  },

  'Boeing 757': {
    family: 'Boeing 757',
    manufacturer: 'Boeing',
    generation: 'legacy',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 10,
    noiseLevelDb: 77,
    cabinAirRefreshRateMinutes: 3.5,
    typicalSeatPitchInches: 30,
    windowSizeSqIn: 170,
    overheadBinSpaceCuFt: 105,
    firstFlightYear: 1982,
    isActive: false,
  },

  'Boeing 767': {
    family: 'Boeing 767',
    manufacturer: 'Boeing',
    generation: 'legacy',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 10,
    noiseLevelDb: 77,
    cabinAirRefreshRateMinutes: 3.5,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 180,
    overheadBinSpaceCuFt: 110,
    firstFlightYear: 1981,
    isActive: true, // Still cargo ops
  },

  'McDonnell Douglas MD-80': {
    family: 'McDonnell Douglas MD-80',
    manufacturer: 'McDonnell Douglas',
    generation: 'legacy',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 9,
    noiseLevelDb: 80,
    cabinAirRefreshRateMinutes: 4,
    typicalSeatPitchInches: 30,
    windowSizeSqIn: 160,
    overheadBinSpaceCuFt: 100,
    firstFlightYear: 1979,
    isActive: false,
  },

  'McDonnell Douglas DC-9': {
    family: 'McDonnell Douglas DC-9',
    manufacturer: 'McDonnell Douglas',
    generation: 'legacy',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 8,
    noiseLevelDb: 81,
    cabinAirRefreshRateMinutes: 4,
    typicalSeatPitchInches: 29,
    windowSizeSqIn: 150,
    overheadBinSpaceCuFt: 95,
    firstFlightYear: 1965,
    isActive: false,
  },

  'McDonnell Douglas DC-10': {
    family: 'McDonnell Douglas DC-10',
    manufacturer: 'McDonnell Douglas',
    generation: 'legacy',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 9,
    noiseLevelDb: 79,
    cabinAirRefreshRateMinutes: 4,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 170,
    overheadBinSpaceCuFt: 105,
    firstFlightYear: 1970,
    isActive: false,
  },

  // ============================================================================
  // REGIONAL JETS - Varying performance
  // ============================================================================

  'Embraer E-Jet E2': {
    family: 'Embraer E-Jet E2',
    manufacturer: 'Embraer',
    generation: 'nextgen',
    cabinPressureAltitudeFeet: 6500,
    humidityPercent: 13,
    noiseLevelDb: 74,
    cabinAirRefreshRateMinutes: 2.5,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 210,
    overheadBinSpaceCuFt: 115,
    firstFlightYear: 2016,
    isActive: true,
  },

  'Embraer E-Jet': {
    family: 'Embraer E-Jet',
    manufacturer: 'Embraer',
    generation: 'modern',
    cabinPressureAltitudeFeet: 7500,
    humidityPercent: 11,
    noiseLevelDb: 76,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 200,
    overheadBinSpaceCuFt: 110,
    firstFlightYear: 2002,
    isActive: true,
  },

  'Bombardier CRJ': {
    family: 'Bombardier CRJ',
    manufacturer: 'Bombardier',
    generation: 'modern',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 10,
    noiseLevelDb: 77,
    cabinAirRefreshRateMinutes: 3.5,
    typicalSeatPitchInches: 30,
    windowSizeSqIn: 170,
    overheadBinSpaceCuFt: 95,
    firstFlightYear: 1991,
    isActive: true,
  },

  'ATR 72': {
    family: 'ATR 72',
    manufacturer: 'ATR',
    generation: 'modern',
    cabinPressureAltitudeFeet: 8000,
    humidityPercent: 10,
    noiseLevelDb: 77,
    cabinAirRefreshRateMinutes: 3.5,
    typicalSeatPitchInches: 30,
    windowSizeSqIn: 160,
    overheadBinSpaceCuFt: 90,
    firstFlightYear: 1988,
    isActive: true,
  },

  // ============================================================================
  // DEFAULT (for unknown aircraft)
  // ============================================================================

  'DEFAULT': {
    family: 'Unknown Aircraft',
    manufacturer: 'Unknown',
    generation: 'modern',
    cabinPressureAltitudeFeet: 7500,
    humidityPercent: 11,
    noiseLevelDb: 76,
    cabinAirRefreshRateMinutes: 3,
    typicalSeatPitchInches: 31,
    windowSizeSqIn: 190,
    overheadBinSpaceCuFt: 110,
    firstFlightYear: 2000,
    isActive: true,
  },
};

/**
 * Match aircraft name to specification family
 */
export function matchAircraftSpec(aircraftName: string): AircraftSpec {
  const name = aircraftName.toLowerCase();

  // Boeing 787 variants
  if (name.includes('787') || name.includes('dreamliner')) {
    return AIRCRAFT_SPECS['Boeing 787'];
  }

  // Airbus A350
  if (name.includes('a350') || name.includes('a-350')) {
    return AIRCRAFT_SPECS['Airbus A350'];
  }

  // Airbus A220 (CS300)
  if (name.includes('a220') || name.includes('cs300') || name.includes('cs100')) {
    return AIRCRAFT_SPECS['Airbus A220'];
  }

  // Boeing 737 MAX
  if (name.includes('737') && (name.includes('max') || name.includes('-7') || name.includes('-8') || name.includes('-9') || name.includes('-10'))) {
    return AIRCRAFT_SPECS['Boeing 737 MAX'];
  }

  // Airbus A321neo
  if ((name.includes('a321') || name.includes('a320')) && name.includes('neo')) {
    return AIRCRAFT_SPECS['Airbus A321neo'];
  }

  // Airbus A330neo
  if (name.includes('a330') && name.includes('neo')) {
    return AIRCRAFT_SPECS['Airbus A330neo'];
  }

  // Boeing 777
  if (name.includes('777')) {
    return AIRCRAFT_SPECS['Boeing 777'];
  }

  // Airbus A330
  if (name.includes('a330')) {
    return AIRCRAFT_SPECS['Airbus A330'];
  }

  // Boeing 737-800/NG
  if (name.includes('737') && !name.includes('max')) {
    return AIRCRAFT_SPECS['Boeing 737-800'];
  }

  // Airbus A320 family
  if (name.includes('a318') || name.includes('a319') || name.includes('a320') || name.includes('a321')) {
    return AIRCRAFT_SPECS['Airbus A320'];
  }

  // Airbus A380
  if (name.includes('a380')) {
    return AIRCRAFT_SPECS['Airbus A380'];
  }

  // Boeing 747
  if (name.includes('747')) {
    return AIRCRAFT_SPECS['Boeing 747'];
  }

  // Boeing 757
  if (name.includes('757')) {
    return AIRCRAFT_SPECS['Boeing 757'];
  }

  // Boeing 767
  if (name.includes('767')) {
    return AIRCRAFT_SPECS['Boeing 767'];
  }

  // MD-80
  if (name.includes('md-8') || name.includes('md8')) {
    return AIRCRAFT_SPECS['McDonnell Douglas MD-80'];
  }

  // DC-9
  if (name.includes('dc-9') || name.includes('dc9')) {
    return AIRCRAFT_SPECS['McDonnell Douglas DC-9'];
  }

  // DC-10
  if (name.includes('dc-10') || name.includes('dc10')) {
    return AIRCRAFT_SPECS['McDonnell Douglas DC-10'];
  }

  // Embraer E2
  if ((name.includes('embraer') || name.includes('e-jet')) && name.includes('e2')) {
    return AIRCRAFT_SPECS['Embraer E-Jet E2'];
  }

  // Embraer E-Jet
  if (name.includes('embraer') || name.includes('e170') || name.includes('e175') || name.includes('e190') || name.includes('e195')) {
    return AIRCRAFT_SPECS['Embraer E-Jet'];
  }

  // CRJ
  if (name.includes('crj') || name.includes('canadair')) {
    return AIRCRAFT_SPECS['Bombardier CRJ'];
  }

  // ATR
  if (name.includes('atr')) {
    return AIRCRAFT_SPECS['ATR 72'];
  }

  // Default for unknown - but extract manufacturer from name
  const spec = { ...AIRCRAFT_SPECS['DEFAULT'] };
  spec.manufacturer = extractManufacturer(name);
  return spec;
}

/**
 * Manufacturer detection from aircraft name
 */
const MANUFACTURER_MAPPINGS: Record<string, string> = {
  'boeing': 'Boeing',
  'airbus': 'Airbus',
  'de havilland': 'De Havilland Canada',
  'dehavilland': 'De Havilland Canada',
  'dhc': 'De Havilland Canada',
  'lockheed': 'Lockheed',
  'cessna': 'Cessna',
  'piper': 'Piper',
  'embraer': 'Embraer',
  'bombardier': 'Bombardier',
  'canadair': 'Bombardier',
  'atr': 'ATR',
  'british aerospace': 'British Aerospace',
  'bae': 'British Aerospace',
  'douglas': 'Douglas Aircraft',
  'mcdonnell douglas': 'McDonnell Douglas',
  'tupolev': 'Tupolev',
  'ilyushin': 'Ilyushin',
  'antonov': 'Antonov',
  'sukhoi': 'Sukhoi',
  'comac': 'Comac',
  'fokker': 'Fokker',
  'shorts': 'Shorts Brothers',
  'dornier': 'Dornier',
  'saab': 'Saab',
  'casa': 'CASA',
  'iptn': 'IPTN',
  'mitsubishi': 'Mitsubishi',
  'beechcraft': 'Beechcraft',
  'gulfstream': 'Gulfstream',
  'dassault': 'Dassault',
  'learjet': 'Learjet',
  'hawker': 'Hawker',
  'jetstream': 'British Aerospace',
  'avro': 'Avro',
  'vickers': 'Vickers',
  'convair': 'Convair',
};

function extractManufacturer(aircraftName: string): string {
  const nameLower = aircraftName.toLowerCase();
  for (const [key, value] of Object.entries(MANUFACTURER_MAPPINGS)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }
  return 'Unknown';
}
