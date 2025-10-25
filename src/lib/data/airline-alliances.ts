/**
 * Airline Alliance Mappings
 *
 * Major airline alliances and their member carriers
 */

export type AllianceName = 'Star Alliance' | 'SkyTeam' | 'Oneworld' | null;

export interface AirlineInfo {
  iata: string;
  name: string;
  alliance: AllianceName;
  country: string;
}

export const AIRLINE_ALLIANCES: Record<string, AllianceName> = {
  // Star Alliance
  'UA': 'Star Alliance', // United Airlines
  'LH': 'Star Alliance', // Lufthansa
  'AC': 'Star Alliance', // Air Canada
  'NH': 'Star Alliance', // All Nippon Airways
  'SQ': 'Star Alliance', // Singapore Airlines
  'TG': 'Star Alliance', // Thai Airways
  'TP': 'Star Alliance', // TAP Air Portugal
  'SA': 'Star Alliance', // South African Airways
  'TK': 'Star Alliance', // Turkish Airlines
  'OS': 'Star Alliance', // Austrian Airlines
  'LX': 'Star Alliance', // Swiss International Air Lines
  'SK': 'Star Alliance', // Scandinavian Airlines
  'LO': 'Star Alliance', // LOT Polish Airlines
  'BR': 'Star Alliance', // EVA Air
  'OZ': 'Star Alliance', // Asiana Airlines
  'CA': 'Star Alliance', // Air China
  'NZ': 'Star Alliance', // Air New Zealand
  'ET': 'Star Alliance', // Ethiopian Airlines
  'AV': 'Star Alliance', // Avianca
  'CM': 'Star Alliance', // Copa Airlines

  // SkyTeam
  'DL': 'SkyTeam', // Delta Air Lines
  'AF': 'SkyTeam', // Air France
  'KL': 'SkyTeam', // KLM
  'AZ': 'SkyTeam', // ITA Airways
  'AM': 'SkyTeam', // Aeroméxico
  'AR': 'SkyTeam', // Aerolíneas Argentinas
  'SU': 'SkyTeam', // Aeroflot
  'OK': 'SkyTeam', // Czech Airlines
  'RO': 'SkyTeam', // Tarom
  'UX': 'SkyTeam', // Air Europa
  'MU': 'SkyTeam', // China Eastern
  'CZ': 'SkyTeam', // China Southern
  'KE': 'SkyTeam', // Korean Air
  'VS': 'SkyTeam', // Virgin Atlantic
  'VN': 'SkyTeam', // Vietnam Airlines
  'GA': 'SkyTeam', // Garuda Indonesia
  'ME': 'SkyTeam', // Middle East Airlines
  'SV': 'SkyTeam', // Saudia
  'KQ': 'SkyTeam', // Kenya Airways

  // Oneworld
  'AA': 'Oneworld', // American Airlines
  'BA': 'Oneworld', // British Airways
  'CX': 'Oneworld', // Cathay Pacific
  'QF': 'Oneworld', // Qantas
  'IB': 'Oneworld', // Iberia
  'AY': 'Oneworld', // Finnair
  'JL': 'Oneworld', // Japan Airlines
  'QR': 'Oneworld', // Qatar Airways
  'LA': 'Oneworld', // LATAM Airlines
  'MH': 'Oneworld', // Malaysia Airlines
  'RJ': 'Oneworld', // Royal Jordanian
  'S7': 'Oneworld', // S7 Airlines
  'UL': 'Oneworld', // SriLankan Airlines
  'AT': 'Oneworld', // Royal Air Maroc
  'FJ': 'Oneworld', // Fiji Airways
  'AS': 'Oneworld', // Alaska Airlines (joining 2021)

  // Non-Alliance Major Carriers
  'EK': null, // Emirates
  'EY': null, // Etihad
  'WY': null, // Oman Air
  'B6': null, // JetBlue
  'WN': null, // Southwest
  'NK': null, // Spirit
  'F9': null, // Frontier
  'G4': null, // Allegiant
  'TN': null, // Air Tahiti Nui
  'NF': null, // Air Vanuatu
  'SB': null, // Air Caledonie
  'FP': null, // Fiji Link
  'PX': null, // Air Niugini
  'IE': null, // Solomon Airlines

  // Additional carriers
  'HA': null, // Hawaiian Airlines
  'PR': null, // Philippine Airlines
  '3K': null, // Jetstar Asia
  'JQ': null, // Jetstar Airways
  'TR': null, // Scoot
  'VZ': null, // Thai Vietjet Air
  'FD': null, // Thai AirAsia
  'D7': null, // AirAsia X
  'AK': null, // AirAsia
  'Z2': null, // AirAsia Philippines
  'QZ': null, // Indonesia AirAsia
  'XT': null, // Indonesia AirAsia X
  'I5': null, // AirAsia India
  '5J': null, // Cebu Pacific
  'BI': null, // Royal Brunei
  'BG': null, // Biman Bangladesh
  'PG': null, // Bangkok Airways
  'TZ': null, // Scoot (Tigerair)
  'MI': null, // SilkAir
  '6E': null, // IndiGo
  'AI': 'Star Alliance', // Air India
  'IX': null, // Air India Express
  'UK': null, // Vistara
  'SG': null, // SpiceJet
  '9W': null, // Jet Airways
  'WY': null, // Oman Air
  'GF': null, // Gulf Air
  'MS': 'Star Alliance', // EgyptAir
  'BT': null, // airBaltic
  'AY': 'Oneworld', // Finnair
  'DY': null, // Norwegian
  'W6': null, // Wizz Air
  'FR': null, // Ryanair
  'U2': null, // easyJet
  'LS': null, // Jet2
  'VY': null, // Vueling
  'TP': 'Star Alliance', // TAP Portugal
  'IB': 'Oneworld', // Iberia
  'UX': 'SkyTeam', // Air Europa
  'VY': null, // Vueling
  'I2': null, // Iberia Express
  'NT': null, // Binter Canarias
  'BE': null, // Flybe
  'ZB': null, // Monarch Airlines
};

