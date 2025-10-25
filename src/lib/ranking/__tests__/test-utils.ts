/**
 * Test Utilities for Holistic Scorer
 *
 * Provides mock data generators and helper functions for testing
 * the data utilization enhancements (Priorities 1-6)
 */

import type {
  CompleteFlightOption,
  FlightSegmentComplete,
  LayoverInfo,
  AirportFacilities,
  AirlineCharacteristics,
} from '../holistic-scorer';

/**
 * Mock airline characteristics data
 */
export const mockAirlines = {
  // Premium carriers with circadian-optimized lighting
  qatarAirways: {
    code: 'QR',
    name: 'Qatar Airways',
    serviceQuality: 9.5,
    onTimePerformance: 92,
    jetlagOptimizationScore: 9.0,
    providesAmenities: true,
    sleepKitQuality: 'premium' as const,
    lightingProtocols: 'circadian-optimized' as const,
  },
  emirates: {
    code: 'EK',
    name: 'Emirates',
    serviceQuality: 9.3,
    onTimePerformance: 90,
    jetlagOptimizationScore: 8.8,
    providesAmenities: true,
    sleepKitQuality: 'premium' as const,
    lightingProtocols: 'circadian-optimized' as const,
  },
  singaporeAirlines: {
    code: 'SQ',
    name: 'Singapore Airlines',
    serviceQuality: 9.6,
    onTimePerformance: 93,
    jetlagOptimizationScore: 9.2,
    providesAmenities: true,
    sleepKitQuality: 'premium' as const,
    lightingProtocols: 'circadian-optimized' as const,
  },

  // Legacy carriers with manual-dimming
  americanAirlines: {
    code: 'AA',
    name: 'American Airlines',
    serviceQuality: 7.5,
    onTimePerformance: 78,
    jetlagOptimizationScore: 6.0,
    providesAmenities: true,
    sleepKitQuality: 'basic' as const,
    lightingProtocols: 'manual-dimming' as const,
  },
  unitedAirlines: {
    code: 'UA',
    name: 'United Airlines',
    serviceQuality: 7.4,
    onTimePerformance: 76,
    jetlagOptimizationScore: 5.8,
    providesAmenities: true,
    sleepKitQuality: 'basic' as const,
    lightingProtocols: 'manual-dimming' as const,
  },
  britishAirways: {
    code: 'BA',
    name: 'British Airways',
    serviceQuality: 8.0,
    onTimePerformance: 81,
    jetlagOptimizationScore: 6.5,
    providesAmenities: true,
    sleepKitQuality: 'basic' as const,
    lightingProtocols: 'manual-dimming' as const,
  },

  // Budget carriers without advanced lighting
  spirit: {
    code: 'NK',
    name: 'Spirit Airlines',
    serviceQuality: 5.5,
    onTimePerformance: 68,
    jetlagOptimizationScore: 3.0,
    providesAmenities: false,
    sleepKitQuality: 'none' as const,
    lightingProtocols: 'none' as const,
  },
  ryanair: {
    code: 'FR',
    name: 'Ryanair',
    serviceQuality: 5.8,
    onTimePerformance: 85,
    jetlagOptimizationScore: 3.2,
    providesAmenities: false,
    sleepKitQuality: 'none' as const,
    lightingProtocols: 'none' as const,
  },
};

/**
 * Mock airport facilities data
 */
