/**
 * Flight Filtering and Sorting System
 *
 * UX-focused filtering to help users find their ideal flight based on:
 * - Budget constraints
 * - Time preferences
 * - Jetlag tolerance
 * - Cabin class
 * - Airlines/aircraft
 */

import { CompleteFlightOption } from './holistic-scorer';
import { HolisticFlightScore } from './holistic-scorer';

export interface FlightFilters {
  // Price filters
  maxPrice?: number;
  minPrice?: number;
  pricePercentile?: 'cheap' | 'mid' | 'expensive' | 'all'; // UX-friendly budget selector

  // Time filters
  maxDuration?: number; // Minutes
  maxStops?: number;
  directOnly?: boolean;

  // Timing preferences (UX: "I want to arrive in the morning")
  preferredArrivalTime?: {
    earliest: string; // "06:00"
    latest: string;   // "10:00"
  };
  preferredDepartureTime?: {
    earliest: string;
    latest: string;
  };

  // Jetlag filters
  minJetlagScore?: number;
  maxRecoveryDays?: number;

  // Cabin class
  cabinClasses?: Array<'economy' | 'premium_economy' | 'business' | 'first'>;

  // Airlines/Aircraft (UX: "I prefer these carriers")
  preferredAirlines?: string[]; // IATA codes
  excludedAirlines?: string[];
  modernAircraftOnly?: boolean; // Next-gen A350/B787 only

  // Layover preferences
  maxLayoverDuration?: number; // Minutes
  minLayoverDuration?: number;
}

export type SortOption =
  | 'jetlag-best'        // Highest jetlag score first
  | 'jetlag-worst'       // Lowest jetlag score first
  | 'price-low'          // Cheapest first
  | 'price-high'         // Most expensive first
  | 'duration-short'     // Shortest flight first
  | 'duration-long'      // Longest flight first
  | 'value-best'         // Best price/jetlag ratio
  | 'recovery-fast'      // Fastest recovery first
  | 'departure-early'    // Earliest departure first
  | 'departure-late'     // Latest departure first
  | 'arrival-early'      // Earliest arrival first
  | 'arrival-late';      // Latest arrival first

export interface FlightWithScore {
  flight: CompleteFlightOption;
  score: HolisticFlightScore;
  valueScore?: number; // Price vs jetlag value (0-100)
}

/**
 * Apply filters to flight list
 * Returns filtered flights + filter statistics for UX feedback
 */
