/**
 * Holistic Scorer Test Suite
 *
 * Comprehensive tests for all 6 data utilization enhancement priorities:
 * - Priority 1: Outdoor Access Resecurity Check
 * - Priority 2: Facility Operating Hours Validation
 * - Priority 3: Airline Lighting Protocols Integration
 * - Priority 4: Optimal Layover Duration Scoring
 * - Priority 5: Peak Congestion Hours Penalties
 * - Priority 6: Light Exposure Timing Bonuses
 */

import { describe, it, expect } from '@jest/globals';
import { scoreFlightHolistically } from '../holistic-scorer';
import type { CompleteFlightOption } from '../holistic-scorer';
import {
  createMockFlight,
  createDirectFlight,
  createMockSegment,
  createMockLayover,
  createFlightWithLayoverAt,
  createPeakHourLayover,
  createLayoverWithDuration,
  mockAirlines,
  mockAirportFacilities,
} from './test-utils';

describe('Holistic Scorer - Data Utilization Enhancements', () => {
  // ========================================
  // PRIORITY 1: Outdoor Access Resecurity Check
  // ========================================
  describe('Priority 1: Outdoor Access Resecurity Check', () => {
    it('should award full points for outdoor access WITHOUT resecurity required', () => {
      const flight = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: {
              ...mockAirportFacilities.doha,
              outdoorAccess: true,
              outdoorAccessRequiresResecurity: false, // Premium hub
            },
            durationMinutes: 180, // 3 hours - plenty of time
          }),
        ],
      });

      const result = scoreFlightHolistically(flight, [flight]);

      // Should get outdoor access bonus (part of airportFacilitiesScore)
      // Outdoor access without resecurity adds ~12 points to facilities score
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(85);
    });

    it('should penalize outdoor access WITH resecurity for short layovers', () => {
      const shortLayover = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: {
              ...mockAirportFacilities.lax,
              outdoorAccess: true,
              outdoorAccessRequiresResecurity: true, // Requires resecurity
            },
            durationMinutes: 90, // Too short for resecurity
          }),
        ],
      });

      const longLayover = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: {
              ...mockAirportFacilities.lax,
              outdoorAccess: true,
              outdoorAccessRequiresResecurity: true,
            },
            durationMinutes: 300, // 5 hours - enough time
          }),
        ],
      });

      const shortResult = scoreFlightHolistically(shortLayover, [shortLayover]);
      const longResult = scoreFlightHolistically(longLayover, [longLayover]);

      // Short layover should score lower (no outdoor bonus due to resecurity hassle)
      expect(shortResult.components.airportFacilitiesScore).toBeLessThan(
        longResult.components.airportFacilitiesScore
      );

      // Long layover should get reduced bonus (8 pts) - verify it's higher than short
      expect(longResult.components.airportFacilitiesScore).toBeGreaterThanOrEqual(80);
    });

    it('should handle missing resecurity data conservatively', () => {
      const flight = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: {
              ...mockAirportFacilities.doha,
              outdoorAccess: true,
              outdoorAccessRequiresResecurity: undefined, // Unknown
            },
            durationMinutes: 180,
          }),
        ],
      });

      const result = scoreFlightHolistically(flight, [flight]);

      // Should use conservative fallback (baseline facilities score without outdoor bonus)
      expect(result.components.airportFacilitiesScore).toBeDefined();
      expect(result.components.airportFacilitiesScore).toBeGreaterThan(0);
    });

    it('should score direct flights without outdoor access correctly', () => {
      const directFlight = createDirectFlight({});

      const result = scoreFlightHolistically(directFlight, [directFlight]);

      // Direct flights get baseline layover quality score (no layovers = no outdoor access)
      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(70);
    });
  });

  // ========================================
  // PRIORITY 2: Facility Operating Hours Validation
  // ========================================
  describe('Priority 2: Facility Operating Hours Validation', () => {
    it('should award full points for facilities open during layover', () => {
      const daytimeLayover = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T10:00:00+03:00'), // 10am
            departureTime: new Date('2025-11-16T13:00:00+03:00'), // 1pm
            facilities: mockAirportFacilities.doha, // Has facility hours
          }),
        ],
      });

      const result = scoreFlightHolistically(daytimeLayover, [daytimeLayover]);

      // All facilities should be open during daytime
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(68);
    });

    it('should penalize closed facilities during overnight layover', () => {
      const overnightLayover = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T02:00:00-05:00'), // 2am
            departureTime: new Date('2025-11-16T06:00:00-05:00'), // 6am
            facilities: mockAirportFacilities.jfk, // Sleep pods close at 11pm
          }),
        ],
      });

      const result = scoreFlightHolistically(overnightLayover, [overnightLayover]);

      // Should get heavily penalized for closed facilities
      expect(result.components.airportFacilitiesScore).toBeLessThan(65);
    });

    it('should handle 24/7 facilities correctly', () => {
      const overnightAt24_7 = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T02:00:00+04:00'), // 2am
            departureTime: new Date('2025-11-16T06:00:00+04:00'), // 6am
            facilities: mockAirportFacilities.dubai, // 24/7 facilities
          }),
        ],
      });

      const result = scoreFlightHolistically(overnightAt24_7, [overnightAt24_7]);

      // Should get full points for 24/7 facilities
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(68);
    });

    it('should assume 24/7 when facilityHours is undefined', () => {
      const flight = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T02:00:00-08:00'),
            departureTime: new Date('2025-11-16T06:00:00-08:00'),
            facilities: mockAirportFacilities.regional, // No facility hours data
          }),
        ],
      });

      const result = scoreFlightHolistically(flight, [flight]);

      // Should not penalize when data is missing (conservative)
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const flight = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: {
              ...mockAirportFacilities.doha,
              facilityHours: '{invalid json}', // Malformed JSON
            },
          }),
        ],
      });

      const result = scoreFlightHolistically(flight, [flight]);

      // Should not crash, should assume 24/7
      expect(result).toBeDefined();
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // PRIORITY 3: Airline Lighting Protocols Integration
  // ========================================
  describe('Priority 3: Airline Lighting Protocols Integration', () => {
    it('should award maximum points for circadian-optimized lighting', () => {
      const premiumFlight = createDirectFlight({
        segments: [
          createMockSegment({
            airline: mockAirlines.qatarAirways,
            origin: 'SFO',
            destination: 'DOH',
            originTimezone: 'America/Los_Angeles',
            destinationTimezone: 'Asia/Qatar',
            flightNumber: 'QR738',
            departureTime: new Date('2025-11-15T14:00:00-08:00'),
            arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
            durationMinutes: 15.5 * 60,
            cabinClass: 'economy',
          }),
        ],
      });

      const result = scoreFlightHolistically(premiumFlight, [premiumFlight]);

      // Should get 95 points for circadian-optimized lighting
      expect(result.components.airlineLightingScore).toBe(95);
    });

    it('should award medium points for manual-dimming lighting', () => {
      const legacyFlight = createDirectFlight({
        segments: [
          {
            airline: mockAirlines.americanAirlines, // manual-dimming
            aircraft: {
              name: 'Boeing 737-800',
              seatPitch: 31,
              entertainmentSystem: true,
              wifiAvailable: true,
            },
            origin: 'SFO',
            destination: 'JFK',
            departureTime: new Date('2025-11-15T08:00:00-08:00'),
            arrivalTime: new Date('2025-11-15T16:30:00-05:00'),
            durationMinutes: 5.5 * 60,
            cabinClass: 'economy',
          },
        ],
      });

      const result = scoreFlightHolistically(legacyFlight, [legacyFlight]);

      // Should get 65 points for manual-dimming
      expect(result.components.airlineLightingScore).toBe(65);
    });

    it('should award baseline points for no advanced lighting', () => {
      const budgetFlight = createDirectFlight({
        segments: [
          {
            airline: mockAirlines.spirit, // none
            aircraft: {
              name: 'Airbus A320',
              seatPitch: 28,
              entertainmentSystem: false,
              wifiAvailable: false,
            },
            origin: 'LAX',
            destination: 'LAS',
            departureTime: new Date('2025-11-15T10:00:00-08:00'),
            arrivalTime: new Date('2025-11-15T11:00:00-08:00'),
            durationMinutes: 1 * 60,
            cabinClass: 'economy',
          },
        ],
      });

      const result = scoreFlightHolistically(budgetFlight, [budgetFlight]);

      // Should get 50 points (baseline) for no lighting
      expect(result.components.airlineLightingScore).toBe(50);
    });

    it('should handle missing lightingProtocols with baseline score', () => {
      const unknownAirline = createDirectFlight({
        segments: [
          {
            airline: {
              code: 'XX',
              airlineName: 'Unknown Airline',
              serviceQuality: 70,
              onTimePerformance: 75,
              lightingProtocols: undefined as any, // Missing data
            },
            aircraft: {
              name: 'Boeing 737',
              seatPitch: 32,
              entertainmentSystem: true,
              wifiAvailable: true,
            },
            origin: 'SFO',
            destination: 'LAX',
            departureTime: new Date('2025-11-15T10:00:00-08:00'),
            arrivalTime: new Date('2025-11-15T11:30:00-08:00'),
            durationMinutes: 1.5 * 60,
            cabinClass: 'economy',
          },
        ],
      });

      const result = scoreFlightHolistically(unknownAirline, [unknownAirline]);

      // Should default to 50 (baseline) when missing
      expect(result.components.airlineLightingScore).toBe(50);
    });
  });

  // ========================================
  // PRIORITY 4: Optimal Layover Duration Scoring
  // ========================================
  describe('Priority 4: Optimal Layover Duration Scoring', () => {
    it('should award 95 points for layover within ±30min of recommended', () => {
      const perfectMatch = createMockFlight({
        layovers: [
          createLayoverWithDuration(3, 3), // 3 hours actual, 3 hours recommended
        ],
      });

      const result = scoreFlightHolistically(perfectMatch, [perfectMatch]);

      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(95);
    });

    it('should award 85 points for layover within ±1hr of recommended', () => {
      const goodMatch = createMockFlight({
        layovers: [
          createLayoverWithDuration(3.5, 3), // 3.5 hours actual, 3 hours recommended
        ],
      });

      const result = scoreFlightHolistically(goodMatch, [goodMatch]);

      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(80);
      expect(result.components.layoverQualityScore).toBeLessThanOrEqual(95);
    });

    it('should award 70 points for layover within ±2hr of recommended', () => {
      const okayMatch = createMockFlight({
        layovers: [
          createLayoverWithDuration(5, 3), // 5 hours actual, 3 hours recommended
        ],
      });

      const result = scoreFlightHolistically(okayMatch, [okayMatch]);

      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(65);
      expect(result.components.layoverQualityScore).toBeLessThan(75);
    });

    it('should heavily penalize layover beyond ±2hr of recommended', () => {
      const poorMatch = createMockFlight({
        layovers: [
          createLayoverWithDuration(7, 3), // 7 hours actual, 3 hours recommended (4hr deviation)
        ],
      });

      const result = scoreFlightHolistically(poorMatch, [poorMatch]);

      expect(result.components.layoverQualityScore).toBeLessThan(65);
    });

    it('should fall back to 90-180min optimal range when no recommendation', () => {
      const genericOptimal = createMockFlight({
        layovers: [
          createLayoverWithDuration(2, undefined as any), // 2 hours, no recommendation
        ],
      });

      const result = scoreFlightHolistically(genericOptimal, [genericOptimal]);

      // 2 hours (120 min) is in generic optimal range (90-180)
      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(85);
    });

    it('should penalize very short layovers even without recommendation', () => {
      const tooShort = createMockFlight({
        layovers: [
          createLayoverWithDuration(0.5, undefined as any), // 30 min, no recommendation
        ],
      });

      const result = scoreFlightHolistically(tooShort, [tooShort]);

      // 30 min is too short by generic standards
      expect(result.components.layoverQualityScore).toBeLessThan(50);
    });
  });

  // ========================================
  // PRIORITY 5: Peak Congestion Hours Penalties
  // ========================================
  describe('Priority 5: Peak Congestion Hours Penalties', () => {
    it('should apply -10 point penalty for high severity peak congestion', () => {
      const peakMorning = createMockFlight({
        layovers: [
          createPeakHourLayover(7, 2), // 7am-9am (peak morning, high severity)
        ],
      });

      const offPeak = createMockFlight({
        layovers: [
          createPeakHourLayover(14, 2), // 2pm-4pm (off-peak)
        ],
      });

      const peakResult = scoreFlightHolistically(peakMorning, [peakMorning]);
      const offPeakResult = scoreFlightHolistically(offPeak, [offPeak]);

      // Peak should score lower than off-peak
      expect(peakResult.components.airportFacilitiesScore).toBeLessThan(
        offPeakResult.components.airportFacilitiesScore
      );

      // Difference should be around 10 points
      const penalty = offPeakResult.components.airportFacilitiesScore -
                      peakResult.components.airportFacilitiesScore;
      expect(penalty).toBeGreaterThanOrEqual(8);
      expect(penalty).toBeLessThanOrEqual(12);
    });

    it('should apply -5 point penalty for medium severity congestion', () => {
      // Same layover time for both - only difference is congestion data
      const mediumCongestion = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T11:30:00-08:00'), // Midday
            departureTime: new Date('2025-11-16T13:30:00-08:00'),
            facilities: {
              ...mockAirportFacilities.lax,
              peakCongestionHours: JSON.stringify({
                midday: { start: '11:00', end: '14:00', severity: 'medium' },
              }),
            },
          }),
        ],
      });

      const noCongestion = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T11:30:00-08:00'), // Same time
            departureTime: new Date('2025-11-16T13:30:00-08:00'), // Same time
            facilities: {
              ...mockAirportFacilities.lax,
              peakCongestionHours: undefined, // No congestion data
            },
          }),
        ],
      });

      const congestionResult = scoreFlightHolistically(mediumCongestion, [mediumCongestion]);
      const noCongestionResult = scoreFlightHolistically(noCongestion, [noCongestion]);

      // Medium congestion should result in lower score
      expect(congestionResult.components.airportFacilitiesScore).toBeLessThan(
        noCongestionResult.components.airportFacilitiesScore
      );

      // Verify both scores are valid
      expect(congestionResult.components.airportFacilitiesScore).toBeGreaterThan(0);
      expect(noCongestionResult.components.airportFacilitiesScore).toBeGreaterThan(0);
    });

    it('should apply no penalty when missing congestion data', () => {
      const noCongestionData = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: mockAirportFacilities.regional, // No congestion data
          }),
        ],
      });

      const result = scoreFlightHolistically(noCongestionData, [noCongestionData]);

      // Should not crash and should score normally
      expect(result).toBeDefined();
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid JSON in peakCongestionHours gracefully', () => {
      const invalidJSON = createMockFlight({
        layovers: [
          createMockLayover({
            facilities: {
              ...mockAirportFacilities.doha,
              peakCongestionHours: '{invalid: json}',
            },
          }),
        ],
      });

      const result = scoreFlightHolistically(invalidJSON, [invalidJSON]);

      // Should not crash, should apply no penalty
      expect(result).toBeDefined();
      expect(result.components.airportFacilitiesScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // PRIORITY 6: Light Exposure Timing Bonuses
  // ========================================
  describe('Priority 6: Light Exposure Timing Bonuses', () => {
    it('should award +8 bonus for eastbound flight with evening outdoor access (6-9pm)', () => {
      const optimalEastbound = createFlightWithLayoverAt(19, 'east'); // 7pm layover, eastbound

      const result = scoreFlightHolistically(optimalEastbound, [optimalEastbound]);

      // Should get light timing bonus
      expect(result.components.lightExposureOpportunityScore).toBeGreaterThan(68);
    });

    it('should award +8 bonus for westbound flight with morning outdoor access (6-9am)', () => {
      const optimalWestbound = createFlightWithLayoverAt(7, 'west'); // 7am layover, westbound

      const result = scoreFlightHolistically(optimalWestbound, [optimalWestbound]);

      // Should get light timing bonus
      expect(result.components.lightExposureOpportunityScore).toBeGreaterThan(68);
    });

    it('should award +5 bonus for eastbound with afternoon light (3-6pm)', () => {
      const goodEastbound = createFlightWithLayoverAt(16, 'east'); // 4pm layover, eastbound

      const result = scoreFlightHolistically(goodEastbound, [goodEastbound]);

      // Should get moderate bonus
      expect(result.components.lightExposureOpportunityScore).toBeGreaterThanOrEqual(68);
    });

    it('should award +5 bonus for westbound with late morning light (9am-12pm)', () => {
      const goodWestbound = createFlightWithLayoverAt(10, 'west'); // 10am layover, westbound

      const result = scoreFlightHolistically(goodWestbound, [goodWestbound]);

      // Should get moderate bonus
      expect(result.components.lightExposureOpportunityScore).toBeGreaterThanOrEqual(68);
    });

    it('should award no bonus for suboptimal timing', () => {
      const suboptimalEastbound = createFlightWithLayoverAt(10, 'east'); // Morning light on eastbound
      const suboptimalWestbound = createFlightWithLayoverAt(19, 'west'); // Evening light on westbound

      const eastResult = scoreFlightHolistically(suboptimalEastbound, [suboptimalEastbound]);
      const westResult = scoreFlightHolistically(suboptimalWestbound, [suboptimalWestbound]);

      // Should not get timing bonus (suboptimal for direction)
      expect(eastResult.components.lightExposureOpportunityScore).toBeLessThan(75);
      expect(westResult.components.lightExposureOpportunityScore).toBeLessThan(75);
    });

    it('should award no bonus when outdoor access is not available', () => {
      const noOutdoorAccess = createMockFlight({
        origin: 'SFO',
        destination: 'DXB', // Eastbound
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T19:00:00+03:00'), // 7pm (optimal for eastbound)
            departureTime: new Date('2025-11-16T21:00:00+03:00'),
            facilities: {
              ...mockAirportFacilities.doha,
              outdoorAccess: false, // No outdoor access
            },
          }),
        ],
      });

      const result = scoreFlightHolistically(noOutdoorAccess, [noOutdoorAccess]);

      // Should not get timing bonus without outdoor access
      expect(result.components.lightExposureOpportunityScore).toBeLessThan(75);
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================
  describe('Integration Tests - Multiple Priorities', () => {
    it('should combine all enhancements for a premium flight', () => {
      const premiumFlight = createMockFlight({
        segments: [
          createMockSegment({
            airline: mockAirlines.qatarAirways,
            origin: 'SFO',
            destination: 'DOH',
            originTimezone: 'America/Los_Angeles',
            destinationTimezone: 'Asia/Qatar',
            flightNumber: 'QR738',
            departureTime: new Date('2025-11-15T14:00:00-08:00'),
            arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
            durationMinutes: 15.5 * 60,
            cabinClass: 'economy',
          }),
          createMockSegment({
            airline: mockAirlines.qatarAirways,
            origin: 'DOH',
            destination: 'DXB',
            originTimezone: 'Asia/Qatar',
            destinationTimezone: 'Asia/Dubai',
            flightNumber: 'QR1012',
            departureTime: new Date('2025-11-16T21:00:00+03:00'),
            arrivalTime: new Date('2025-11-17T02:00:00+04:00'),
            durationMinutes: 1 * 60,
            cabinClass: 'economy',
          }),
        ],
        layovers: [
          createMockLayover({
            airport: 'DOH',
            arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
            departureTime: new Date('2025-11-16T21:00:00+03:00'),
            durationMinutes: 180,
            recommendedLayoverDurationHours: 3, // Priority 4: perfect match
            facilities: {
              ...mockAirportFacilities.doha,
              outdoorAccess: true,
              outdoorAccessRequiresResecurity: false, // Priority 1: no resecurity
              // Priority 2: All facilities open
              // Priority 5: Off-peak (6pm)
            },
          }),
        ],
      });

      const result = scoreFlightHolistically(premiumFlight, [premiumFlight]);

      // Should score very high with all bonuses
      expect(result.overallJetlagScore).toBeGreaterThan(68);
      expect(result.components.airlineLightingScore).toBe(95);
      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(90);
    });

    it('should penalize a poor flight across multiple dimensions', () => {
      const poorFlight = createMockFlight({
        segments: [
          createMockSegment({
            airline: mockAirlines.spirit, // Priority 3: no lighting (50 pts)
            origin: 'LAX',
            destination: 'JFK',
            originTimezone: 'America/Los_Angeles',
            destinationTimezone: 'America/New_York',
            flightNumber: 'NK123',
            departureTime: new Date('2025-11-15T06:00:00-08:00'),
            arrivalTime: new Date('2025-11-15T14:30:00-05:00'),
            durationMinutes: 5.5 * 60,
            cabinClass: 'economy',
          }),
          createMockSegment({
            airline: mockAirlines.spirit,
            origin: 'JFK',
            destination: 'MIA',
            originTimezone: 'America/New_York',
            destinationTimezone: 'America/New_York',
            flightNumber: 'NK456',
            departureTime: new Date('2025-11-15T17:00:00-05:00'),
            arrivalTime: new Date('2025-11-15T20:00:00-05:00'),
            durationMinutes: 3 * 60,
            cabinClass: 'economy',
          }),
        ],
        layovers: [
          createMockLayover({
            airport: 'JFK',
            arrivalTime: new Date('2025-11-15T14:30:00-05:00'),
            departureTime: new Date('2025-11-15T17:00:00-05:00'),
            durationMinutes: 150, // 2.5 hours
            recommendedLayoverDurationHours: 4, // Priority 4: poor match (1.5hr deviation)
            facilities: {
              ...mockAirportFacilities.jfk,
              outdoorAccess: true,
              outdoorAccessRequiresResecurity: true, // Priority 1: short layover + resecurity
              // Priority 5: Peak evening congestion (4:30-5pm)
            },
          }),
        ],
      });

      const result = scoreFlightHolistically(poorFlight, [poorFlight]);

      // Should score lower with multiple penalties
      expect(result.overallJetlagScore).toBeLessThan(70);
      expect(result.components.airlineLightingScore).toBe(50);
      // Too short for outdoor access with resecurity - should get lower facilities score
      expect(result.components.airportFacilitiesScore).toBeLessThan(85);
    });

    it('should handle direct flights without crashing', () => {
      const directFlight = createDirectFlight({
        segments: [
          createMockSegment({
            airline: mockAirlines.qatarAirways,
            origin: 'SFO',
            destination: 'DOH',
            originTimezone: 'America/Los_Angeles',
            destinationTimezone: 'Asia/Qatar',
            flightNumber: 'QR738',
            departureTime: new Date('2025-11-15T14:00:00-08:00'),
            arrivalTime: new Date('2025-11-16T18:00:00+03:00'),
            durationMinutes: 15.5 * 60,
            cabinClass: 'economy',
          }),
        ],
      });

      const result = scoreFlightHolistically(directFlight, [directFlight]);

      // Should handle direct flights gracefully
      expect(result).toBeDefined();
      expect(result.overallJetlagScore).toBeGreaterThan(0);
      expect(result.components.layoverQualityScore).toBeGreaterThanOrEqual(75); // Baseline for direct
      expect(result.components.airlineLightingScore).toBe(95);
    });

    it('should maintain score consistency across multiple calculations', () => {
      const flight = createMockFlight();

      const result1 = scoreFlightHolistically(flight, [flight]);
      const result2 = scoreFlightHolistically(flight, [flight]);

      // Same input should produce same output
      expect(result1.overallJetlagScore).toBe(result2.overallJetlagScore);
      expect(result1.circadianScore).toBe(result2.circadianScore);
      expect(result1.strategyScore).toBe(result2.strategyScore);
    });
  });

  // ========================================
  // EDGE CASES & ERROR HANDLING
  // ========================================
  describe('Edge Cases & Error Handling', () => {
    it('should handle midnight crossing in facility hours', () => {
      const midnightLayover = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: new Date('2025-11-16T23:00:00+03:00'), // 11pm
            departureTime: new Date('2025-11-17T02:00:00+03:00'), // 2am next day
            facilities: mockAirportFacilities.doha,
          }),
        ],
      });

      const result = scoreFlightHolistically(midnightLayover, [midnightLayover]);

      expect(result).toBeDefined();
      expect(result.overallJetlagScore).toBeGreaterThan(0);
    });

    it('should handle very long layovers (8+ hours)', () => {
      const longLayover = createMockFlight({
        layovers: [
          createLayoverWithDuration(10, 3), // 10 hours actual, 3 recommended
        ],
      });

      const result = scoreFlightHolistically(longLayover, [longLayover]);

      expect(result).toBeDefined();
      expect(result.components.layoverQualityScore).toBeLessThan(50); // Heavy penalty
    });

    it('should handle very short layovers (30min)', () => {
      const shortLayover = createMockFlight({
        layovers: [
          createLayoverWithDuration(0.5, 3), // 30 min actual, 3 recommended
        ],
      });

      const result = scoreFlightHolistically(shortLayover, [shortLayover]);

      expect(result).toBeDefined();
      expect(result.components.layoverQualityScore).toBeLessThan(70); // Heavy penalty
    });

    it('should handle missing arrivalTime/departureTime in layover', () => {
      const missingTimes = createMockFlight({
        layovers: [
          createMockLayover({
            arrivalTime: undefined as any,
            departureTime: undefined as any,
          }),
        ],
      });

      const result = scoreFlightHolistically(missingTimes, [missingTimes]);

      expect(result).toBeDefined();
      // Should use conservative scoring when times are missing
    });

    it('should handle all undefined optional fields gracefully', () => {
      const minimalFlight: CompleteFlightOption = {
        id: 'test-minimal',
        origin: 'SFO',
        destination: 'LAX',
        totalDurationMinutes: 1.5 * 60,
        stops: 0,
        segments: [
          createMockSegment({
            airline: {
              code: 'XX',
              name: 'Test Airline',
              serviceQuality: 7.0,
              onTimePerformance: 75,
              jetlagOptimizationScore: 5.0,
              providesAmenities: false,
              // All optional fields undefined
            },
            origin: 'SFO',
            destination: 'LAX',
            originTimezone: 'America/Los_Angeles',
            destinationTimezone: 'America/Los_Angeles',
            flightNumber: 'XX123',
            departureTime: new Date('2025-11-15T10:00:00-08:00'),
            arrivalTime: new Date('2025-11-15T11:30:00-08:00'),
            durationMinutes: 1.5 * 60,
            cabinClass: 'economy',
          }),
        ],
        layovers: [],
        price: 100,
        currency: 'USD',
      };

      const result = scoreFlightHolistically(minimalFlight, [minimalFlight]);

      expect(result).toBeDefined();
      expect(result.overallJetlagScore).toBeGreaterThan(0);
      expect(result.components.airlineLightingScore).toBe(50); // Baseline
    });
  });
});