export const mockAirportFacilities = {
  // Premium hub with all features
  doha: {
    airport: 'DOH',
    sleepPods: true,
    showers: true,
    gym: true,
    outdoorAccess: true,
    outdoorAccessRequiresResecurity: false, // Premium hub - no resecurity needed
    quietZones: true,
    loungeAccess: true,
    facilityHours: JSON.stringify({
      sleepPods: { open: '00:00', close: '23:59' },
      showers: { open: '05:00', close: '23:00' },
      gym: { open: '06:00', close: '22:00' },
      outdoorAccess: { open: '00:00', close: '23:59' },
    }),
    peakCongestionHours: JSON.stringify({
      morning: { start: '06:00', end: '09:00', severity: 'high' },
      evening: { start: '16:00', end: '19:00', severity: 'high' },
    }),
    noiseLevel: 'quiet' as const,
  },

  // Major hub with resecurity required
  lax: {
    airport: 'LAX',
    sleepPods: true,
    showers: true,
    gym: true,
    outdoorAccess: true,
    outdoorAccessRequiresResecurity: true, // US airport - requires resecurity
    quietZones: true,
    loungeAccess: true,
    facilityHours: JSON.stringify({
      sleepPods: { open: '00:00', close: '23:59' },
      showers: { open: '06:00', close: '22:00' },
      gym: { open: '06:00', close: '21:00' },
      outdoorAccess: { open: '00:00', close: '23:59' },
    }),
    peakCongestionHours: JSON.stringify({
      morning: { start: '06:00', end: '09:00', severity: 'high' },
      midday: { start: '11:00', end: '14:00', severity: 'medium' },
      evening: { start: '16:00', end: '19:00', severity: 'high' },
    }),
    noiseLevel: 'moderate' as const,
  },

  // Regional airport with limited facilities
  regional: {
    airport: 'SMF',
    sleepPods: false,
    showers: false,
    gym: false,
    outdoorAccess: false,
    outdoorAccessRequiresResecurity: undefined,
    quietZones: false,
    loungeAccess: true,
    facilityHours: undefined, // No facility hours data
    peakCongestionHours: undefined, // No congestion data
    noiseLevel: 'quiet' as const,
  },

  // 24/7 facilities
  dubai: {
    airport: 'DXB',
    sleepPods: true,
    showers: true,
    gym: true,
    outdoorAccess: false,
    outdoorAccessRequiresResecurity: undefined,
    quietZones: true,
    loungeAccess: true,
    facilityHours: JSON.stringify({
      sleepPods: { open: '00:00', close: '23:59' },
      showers: { open: '00:00', close: '23:59' },
      gym: { open: '00:00', close: '23:59' },
    }),
    peakCongestionHours: JSON.stringify({
      morning: { start: '06:00', end: '09:00', severity: 'medium' },
      evening: { start: '16:00', end: '19:00', severity: 'medium' },
    }),
    noiseLevel: 'moderate' as const,
  },

  // Closed overnight
  jfk: {
    airport: 'JFK',
    sleepPods: true,
    showers: true,
    gym: true,
    outdoorAccess: true,
    outdoorAccessRequiresResecurity: true,
    quietZones: true,
    loungeAccess: true,
    facilityHours: JSON.stringify({
      sleepPods: { open: '05:00', close: '23:00' }, // Closed overnight
      showers: { open: '06:00', close: '22:00' },
      gym: { open: '07:00', close: '21:00' },
      outdoorAccess: { open: '00:00', close: '23:59' },
    }),
    peakCongestionHours: JSON.stringify({
      morning: { start: '06:00', end: '09:00', severity: 'high' },
      evening: { start: '16:00', end: '19:00', severity: 'high' },
    }),
    noiseLevel: 'loud' as const,
  },
};

/**
 * Create a mock flight segment
 */
export function createMockSegment(overrides: Partial<FlightSegmentComplete> = {}): FlightSegmentComplete {
  return {
    airline: mockAirlines.qatarAirways,
    aircraft: {
      type: 'Boeing 777-300ER',
      manufacturer: 'Boeing',
      generation: 'modern',
      sleepScore: 8.5,
      cabinPressure: 6500,
      cabinHumidity: 16,
      noiseLevel: 72,
      seatPitch: 34,
      windowSize: 150,
    },
    origin: 'SFO',
    destination: 'DOH',
    originTimezone: 'America/Los_Angeles',
    destinationTimezone: 'Asia/Qatar',
    flightNumber: 'QR738',
    departureTime: new Date('2025-11-15T14:00:00-08:00'),
    arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
    durationMinutes: 15.5 * 60,
    cabinClass: 'economy',
    ...overrides,
  };
}

/**
 * Create a mock layover
 */
export function createMockLayover(overrides: Partial<LayoverInfo> = {}): LayoverInfo {
  const arrivalTime = new Date('2025-11-16T18:00:00+03:00');
  const departureTime = new Date('2025-11-16T21:00:00+03:00');

  return {
    airport: 'DOH',
    durationMinutes: 180, // 3 hours
    arrivalTime,
    departureTime,
    facilities: mockAirportFacilities.doha,
    airportQualityScore: 95,
    recommendedLayoverDurationHours: 3, // Matches actual duration
    ...overrides,
  };
}