/**
 * Comprehensive airline database with full information
 */
export const AIRLINE_DATABASE: Record<string, AirlineInfo> = {
  // Star Alliance
  'UA': { iata: 'UA', name: 'United Airlines', alliance: 'Star Alliance', country: 'United States' },
  'LH': { iata: 'LH', name: 'Lufthansa', alliance: 'Star Alliance', country: 'Germany' },
  'AC': { iata: 'AC', name: 'Air Canada', alliance: 'Star Alliance', country: 'Canada' },
  'NH': { iata: 'NH', name: 'All Nippon Airways', alliance: 'Star Alliance', country: 'Japan' },
  'SQ': { iata: 'SQ', name: 'Singapore Airlines', alliance: 'Star Alliance', country: 'Singapore' },
  'TG': { iata: 'TG', name: 'Thai Airways', alliance: 'Star Alliance', country: 'Thailand' },
  'TP': { iata: 'TP', name: 'TAP Air Portugal', alliance: 'Star Alliance', country: 'Portugal' },
  'SA': { iata: 'SA', name: 'South African Airways', alliance: 'Star Alliance', country: 'South Africa' },
  'TK': { iata: 'TK', name: 'Turkish Airlines', alliance: 'Star Alliance', country: 'Turkey' },
  'OS': { iata: 'OS', name: 'Austrian Airlines', alliance: 'Star Alliance', country: 'Austria' },
  'LX': { iata: 'LX', name: 'Swiss International Air Lines', alliance: 'Star Alliance', country: 'Switzerland' },
  'SK': { iata: 'SK', name: 'Scandinavian Airlines', alliance: 'Star Alliance', country: 'Sweden' },
  'LO': { iata: 'LO', name: 'LOT Polish Airlines', alliance: 'Star Alliance', country: 'Poland' },
  'BR': { iata: 'BR', name: 'EVA Air', alliance: 'Star Alliance', country: 'Taiwan' },
  'OZ': { iata: 'OZ', name: 'Asiana Airlines', alliance: 'Star Alliance', country: 'South Korea' },
  'CA': { iata: 'CA', name: 'Air China', alliance: 'Star Alliance', country: 'China' },
  'NZ': { iata: 'NZ', name: 'Air New Zealand', alliance: 'Star Alliance', country: 'New Zealand' },
  'ET': { iata: 'ET', name: 'Ethiopian Airlines', alliance: 'Star Alliance', country: 'Ethiopia' },
  'AV': { iata: 'AV', name: 'Avianca', alliance: 'Star Alliance', country: 'Colombia' },
  'CM': { iata: 'CM', name: 'Copa Airlines', alliance: 'Star Alliance', country: 'Panama' },
  'AI': { iata: 'AI', name: 'Air India', alliance: 'Star Alliance', country: 'India' },
  'MS': { iata: 'MS', name: 'EgyptAir', alliance: 'Star Alliance', country: 'Egypt' },

  // SkyTeam
  'DL': { iata: 'DL', name: 'Delta Air Lines', alliance: 'SkyTeam', country: 'United States' },
  'AF': { iata: 'AF', name: 'Air France', alliance: 'SkyTeam', country: 'France' },
  'KL': { iata: 'KL', name: 'KLM Royal Dutch Airlines', alliance: 'SkyTeam', country: 'Netherlands' },
  'AZ': { iata: 'AZ', name: 'ITA Airways', alliance: 'SkyTeam', country: 'Italy' },
  'AM': { iata: 'AM', name: 'Aeroméxico', alliance: 'SkyTeam', country: 'Mexico' },
  'AR': { iata: 'AR', name: 'Aerolíneas Argentinas', alliance: 'SkyTeam', country: 'Argentina' },
  'SU': { iata: 'SU', name: 'Aeroflot', alliance: 'SkyTeam', country: 'Russia' },
  'OK': { iata: 'OK', name: 'Czech Airlines', alliance: 'SkyTeam', country: 'Czech Republic' },
  'RO': { iata: 'RO', name: 'Tarom', alliance: 'SkyTeam', country: 'Romania' },
  'UX': { iata: 'UX', name: 'Air Europa', alliance: 'SkyTeam', country: 'Spain' },
  'MU': { iata: 'MU', name: 'China Eastern Airlines', alliance: 'SkyTeam', country: 'China' },
  'CZ': { iata: 'CZ', name: 'China Southern Airlines', alliance: 'SkyTeam', country: 'China' },
  'KE': { iata: 'KE', name: 'Korean Air', alliance: 'SkyTeam', country: 'South Korea' },
  'VS': { iata: 'VS', name: 'Virgin Atlantic', alliance: 'SkyTeam', country: 'United Kingdom' },
  'VN': { iata: 'VN', name: 'Vietnam Airlines', alliance: 'SkyTeam', country: 'Vietnam' },
  'GA': { iata: 'GA', name: 'Garuda Indonesia', alliance: 'SkyTeam', country: 'Indonesia' },
  'ME': { iata: 'ME', name: 'Middle East Airlines', alliance: 'SkyTeam', country: 'Lebanon' },
  'SV': { iata: 'SV', name: 'Saudia', alliance: 'SkyTeam', country: 'Saudi Arabia' },
  'KQ': { iata: 'KQ', name: 'Kenya Airways', alliance: 'SkyTeam', country: 'Kenya' },

  // Oneworld
  'AA': { iata: 'AA', name: 'American Airlines', alliance: 'Oneworld', country: 'United States' },
  'BA': { iata: 'BA', name: 'British Airways', alliance: 'Oneworld', country: 'United Kingdom' },
  'CX': { iata: 'CX', name: 'Cathay Pacific', alliance: 'Oneworld', country: 'Hong Kong' },
  'QF': { iata: 'QF', name: 'Qantas', alliance: 'Oneworld', country: 'Australia' },
  'IB': { iata: 'IB', name: 'Iberia', alliance: 'Oneworld', country: 'Spain' },
  'AY': { iata: 'AY', name: 'Finnair', alliance: 'Oneworld', country: 'Finland' },
  'JL': { iata: 'JL', name: 'Japan Airlines', alliance: 'Oneworld', country: 'Japan' },
  'QR': { iata: 'QR', name: 'Qatar Airways', alliance: 'Oneworld', country: 'Qatar' },
  'LA': { iata: 'LA', name: 'LATAM Airlines', alliance: 'Oneworld', country: 'Chile' },
  'MH': { iata: 'MH', name: 'Malaysia Airlines', alliance: 'Oneworld', country: 'Malaysia' },
  'RJ': { iata: 'RJ', name: 'Royal Jordanian', alliance: 'Oneworld', country: 'Jordan' },
  'S7': { iata: 'S7', name: 'S7 Airlines', alliance: 'Oneworld', country: 'Russia' },
  'UL': { iata: 'UL', name: 'SriLankan Airlines', alliance: 'Oneworld', country: 'Sri Lanka' },
  'AT': { iata: 'AT', name: 'Royal Air Maroc', alliance: 'Oneworld', country: 'Morocco' },
  'FJ': { iata: 'FJ', name: 'Fiji Airways', alliance: 'Oneworld', country: 'Fiji' },
  'AS': { iata: 'AS', name: 'Alaska Airlines', alliance: 'Oneworld', country: 'United States' },

  // Non-Alliance Major Carriers
  'EK': { iata: 'EK', name: 'Emirates', alliance: null, country: 'United Arab Emirates' },
  'EY': { iata: 'EY', name: 'Etihad Airways', alliance: null, country: 'United Arab Emirates' },
  'WY': { iata: 'WY', name: 'Oman Air', alliance: null, country: 'Oman' },
  'B6': { iata: 'B6', name: 'JetBlue Airways', alliance: null, country: 'United States' },
  'WN': { iata: 'WN', name: 'Southwest Airlines', alliance: null, country: 'United States' },
  'NK': { iata: 'NK', name: 'Spirit Airlines', alliance: null, country: 'United States' },
  'F9': { iata: 'F9', name: 'Frontier Airlines', alliance: null, country: 'United States' },
  'G4': { iata: 'G4', name: 'Allegiant Air', alliance: null, country: 'United States' },
  'HA': { iata: 'HA', name: 'Hawaiian Airlines', alliance: null, country: 'United States' },
  'TN': { iata: 'TN', name: 'Air Tahiti Nui', alliance: null, country: 'French Polynesia' },
  'NF': { iata: 'NF', name: 'Air Vanuatu', alliance: null, country: 'Vanuatu' },
  'SB': { iata: 'SB', name: 'Air Caledonie', alliance: null, country: 'New Caledonia' },
  'FP': { iata: 'FP', name: 'Fiji Link', alliance: null, country: 'Fiji' },
  'PX': { iata: 'PX', name: 'Air Niugini', alliance: null, country: 'Papua New Guinea' },
  'IE': { iata: 'IE', name: 'Solomon Airlines', alliance: null, country: 'Solomon Islands' },
  'PR': { iata: 'PR', name: 'Philippine Airlines', alliance: null, country: 'Philippines' },
  'GF': { iata: 'GF', name: 'Gulf Air', alliance: null, country: 'Bahrain' },
  'BI': { iata: 'BI', name: 'Royal Brunei Airlines', alliance: null, country: 'Brunei' },
  'BG': { iata: 'BG', name: 'Biman Bangladesh Airlines', alliance: null, country: 'Bangladesh' },
  'PG': { iata: 'PG', name: 'Bangkok Airways', alliance: null, country: 'Thailand' },
  'MI': { iata: 'MI', name: 'SilkAir', alliance: null, country: 'Singapore' },
  'TR': { iata: 'TR', name: 'Scoot', alliance: null, country: 'Singapore' },

  // Low-Cost Carriers
  '3K': { iata: '3K', name: 'Jetstar Asia', alliance: null, country: 'Singapore' },
  'JQ': { iata: 'JQ', name: 'Jetstar Airways', alliance: null, country: 'Australia' },
  'VZ': { iata: 'VZ', name: 'Thai Vietjet Air', alliance: null, country: 'Thailand' },
  'FD': { iata: 'FD', name: 'Thai AirAsia', alliance: null, country: 'Thailand' },
  'D7': { iata: 'D7', name: 'AirAsia X', alliance: null, country: 'Malaysia' },
  'AK': { iata: 'AK', name: 'AirAsia', alliance: null, country: 'Malaysia' },
  'Z2': { iata: 'Z2', name: 'AirAsia Philippines', alliance: null, country: 'Philippines' },
  'QZ': { iata: 'QZ', name: 'Indonesia AirAsia', alliance: null, country: 'Indonesia' },
  'XT': { iata: 'XT', name: 'Indonesia AirAsia X', alliance: null, country: 'Indonesia' },
  'I5': { iata: 'I5', name: 'AirAsia India', alliance: null, country: 'India' },
  '5J': { iata: '5J', name: 'Cebu Pacific', alliance: null, country: 'Philippines' },
  '6E': { iata: '6E', name: 'IndiGo', alliance: null, country: 'India' },
  'IX': { iata: 'IX', name: 'Air India Express', alliance: null, country: 'India' },
  'UK': { iata: 'UK', name: 'Vistara', alliance: null, country: 'India' },
  'SG': { iata: 'SG', name: 'SpiceJet', alliance: null, country: 'India' },
  'BT': { iata: 'BT', name: 'airBaltic', alliance: null, country: 'Latvia' },
  'DY': { iata: 'DY', name: 'Norwegian Air Shuttle', alliance: null, country: 'Norway' },
  'W6': { iata: 'W6', name: 'Wizz Air', alliance: null, country: 'Hungary' },
  'FR': { iata: 'FR', name: 'Ryanair', alliance: null, country: 'Ireland' },
  'U2': { iata: 'U2', name: 'easyJet', alliance: null, country: 'United Kingdom' },
  'LS': { iata: 'LS', name: 'Jet2.com', alliance: null, country: 'United Kingdom' },
  'VY': { iata: 'VY', name: 'Vueling', alliance: null, country: 'Spain' },
  'I2': { iata: 'I2', name: 'Iberia Express', alliance: null, country: 'Spain' },
  'NT': { iata: 'NT', name: 'Binter Canarias', alliance: null, country: 'Spain' },
};

