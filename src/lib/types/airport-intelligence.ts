/**
 * Comprehensive TypeScript types for Airport Intelligence Data
 * Focused on jetlag recovery facilities and amenities
 */

// ============= Core Airport Intelligence =============
export interface AirportIntelligence {
  // Basic Info
  code: string;                    // IATA code (e.g., "LAX")
  name: string;                    // Full airport name
  city: string;
  country: string;
  timezone: string;                // IANA timezone (e.g., "America/Los_Angeles")

  // Terminal Structure
  terminals: Terminal[];

  // Jetlag Recovery Facilities (PRIORITY)
  recovery: JetlagRecoveryFacilities;

  // Light Exposure Opportunities (for circadian adjustment)
  lightExposure: LightExposureData;

  // Food & Beverage (nutrition timing matters for jetlag)
  dining: DiningData;

  // Lounges (rest and recovery)
  lounges: Lounge[];

  // Transportation
  transportation: TransportationData;

  // Services
  services: ServicesData;

  // Navigation & Accessibility
  navigation: NavigationData;

  // Metadata
  dataQuality: 'verified' | 'partial' | 'minimal';
  tierPriority?: 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';
  lastUpdated: string;             // ISO date
  sources: string[];               // URLs or references
}

// ============= Terminal Structure =============
export interface Terminal {
  code: string;                    // e.g., "T1", "Terminal 3"
  name: string;
  gates: string[];                 // e.g., ["A1-A25", "B1-B15"]
  connectedTo: string[];           // Connected terminal codes
  walkingMinutes?: number;         // To other terminals
}

// ============= Jetlag Recovery Facilities =============
export interface JetlagRecoveryFacilities {
  sleepPods: SleepPod[];
  quietZones: QuietZone[];
  showers: ShowerFacility[];
  gyms: GymFacility[];
  spas: SpaFacility[];
  meditationRooms: MeditationRoom[];
  outdoorAreas: OutdoorArea[];
}

export interface SleepPod {
  name: string;
  location: FacilityLocation;
  provider: string;                // e.g., "Minute Suites", "YOTEL"
  features: string[];              // ["blackout curtains", "adjustable lighting", "USB charging"]
  pricing: PricingInfo;
  availability: '24/7' | 'limited' | string;
  bookingRequired: boolean;
  bookingUrl?: string;
  jetlagBenefit: string;           // e.g., "Power nap facility for 20-90 min sleep cycles"
}

export interface QuietZone {
  location: FacilityLocation;
  features: string[];              // ["dim lighting", "comfortable seating", "no announcements"]
  capacity: 'small' | 'medium' | 'large';
  jetlagBenefit: string;
}

export interface ShowerFacility {
  name: string;
  location: FacilityLocation;
  pricing: {
    amount: number | null;
    currency: string;
    included: string[];            // e.g., ["towels", "toiletries", "hair dryer"]
  };
  hours: string;
  bookingRequired: boolean;
  jetlagBenefit: string;
}

export interface GymFacility {
  name: string;
  location: FacilityLocation;
  equipment: string[];             // ["treadmills", "weights", "yoga mats"]
  hours: string;
  access: 'free' | 'paid' | 'lounge-members';
  pricing?: {
    dayPass: number | null;
    currency: string;
  };
  showers: boolean;
  jetlagBenefit: string;
}

export interface SpaFacility {
  name: string;
  location: FacilityLocation;
  services: string[];              // ["massage", "facial", "foot treatment"]
  hours: string;
  bookingRecommended: boolean;
  priceRange: string;              // e.g., "$50-$200"
  jetlagBenefit: string;
}

export interface MeditationRoom {
  location: FacilityLocation;
  denomination?: string;           // "multi-faith" or specific
  features: string[];
  hours: string;
  jetlagBenefit: string;
}

export interface OutdoorArea {
  name: string;
  location: FacilityLocation;
  features: string[];              // ["seating", "smoking area", "gardens"]
  jetlagBenefit: string;
}

// ============= Light Exposure Data =============
export interface LightExposureData {
  naturalLightAreas: NaturalLightArea[];
  outdoorTerraces: OutdoorTerrace[];
  windowSeating: WindowSeatingArea[];
}