/**
 * Create a complete mock flight for testing
 */
export function createMockFlight(overrides: Partial<CompleteFlightOption> = {}): CompleteFlightOption {
  return {
    id: 'test-flight-123',
    origin: 'SFO',
    destination: 'DXB',
    totalDurationMinutes: 20 * 60,
    stops: 1,
    segments: [
      createMockSegment({
        origin: 'SFO',
        destination: 'DOH',
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Qatar',
        flightNumber: 'QR738',
        departureTime: new Date('2025-11-15T14:00:00-08:00'),
        arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
        durationMinutes: 15.5 * 60,
      }),
      createMockSegment({
        origin: 'DOH',
        destination: 'DXB',
        originTimezone: 'Asia/Qatar',
        destinationTimezone: 'Asia/Dubai',
        flightNumber: 'QR1012',
        airline: mockAirlines.qatarAirways,
        departureTime: new Date('2025-11-16T21:00:00+03:00'),
        arrivalTime: new Date('2025-11-17T02:00:00+04:00'),
        durationMinutes: 1 * 60,
      }),
    ],
    layovers: [
      createMockLayover({
        airport: 'DOH',
        arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
        departureTime: new Date('2025-11-16T21:00:00+03:00'),
        durationMinutes: 180,
      }),
    ],
    price: 850,
    currency: 'USD',
    ...overrides,
  };
}

/**
 * Create a direct flight (no layovers)
 */
export function createDirectFlight(overrides: Partial<CompleteFlightOption> = {}): CompleteFlightOption {
  return {
    id: 'test-flight-direct',
    origin: 'SFO',
    destination: 'DOH',
    totalDurationMinutes: 15.5 * 60,
    stops: 0,
    segments: [
      createMockSegment({
        origin: 'SFO',
        destination: 'DOH',
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Qatar',
        flightNumber: 'QR738',
      }),
    ],
    layovers: [],
    price: 950,
    currency: 'USD',
    ...overrides,
  };
}

/**
 * Create a flight with specific layover timing for testing light exposure
 */
export function createFlightWithLayoverAt(
  layoverHour: number,
  direction: 'east' | 'west'
): CompleteFlightOption {
  const layoverDate = new Date('2025-11-16T00:00:00+00:00');
  layoverDate.setUTCHours(layoverHour);

  const arrivalTime = new Date(layoverDate.getTime() - 60 * 60 * 1000); // 1 hour before
  const departureTime = new Date(layoverDate.getTime() + 60 * 60 * 1000); // 1 hour after

  const origin = direction === 'east' ? 'SFO' : 'DXB';
  const destination = direction === 'east' ? 'DXB' : 'SFO';

  return createMockFlight({
    origin,
    destination,
    layovers: [
      createMockLayover({
        airport: 'DOH',
        arrivalTime,
        departureTime,
        durationMinutes: 120,
        facilities: {
          ...mockAirportFacilities.doha,
          outdoorAccess: true,
        },
      }),
    ],
  });
}

/**
 * Helper to create a layover during peak congestion hours
 */
export function createPeakHourLayover(
  startHour: number,
  durationHours: number
): LayoverInfo {
  const arrivalTime = new Date('2025-11-16T00:00:00+03:00');
  arrivalTime.setHours(startHour);

  const departureTime = new Date(arrivalTime);
  departureTime.setHours(startHour + durationHours);

  return createMockLayover({
    arrivalTime,
    departureTime,
    durationMinutes: durationHours * 60,
    facilities: mockAirportFacilities.lax,
  });
}

/**
 * Helper to create a layover with specific duration vs recommended
 */
export function createLayoverWithDuration(
  actualHours: number,
  recommendedHours: number
): LayoverInfo {
  const arrivalTime = new Date('2025-11-16T10:00:00+03:00');
  const departureTime = new Date(arrivalTime);
  departureTime.setHours(arrivalTime.getHours() + actualHours);

  return createMockLayover({
    arrivalTime,
    departureTime,
    durationMinutes: actualHours * 60,
    recommendedLayoverDurationHours: recommendedHours,
  });
}