export function applyFilters(
  flights: FlightWithScore[],
  filters: FlightFilters
): {
  filteredFlights: FlightWithScore[];
  stats: {
    originalCount: number;
    filteredCount: number;
    removedByFilter: {
      price?: number;
      duration?: number;
      stops?: number;
      timing?: number;
      jetlag?: number;
      cabin?: number;
      airline?: number;
    };
  };
} {
  const stats = {
    originalCount: flights.length,
    filteredCount: 0,
    removedByFilter: {} as any,
  };

  let filtered = [...flights];

  // Price filters
  if (filters.maxPrice !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => !f.flight.price || f.flight.price <= filters.maxPrice!);
    if (filtered.length < before) stats.removedByFilter.price = before - filtered.length;
  }

  if (filters.minPrice !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => !f.flight.price || f.flight.price >= filters.minPrice!);
    if (filtered.length < before) stats.removedByFilter.price = (stats.removedByFilter.price || 0) + (before - filtered.length);
  }

  // Price percentile (UX-friendly budget selector)
  if (filters.pricePercentile && filters.pricePercentile !== 'all') {
    const priced = filtered.filter(f => f.flight.price);
    if (priced.length > 0) {
      const prices = priced.map(f => f.flight.price!).sort((a, b) => a - b);

      let maxPriceForPercentile: number;
      switch (filters.pricePercentile) {
        case 'cheap':
          maxPriceForPercentile = prices[Math.floor(prices.length * 0.33)]; // Bottom 33%
          break;
        case 'mid':
          maxPriceForPercentile = prices[Math.floor(prices.length * 0.67)]; // Middle 33%
          const minPriceForPercentile = prices[Math.floor(prices.length * 0.33)];
          const before = filtered.length;
          filtered = filtered.filter(f =>
            !f.flight.price ||
            (f.flight.price >= minPriceForPercentile && f.flight.price <= maxPriceForPercentile)
          );
          if (filtered.length < before) stats.removedByFilter.price = (stats.removedByFilter.price || 0) + (before - filtered.length);
          break;
        case 'expensive':
          const minExpensive = prices[Math.floor(prices.length * 0.67)]; // Top 33%
          const beforeExp = filtered.length;
          filtered = filtered.filter(f => !f.flight.price || f.flight.price >= minExpensive);
          if (filtered.length < beforeExp) stats.removedByFilter.price = (stats.removedByFilter.price || 0) + (beforeExp - filtered.length);
          break;
      }
    }
  }

  // Duration filter
  if (filters.maxDuration !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => f.flight.totalDurationMinutes <= filters.maxDuration!);
    if (filtered.length < before) stats.removedByFilter.duration = before - filtered.length;
  }

  // Stops filter
  if (filters.directOnly) {
    const before = filtered.length;
    filtered = filtered.filter(f => f.flight.stops === 0);
    if (filtered.length < before) stats.removedByFilter.stops = before - filtered.length;
  } else if (filters.maxStops !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => f.flight.stops <= filters.maxStops!);
    if (filtered.length < before) stats.removedByFilter.stops = before - filtered.length;
  }

  // Arrival time preference
  if (filters.preferredArrivalTime) {
    const before = filtered.length;
    filtered = filtered.filter(f => {
      const lastSegment = f.flight.segments[f.flight.segments.length - 1];
      const arrivalHour = lastSegment.arrivalTime.getHours();
      const arrivalMinute = lastSegment.arrivalTime.getMinutes();
      const arrivalTime = arrivalHour * 60 + arrivalMinute;

      const [earliestH, earliestM] = filters.preferredArrivalTime!.earliest.split(':').map(Number);
      const [latestH, latestM] = filters.preferredArrivalTime!.latest.split(':').map(Number);
      const earliestTime = earliestH * 60 + earliestM;
      const latestTime = latestH * 60 + latestM;

      return arrivalTime >= earliestTime && arrivalTime <= latestTime;
    });
    if (filtered.length < before) stats.removedByFilter.timing = (stats.removedByFilter.timing || 0) + (before - filtered.length);
  }

  // Departure time preference
  if (filters.preferredDepartureTime) {
    const before = filtered.length;
    filtered = filtered.filter(f => {
      const firstSegment = f.flight.segments[0];
      const departureHour = firstSegment.departureTime.getHours();
      const departureMinute = firstSegment.departureTime.getMinutes();
      const departureTime = departureHour * 60 + departureMinute;

      const [earliestH, earliestM] = filters.preferredDepartureTime!.earliest.split(':').map(Number);
      const [latestH, latestM] = filters.preferredDepartureTime!.latest.split(':').map(Number);
      const earliestTime = earliestH * 60 + earliestM;
      const latestTime = latestH * 60 + latestM;

      return departureTime >= earliestTime && departureTime <= latestTime;
    });
    if (filtered.length < before) stats.removedByFilter.timing = (stats.removedByFilter.timing || 0) + (before - filtered.length);
  }

  // Jetlag filters
  if (filters.minJetlagScore !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => f.score.overallJetlagScore >= filters.minJetlagScore!);
    if (filtered.length < before) stats.removedByFilter.jetlag = before - filtered.length;
  }

  if (filters.maxRecoveryDays !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => f.score.estimatedRecoveryDays <= filters.maxRecoveryDays!);
    if (filtered.length < before) stats.removedByFilter.jetlag = (stats.removedByFilter.jetlag || 0) + (before - filtered.length);
  }

  // Cabin class filter
  if (filters.cabinClasses && filters.cabinClasses.length > 0) {
    const before = filtered.length;
    filtered = filtered.filter(f =>
      filters.cabinClasses!.includes(f.flight.segments[0].cabinClass)
    );
    if (filtered.length < before) stats.removedByFilter.cabin = before - filtered.length;
  }

  // Airline filters
  if (filters.preferredAirlines && filters.preferredAirlines.length > 0) {
    const before = filtered.length;
    filtered = filtered.filter(f =>
      f.flight.segments.some(seg => filters.preferredAirlines!.includes(seg.airline.code))
    );
    if (filtered.length < before) stats.removedByFilter.airline = before - filtered.length;
  }

  if (filters.excludedAirlines && filters.excludedAirlines.length > 0) {
    const before = filtered.length;
    filtered = filtered.filter(f =>
      !f.flight.segments.some(seg => filters.excludedAirlines!.includes(seg.airline.code))
    );
    if (filtered.length < before) stats.removedByFilter.airline = (stats.removedByFilter.airline || 0) + (before - filtered.length);
  }

  // Modern aircraft filter
  if (filters.modernAircraftOnly) {
    const before = filtered.length;
    filtered = filtered.filter(f =>
      f.flight.segments.every(seg => seg.aircraft.generation === 'next-gen' || seg.aircraft.generation === 'modern')
    );
    if (filtered.length < before) stats.removedByFilter.airline = (stats.removedByFilter.airline || 0) + (before - filtered.length);
  }

  // Layover duration filters
  if (filters.maxLayoverDuration !== undefined && filters.minLayoverDuration !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(f => {
      if (!f.flight.layovers || f.flight.layovers.length === 0) return true;
      return f.flight.layovers.every(l =>
        l.durationMinutes <= filters.maxLayoverDuration! &&
        l.durationMinutes >= filters.minLayoverDuration!
      );
    });
    if (filtered.length < before) stats.removedByFilter.duration = (stats.removedByFilter.duration || 0) + (before - filtered.length);
  }

  stats.filteredCount = filtered.length;

  return {
    filteredFlights: filtered,
    stats,
  };
}