/**
 * Get alliance for an airline by IATA code
 */
export function getAirlineAlliance(iataCode: string): AllianceName {
  return AIRLINE_ALLIANCES[iataCode.toUpperCase()] || null;
}

/**
 * Get all airlines in an alliance
 */
export function getAirlinesByAlliance(alliance: AllianceName): string[] {
  return Object.entries(AIRLINE_ALLIANCES)
    .filter(([_, allianceName]) => allianceName === alliance)
    .map(([iataCode]) => iataCode);
}

/**
 * Get all available alliances
 */
export function getAllAlliances(): AllianceName[] {
  return ['Star Alliance', 'SkyTeam', 'Oneworld'];
}

/**
 * Get full airline information by IATA code
 */
export function getAirlineInfo(iataCode: string): AirlineInfo | null {
  return AIRLINE_DATABASE[iataCode.toUpperCase()] || null;
}

/**
 * Get airline name by IATA code
 */
export function getAirlineName(iataCode: string): string {
  const info = getAirlineInfo(iataCode);
  return info?.name || iataCode;
}

/**
 * Get all airlines (with full information)
 */
export function getAllAirlines(): AirlineInfo[] {
  return Object.values(AIRLINE_DATABASE);
}

/**
 * Get airlines by alliance (with full information)
 */
export function getAirlineInfoByAlliance(alliance: AllianceName): AirlineInfo[] {
  return Object.values(AIRLINE_DATABASE).filter(
    (airline) => airline.alliance === alliance
  );
}

/**
 * Search airlines by name or IATA code
 */
export function searchAirlines(query: string): AirlineInfo[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(AIRLINE_DATABASE).filter(
    (airline) =>
      airline.name.toLowerCase().includes(lowerQuery) ||
      airline.iata.toLowerCase().includes(lowerQuery) ||
      airline.country.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get alliance statistics
 */
export function getAllianceStats(): Record<string, { count: number; airlines: string[] }> {
  const stats: Record<string, { count: number; airlines: string[] }> = {
    'Star Alliance': { count: 0, airlines: [] },
    'SkyTeam': { count: 0, airlines: [] },
    'Oneworld': { count: 0, airlines: [] },
    'Non-Alliance': { count: 0, airlines: [] },
  };

  Object.values(AIRLINE_DATABASE).forEach((airline) => {
    const key = airline.alliance || 'Non-Alliance';
    stats[key].count++;
    stats[key].airlines.push(airline.iata);
  });

  return stats;
}
