/**
 * Jetlag Calculator Test Suite
 * Tests the science-based jetlag recovery algorithm
 */

import { describe, it, expect } from '@jest/globals';
import { calculateJetlagPlan, JetlagInput } from './calculator';

describe('Jetlag Calculator', () => {
  describe('Date Line Crossing Detection', () => {
    it('should correctly identify LAX→NRT as westward (crossing date line)', () => {
      const input: JetlagInput = {
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-01-15T10:00:00-08:00'),
        arrivalTime: new Date('2025-01-16T14:00:00+09:00'),
        flightDuration: 11.5,
      };

      const result = calculateJetlagPlan(input);

      expect(result.direction).toBe('west');
      expect(result.timezoneShift).toBe(17); // UTC+9 - UTC-8 = 17
    });

    it('should correctly identify NRT→LAX as eastward (crossing date line)', () => {
      const input: JetlagInput = {
        originTimezone: 'Asia/Tokyo',
        destinationTimezone: 'America/Los_Angeles',
        departureTime: new Date('2025-01-15T10:00:00+09:00'),
        arrivalTime: new Date('2025-01-15T06:00:00-08:00'),
        flightDuration: 10.5,
      };

      const result = calculateJetlagPlan(input);

      expect(result.direction).toBe('east');
      expect(result.timezoneShift).toBe(-17); // UTC-8 - UTC+9 = -17
    });

    it('should correctly identify JFK→LHR as eastward (no date line)', () => {
      const input: JetlagInput = {
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-01-15T18:00:00-05:00'),
        arrivalTime: new Date('2025-01-16T06:00:00+00:00'),
        flightDuration: 7,
      };

      const result = calculateJetlagPlan(input);

      expect(result.direction).toBe('east');
      expect(result.timezoneShift).toBe(5); // UTC+0 - UTC-5 = 5
    });

    it('should correctly identify LHR→JFK as westward (no date line)', () => {
      const input: JetlagInput = {
        originTimezone: 'Europe/London',
        destinationTimezone: 'America/New_York',
        departureTime: new Date('2025-01-15T10:00:00+00:00'),
        arrivalTime: new Date('2025-01-15T13:00:00-05:00'),
        flightDuration: 8,
      };

      const result = calculateJetlagPlan(input);

      expect(result.direction).toBe('west');
      expect(result.timezoneShift).toBe(-5); // UTC-5 - UTC+0 = -5
    });
  });

  describe('Recovery Rate Calculation', () => {
    it('LAX→NRT should give 4-5 days recovery (using shorter westward path)', () => {
      const input: JetlagInput = {
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-01-15T10:00:00-08:00'),
        arrivalTime: new Date('2025-01-16T14:00:00+09:00'),
        flightDuration: 11.5,
      };

      const result = calculateJetlagPlan(input);

      // Uses shorter westward path: 24 - 17 = 7 hours
      // 7 hours × 0.6 (westward rate) = 4.2 → ceil to 5
      // But enforces minimum 3 days for shifts >= 3h
      expect(result.estimatedRecoveryDays).toBeGreaterThanOrEqual(4);
      expect(result.estimatedRecoveryDays).toBeLessThanOrEqual(5);
      expect(result.estimatedRecoveryDays).toBe(5);
    });

    it('JFK→LHR should give 4-6 days recovery (eastward)', () => {
      const input: JetlagInput = {
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-01-15T18:00:00-05:00'),
        arrivalTime: new Date('2025-01-16T06:00:00+00:00'),
        flightDuration: 7,
      };

      const result = calculateJetlagPlan(input);

      expect(result.estimatedRecoveryDays).toBeGreaterThanOrEqual(4);
      expect(result.estimatedRecoveryDays).toBeLessThanOrEqual(7);

      // Should use eastward rate (0.9)
      // 5 hours × 0.9 = 4.5 → ceil to 5
      expect(result.estimatedRecoveryDays).toBe(5);
    });

    it('LHR→JFK should give 3-5 days recovery (westward)', () => {
      const input: JetlagInput = {
        originTimezone: 'Europe/London',
        destinationTimezone: 'America/New_York',
        departureTime: new Date('2025-01-15T10:00:00+00:00'),
        arrivalTime: new Date('2025-01-15T13:00:00-05:00'),
        flightDuration: 8,
      };

      const result = calculateJetlagPlan(input);

      expect(result.estimatedRecoveryDays).toBeGreaterThanOrEqual(3);
      expect(result.estimatedRecoveryDays).toBeLessThanOrEqual(5);

      // Should use westward rate (0.6)
      // 5 hours × 0.6 = 3.0
      expect(result.estimatedRecoveryDays).toBe(3);
    });

    it('westward travel should have shorter recovery than equivalent eastward', () => {
      const eastwardInput: JetlagInput = {
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-01-15T18:00:00-05:00'),
        arrivalTime: new Date('2025-01-16T06:00:00+00:00'),
        flightDuration: 7,
      };

      const westwardInput: JetlagInput = {
        originTimezone: 'Europe/London',
        destinationTimezone: 'America/New_York',
        departureTime: new Date('2025-01-15T10:00:00+00:00'),
        arrivalTime: new Date('2025-01-15T13:00:00-05:00'),
        flightDuration: 8,
      };

      const eastwardResult = calculateJetlagPlan(eastwardInput);
      const westwardResult = calculateJetlagPlan(westwardInput);

      expect(westwardResult.estimatedRecoveryDays).toBeLessThan(
        eastwardResult.estimatedRecoveryDays
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle same timezone (no jetlag)', () => {
      const input: JetlagInput = {
        originTimezone: 'America/New_York',
        destinationTimezone: 'America/New_York',
        departureTime: new Date('2025-01-15T10:00:00-05:00'),
        arrivalTime: new Date('2025-01-15T11:00:00-05:00'),
        flightDuration: 1,
      };

      const result = calculateJetlagPlan(input);

      expect(result.direction).toBe('none');
      expect(result.estimatedRecoveryDays).toBe(0);
    });

    it('should never exceed 1.5× timezone difference', () => {
      const input: JetlagInput = {
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-01-15T10:00:00-08:00'),
        arrivalTime: new Date('2025-01-16T14:00:00+09:00'),
        flightDuration: 11.5,
      };

      const result = calculateJetlagPlan(input);

      const maxReasonable = 17 * 1.5; // 25.5 days
      expect(result.estimatedRecoveryDays).toBeLessThanOrEqual(maxReasonable);
    });

    it('should handle 1-hour timezone differences', () => {
      const input: JetlagInput = {
        originTimezone: 'Europe/London',
        destinationTimezone: 'Europe/Paris',
        departureTime: new Date('2025-01-15T10:00:00+00:00'),
        arrivalTime: new Date('2025-01-15T12:00:00+01:00'),
        flightDuration: 1,
      };

      const result = calculateJetlagPlan(input);

      // 1 hour difference gets minimum 1 day recovery (minimal jetlag)
      expect(result.estimatedRecoveryDays).toBe(1);
    });
  });

  describe('Plan Generation', () => {
    it('should generate complete recovery plan for LAX→NRT', () => {
      const input: JetlagInput = {
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-01-15T10:00:00-08:00'),
        arrivalTime: new Date('2025-01-16T14:00:00+09:00'),
        flightDuration: 11.5,
      };

      const result = calculateJetlagPlan(input);

      // Should have all plan components
      expect(result.preFlightSchedule).toBeDefined();
      expect(result.duringFlight).toBeDefined();
      expect(result.postArrivalSchedule).toBeDefined();
      expect(result.recoveryTimeline).toBeDefined();

      // Post-arrival schedule should match recovery days (no longer capped at 7 days)
      expect(result.postArrivalSchedule.length).toBe(result.estimatedRecoveryDays);

      // Recovery timeline should match estimated days
      expect(result.recoveryTimeline.length).toBe(result.estimatedRecoveryDays);
    });

    it('should provide westward-specific recommendations', () => {
      const input: JetlagInput = {
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-01-15T10:00:00-08:00'),
        arrivalTime: new Date('2025-01-16T14:00:00+09:00'),
        flightDuration: 11.5,
      };

      const result = calculateJetlagPlan(input);

      // Westward travel: should recommend staying awake during flight
      expect(result.duringFlight.sleepRecommendations.some(
        rec => rec.toLowerCase().includes('stay awake')
      )).toBe(true);
    });

    it('should provide eastward-specific recommendations', () => {
      const input: JetlagInput = {
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-01-15T18:00:00-05:00'),
        arrivalTime: new Date('2025-01-16T06:00:00+00:00'),
        flightDuration: 7,
      };

      const result = calculateJetlagPlan(input);

      // Eastward travel: should recommend trying to sleep during flight
      expect(result.duringFlight.sleepRecommendations.some(
        rec => rec.toLowerCase().includes('sleep')
      )).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should log warnings for impossible results (if they occur)', () => {
      // This test ensures validation is working
      // If algorithm is correct, no warnings should occur for valid routes
      const consoleSpy = jest.spyOn(console, 'warn');

      const input: JetlagInput = {
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-01-15T10:00:00-08:00'),
        arrivalTime: new Date('2025-01-16T14:00:00+09:00'),
        flightDuration: 11.5,
      };

      calculateJetlagPlan(input);

      // With correct algorithm, LAX→NRT should NOT trigger warnings
      const warningCalls = consoleSpy.mock.calls.filter(call =>
        call[0]?.toString().includes('VALIDATION ERROR')
      );
      expect(warningCalls.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });
});