/**
 * Sort flights by specified criterion
 */
export function sortFlights(
  flights: FlightWithScore[],
  sortBy: SortOption
): FlightWithScore[] {
  const sorted = [...flights];

  switch (sortBy) {
    case 'jetlag-best':
      return sorted.sort((a, b) => b.score.overallJetlagScore - a.score.overallJetlagScore);

    case 'jetlag-worst':
      return sorted.sort((a, b) => a.score.overallJetlagScore - b.score.overallJetlagScore);

    case 'price-low':
      return sorted.sort((a, b) => {
        if (!a.flight.price) return 1;
        if (!b.flight.price) return -1;
        return a.flight.price - b.flight.price;
      });

    case 'price-high':
      return sorted.sort((a, b) => {
        if (!a.flight.price) return 1;
        if (!b.flight.price) return -1;
        return b.flight.price - a.flight.price;
      });

    case 'duration-short':
      return sorted.sort((a, b) => a.flight.totalDurationMinutes - b.flight.totalDurationMinutes);

    case 'duration-long':
      return sorted.sort((a, b) => b.flight.totalDurationMinutes - a.flight.totalDurationMinutes);

    case 'value-best':
      return sorted.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));

    case 'recovery-fast':
      return sorted.sort((a, b) => a.score.estimatedRecoveryDays - b.score.estimatedRecoveryDays);

    case 'departure-early':
      return sorted.sort((a, b) => {
        const aTime = a.flight.segments[0].departureTime.getTime();
        const bTime = b.flight.segments[0].departureTime.getTime();
        return aTime - bTime;
      });

    case 'departure-late':
      return sorted.sort((a, b) => {
        const aTime = a.flight.segments[0].departureTime.getTime();
        const bTime = b.flight.segments[0].departureTime.getTime();
        return bTime - aTime;
      });

    case 'arrival-early':
      return sorted.sort((a, b) => {
        const aTime = a.flight.segments[a.flight.segments.length - 1].arrivalTime.getTime();
        const bTime = b.flight.segments[b.flight.segments.length - 1].arrivalTime.getTime();
        return aTime - bTime;
      });

    case 'arrival-late':
      return sorted.sort((a, b) => {
        const aTime = a.flight.segments[a.flight.segments.length - 1].arrivalTime.getTime();
        const bTime = b.flight.segments[b.flight.segments.length - 1].arrivalTime.getTime();
        return bTime - aTime;
      });

    default:
      return sorted;
  }
}

/**
 * Get smart filter suggestions based on flight data (UX helper)
 */
export function getFilterSuggestions(flights: FlightWithScore[]): {
  priceRanges: {
    budget: { min: number; max: number; label: string };
    moderate: { min: number; max: number; label: string };
    premium: { min: number; max: number; label: string };
  };
  durationRanges: {
    short: number; // <8 hours
    medium: number; // 8-15 hours
    long: number; // 15+ hours
  };
  popularAirlines: Array<{ code: string; name: string; count: number }>;
  availableCabinClasses: string[];
} {
  const priced = flights.filter(f => f.flight.price);
  const prices = priced.map(f => f.flight.price!).sort((a, b) => a - b);

  const p33 = prices[Math.floor(prices.length * 0.33)] || 0;
  const p67 = prices[Math.floor(prices.length * 0.67)] || 0;
  const max = prices[prices.length - 1] || 0;

  // Count airlines
  const airlineCounts = new Map<string, { code: string; name: string; count: number }>();
  flights.forEach(f => {
    f.flight.segments.forEach(seg => {
      const existing = airlineCounts.get(seg.airline.code);
      if (existing) {
        existing.count++;
      } else {
        airlineCounts.set(seg.airline.code, {
          code: seg.airline.code,
          name: seg.airline.name,
          count: 1,
        });
      }
    });
  });

  const popularAirlines = Array.from(airlineCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Available cabin classes
  const cabinClasses = new Set<string>();
  flights.forEach(f => {
    cabinClasses.add(f.flight.segments[0].cabinClass);
  });

  return {
    priceRanges: {
      budget: { min: 0, max: p33, label: `Under $${Math.round(p33)}` },
      moderate: { min: p33, max: p67, label: `$${Math.round(p33)} - $${Math.round(p67)}` },
      premium: { min: p67, max: max, label: `$${Math.round(p67)}+` },
    },
    durationRanges: {
      short: 8 * 60,
      medium: 15 * 60,
      long: Infinity,
    },
    popularAirlines,
    availableCabinClasses: Array.from(cabinClasses),
  };
}