export interface NaturalLightArea {
  location: FacilityLocation;
  description: string;             // e.g., "Floor-to-ceiling windows facing east"
  bestTimeForSunlight: string;     // e.g., "morning" or "6AM-10AM"
  seatingAvailable: boolean;
}

export interface OutdoorTerrace {
  name: string;
  location: FacilityLocation;
  features: string[];
  jetlagBenefit: string;
}

export interface WindowSeatingArea {
  location: FacilityLocation;
  orientation: string;             // "east", "west", "south", "north"
  description: string;
}

// ============= Dining Data =============
export interface DiningData {
  restaurants: Restaurant[];
  cafes: Cafe[];
  healthyOptions: HealthyDining[];
  twentyFourHourOptions: Dining24Hour[];
}

export interface Restaurant {
  name: string;
  location: FacilityLocation;
  cuisine: string[];
  hours: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  healthyOptions: boolean;
  jetlagRelevance?: string;        // e.g., "High-protein breakfast options"
}

export interface Cafe {
  name: string;
  location: FacilityLocation;
  offerings: string[];             // ["coffee", "tea", "pastries", "sandwiches"]
  hours: string;
  priceRange: '$' | '$$';
}

export interface HealthyDining {
  name: string;
  location: FacilityLocation;
  specialties: string[];           // ["salads", "smoothies", "protein bowls"]
  hours: string;
  jetlagBenefit: string;
}

export interface Dining24Hour {
  name: string;
  location: FacilityLocation;
  type: 'restaurant' | 'cafe' | 'food-court' | 'convenience';
  offerings: string[];
}

// ============= Lounges =============
export interface Lounge {
  name: string;
  location: FacilityLocation;
  access: string[];                // ["Priority Pass", "Amex Platinum", "Business Class"]
  features: string[];              // ["showers", "quiet rooms", "hot meals", "alcohol"]
  hours: string;
  jetlagAmenities: string[];       // Subset of features relevant to recovery
}

// ============= Transportation =============
export interface TransportationData {
  interTerminal: InterTerminalTransport[];
  toCity: CityTransport[];
  nearbyHotels: NearbyHotel[];
  rentalCars: RentalCarInfo[];
}

export interface InterTerminalTransport {
  type: 'train' | 'bus' | 'shuttle' | 'walkway';
  name: string;
  duration: number;                // minutes
  frequency: string;               // e.g., "every 5 min"
  hours: string;
  cost: 'free' | number;
}

export interface CityTransport {
  type: 'train' | 'bus' | 'taxi' | 'shuttle' | 'metro' | 'bus/shuttle';
  name: string;
  toCityCenter: {
    duration: number;              // minutes
    frequency: string;             // e.g., "every 15 min"
    hours: string;
    pricing: {
      amount: number;
      currency: string;
    };
  };
  location: string;                // Where to find it in airport
}

export interface NearbyHotel {
  name: string;
  distance: {
    walking: number | null;        // minutes
    shuttle: boolean;
  };
  dayRooms: boolean;               // Important for layovers!
  transitHotel: boolean;           // Inside security
  features: string[];
  priceRange: string;
  jetlagRelevance: string;
}

export interface RentalCarInfo {
  location: string;
  providers: string[];
  hours: string;
}

// ============= Services =============
export interface ServicesData {
  pharmacy: PharmacyInfo[];
  medical: MedicalFacility[];
  wifi: WifiInfo;
  chargingStations: ChargingStation[];
  baggageStorage: BaggageStorage[];
  infoCenter: InfoCenter[];
}

export interface PharmacyInfo {
  name: string;
  location: FacilityLocation;
  hours: string;
  sellsMelatonin: boolean;         // CRITICAL for jetlag
  sellsCaffeine: boolean;
}

export interface MedicalFacility {
  name: string;
  location: FacilityLocation;
  services: string[];
  hours: string;
  emergencyAvailable: boolean;
}

export interface WifiInfo {
  free: boolean;
  timeLimit?: number;              // minutes
  registrationRequired: boolean;
  speed: 'slow' | 'moderate' | 'fast';
  coverage: 'full' | 'partial';
}

