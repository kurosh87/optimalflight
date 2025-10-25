/**
 * Carbon Footprint Calculator for Aviation
 * Based on ICAO (International Civil Aviation Organization) methodology
 * and industry standards for aviation carbon emissions
 */

// Average emissions factors (kg CO2 per km per passenger)
const EMISSION_FACTORS = {
  // Short-haul (< 1500 km)
  shortHaul: {
    economy: 0.133, // kg CO2/km
    premiumEconomy: 0.200,
    business: 0.266,
    first: 0.532,
  },
  // Medium-haul (1500 - 4000 km)
  mediumHaul: {
    economy: 0.105,
    premiumEconomy: 0.158,
    business: 0.210,
    first: 0.420,
  },
  // Long-haul (> 4000 km)
  longHaul: {
    economy: 0.095,
    premiumEconomy: 0.143,
    business: 0.190,
    first: 0.380,
  },
};

// Aircraft type multipliers (relative to average)
const AIRCRAFT_MULTIPLIERS: Record<string, number> = {
  // Regional jets
  "CRJ": 1.15,
  "ERJ": 1.15,
  "E170": 1.12,
  "E175": 1.12,
  "E190": 1.10,
  "E195": 1.10,

  // Narrow-body (most efficient)
  "A220": 0.85,
  "A320": 0.95,
  "A321": 0.93,
  "737": 0.98,
  "737 MAX": 0.90,

  // Wide-body
  "A330": 1.02,
  "A340": 1.15,
  "A350": 0.88,
  "A380": 1.20,
  "777": 1.00,
  "787": 0.85,

  // Default
  "default": 1.00,
};

export interface CarbonFootprint {
  totalKg: number;
  totalTons: number;
  perPassengerKg: number;
  distanceKm: number;
  cabinClass: string;
  aircraftType?: string;
  equivalents: {
    treesNeeded: number; // Number of trees needed to offset for 1 year
    carsKm: number; // Equivalent km driven in average car
    homeEnergyDays: number; // Days of average home energy use
  };
}

/**
 * Calculate carbon footprint for a flight
 */
export function calculateFlightCarbon(
  distanceKm: number,
  cabinClass: "economy" | "premiumEconomy" | "business" | "first" = "economy",
  aircraftType?: string
): CarbonFootprint {
  // Determine flight category
  let emissionFactor: number;
  if (distanceKm < 1500) {
    emissionFactor = EMISSION_FACTORS.shortHaul[cabinClass];
  } else if (distanceKm < 4000) {
    emissionFactor = EMISSION_FACTORS.mediumHaul[cabinClass];
  } else {
    emissionFactor = EMISSION_FACTORS.longHaul[cabinClass];
  }

  // Apply aircraft type multiplier
  let aircraftMultiplier = 1.0;
  if (aircraftType) {
    // Try to find matching aircraft type
    const typeKey = Object.keys(AIRCRAFT_MULTIPLIERS).find((key) =>
      aircraftType.toUpperCase().includes(key)
    );
    aircraftMultiplier = typeKey
      ? AIRCRAFT_MULTIPLIERS[typeKey]
      : AIRCRAFT_MULTIPLIERS.default;
  }

  // Calculate total emissions
  const perPassengerKg = distanceKm * emissionFactor * aircraftMultiplier;
  const totalKg = perPassengerKg;
  const totalTons = totalKg / 1000;

  // Calculate equivalents
  const treesNeeded = Math.ceil(totalKg / 21.77); // One tree absorbs ~21.77 kg CO2/year
  const carsKm = Math.round(totalKg / 0.171); // Average car emits 171g CO2/km
  const homeEnergyDays = Math.round(totalKg / 28.8); // Average home: ~28.8 kg CO2/day

  return {
    totalKg,
    totalTons,
    perPassengerKg,
    distanceKm,
    cabinClass,
    aircraftType,
    equivalents: {
      treesNeeded,
      carsKm,
      homeEnergyDays,
    },
  };
}

/**
 * Calculate total carbon footprint for multiple flights
 */
export function calculateTotalCarbon(
  flights: Array<{
    distanceKm: number;
    cabinClass?: "economy" | "premiumEconomy" | "business" | "first";
    aircraftType?: string;
  }>
): {
  totalKg: number;
  totalTons: number;
  averagePerFlight: number;
  equivalents: {
    treesNeeded: number;
    carsKm: number;
    homeEnergyDays: number;
  };
} {
  let totalKg = 0;

  for (const flight of flights) {
    const carbon = calculateFlightCarbon(
      flight.distanceKm,
      flight.cabinClass || "economy",
      flight.aircraftType
    );
    totalKg += carbon.totalKg;
  }

  const totalTons = totalKg / 1000;
  const averagePerFlight = flights.length > 0 ? totalKg / flights.length : 0;

  return {
    totalKg,
    totalTons,
    averagePerFlight,
    equivalents: {
      treesNeeded: Math.ceil(totalKg / 21.77),
      carsKm: Math.round(totalKg / 0.171),
      homeEnergyDays: Math.round(totalKg / 28.8),
    },
  };
}

/**
 * Get carbon offset price estimate (in USD)
 */
export function getOffsetPrice(carbonTons: number): {
  low: number;
  average: number;
  high: number;
} {
  // Carbon offset prices typically range from $10-$50 per ton
  const lowPrice = 10;
  const avgPrice = 25;
  const highPrice = 50;

  return {
    low: Math.round(carbonTons * lowPrice * 100) / 100,
    average: Math.round(carbonTons * avgPrice * 100) / 100,
    high: Math.round(carbonTons * highPrice * 100) / 100,
  };
}

/**
 * Get recommendations for reducing carbon footprint
 */
export function getCarbonReductions(): string[] {
  return [
    "Fly economy class when possible - business class has 3x the footprint",
    "Choose direct flights to avoid extra takeoffs and landings",
    "Select newer aircraft models (787, A350, A220) which are 20% more efficient",
    "Pack light - every kg of weight increases fuel consumption",
    "Choose airlines with carbon offset programs",
    "Consider high-speed rail for distances under 1000 km",
  ];
}