export interface ChargingStation {
  location: FacilityLocation;
  type: string[];                  // ["USB-A", "USB-C", "Wireless", "AC outlet"]
  cost: 'free' | number;
}

export interface BaggageStorage {
  location: FacilityLocation;
  provider: string;
  pricing: {
    hourly?: number;
    daily?: number;
    currency: string;
  };
  hours: string;
}

export interface InfoCenter {
  location: FacilityLocation;
  hours: string;
  services: string[];
}

// ============= Navigation =============
export interface NavigationData {
  walkingTimesBetweenTerminals: WalkingTime[];
  securityWaitTimes: SecurityInfo[];
  immigrationFacilities: ImmigrationInfo[];
}

export interface WalkingTime {
  from: string;
  to: string;
  minutes: number;
  accessible: boolean;             // Wheelchair accessible
}

export interface SecurityInfo {
  location: FacilityLocation;
  averageWaitMinutes: number | null;
  peakHours: string[];
  tsa_precheck?: boolean;
  clearAvailable?: boolean;
}

export interface ImmigrationInfo {
  location: FacilityLocation;
  services: string[];              // ["arrival", "departure", "transit"]
  averageWaitMinutes: number | null;
  globalEntryAvailable?: boolean;
}

// ============= Common Types =============
export interface FacilityLocation {
  terminal: string;
  area: string;                    // e.g., "Gate A15, near restrooms"
  postSecurity: boolean;
}

export interface PricingInfo {
  hourly: number | null;
  overnight: number | null;
  currency: string;
}

// ============= Airport Tier Classification =============
export const AIRPORT_TIERS = {
  TIER_1: 'tier_1', // >50M passengers/year - Ultra-high priority
  TIER_2: 'tier_2', // 20-50M passengers/year - High priority
  TIER_3: 'tier_3', // 10-20M passengers/year - Medium priority
  TIER_4: 'tier_4', // <10M passengers/year - Lower priority
} as const;

export const TIER_1_AIRPORTS = [
  'LHR', 'LAX', 'DXB', 'HND', 'ORD', 'CDG', 'JFK', 'NRT', 'SIN', 'ICN',
  'ATL', 'DEN', 'PEK', 'PVG', 'AMS', 'FRA', 'IST', 'DEL', 'BKK', 'LGW'
];

// ============= Validation Helpers =============
export function isValidDataQuality(quality: string): quality is 'verified' | 'partial' | 'minimal' {
  return ['verified', 'partial', 'minimal'].includes(quality);
}

export function isValidTier(tier: string): tier is 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4' {
  return ['tier_1', 'tier_2', 'tier_3', 'tier_4'].includes(tier);
}

export function calculateCompletenessScore(data: AirportIntelligence): number {
  let score = 0;
  const weights = {
    recovery: 30,      // Most important
    lightExposure: 15,
    dining: 15,
    lounges: 10,
    transportation: 10,
    services: 10,
    navigation: 10,
  };

  // Recovery facilities scoring
  if (data.recovery.sleepPods.length > 0) score += 10;
  if (data.recovery.gyms.length > 0) score += 8;
  if (data.recovery.quietZones.length > 0) score += 6;
  if (data.recovery.showers.length > 0) score += 6;

  // Light exposure scoring
  if (data.lightExposure.naturalLightAreas.length > 0) score += 8;
  if (data.lightExposure.outdoorTerraces.length > 0) score += 7;

  // Dining scoring
  if (data.dining.healthyOptions.length > 0) score += 8;
  if (data.dining.twentyFourHourOptions.length > 0) score += 7;

  // Lounges scoring
  if (data.lounges.length > 0) score += 10;

  // Transportation scoring
  if (data.transportation.toCity.length > 0) score += 5;
  if (data.transportation.nearbyHotels.length > 0) score += 5;

  // Services scoring
  if (data.services.pharmacy.length > 0) score += 5;
  if (data.services.wifi.free) score += 5;

  // Navigation scoring
  if (data.navigation.walkingTimesBetweenTerminals.length > 0) score += 10;

  return Math.min(100, score);
}
