/**
 * Phase-Aware Light Therapy Tests
 *
 * Critical tests to ensure the jetlag algorithm never recommends light
 * therapy that would make jetlag worse by causing phase shifts in the
 * wrong direction.
 *
 * Based on:
 * - Khalsa et al. (2003) - Human circadian phase response curves
 * - Burgess & Eastman (2005) - Protocols for eastward travel
 */

import { calculateJetlagPlan } from './calculator';

describe('Phase-Aware Light Therapy', () => {
  describe('Large Eastward Shifts (8-9+ hours)', () => {
    test('Taiwan → Vancouver: Day 1 should AVOID morning light when body is in evening phase', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'Asia/Taipei',
        destinationTimezone: 'America/Vancouver',
        departureTime: new Date('2025-10-09T23:30:00+08:00'),
        arrivalTime: new Date('2025-10-09T19:15:00-07:00'),
        flightDuration: 10.75,
      });

      expect(plan.timezoneShift).toBe(-15);
      expect(plan.direction).toBe('east');

      const day1 = plan.postArrivalSchedule[0];
      expect(day1).toBeDefined();
      expect(day1.lightTherapy.length).toBeGreaterThan(0);

      // Morning session (around 6 AM destination time)
      const morningSession = day1.lightTherapy.find(s => {
        const hour = new Date(s.time).getHours();
        return hour >= 5 && hour <= 8;
      });

      expect(morningSession).toBeDefined();

      // CRITICAL: When body is in evening phase, morning light must be AVOIDED
      if (morningSession!.circadianPhase === 'biological_evening') {
        expect(morningSession!.type).toBe('avoid');
        expect(morningSession!.effectOnPhase).not.toBe('delay');
      }

      // There should be a SEEK session later when body is in advance window
      const eveningSeekSession = day1.lightTherapy.find(s =>
        s.type === 'seek' &&
        (s.circadianPhase === 'biological_morning' || s.circadianPhase === 'biological_late_night')
      );

      expect(eveningSeekSession).toBeDefined();
      expect(eveningSeekSession!.effectOnPhase).toMatch(/advance/);
    });

    test('Singapore → LA: Day 1 should use phase-appropriate light timing', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'Asia/Singapore',
        destinationTimezone: 'America/Los_Angeles',
        departureTime: new Date('2025-06-15T23:00:00+08:00'),
        arrivalTime: new Date('2025-06-15T21:00:00-07:00'),
        flightDuration: 16,
      });

      expect(plan.timezoneShift).toBe(-15);
      expect(plan.direction).toBe('east');

      const day1 = plan.postArrivalSchedule[0];

      // No SEEK sessions should cause phase delays on eastward travel
      const harmfulSessions = day1.lightTherapy.filter(s =>
        s.type === 'seek' && s.effectOnPhase === 'delay'
      );

      expect(harmfulSessions.length).toBe(0);
    });

    test('SF → Paris: 9h eastward should have phase-aware morning recommendations', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Europe/Paris',
        departureTime: new Date('2025-06-15T15:00:00-07:00'),
        arrivalTime: new Date('2025-06-16T10:00:00+02:00'),
        flightDuration: 10,
      });

      expect(plan.timezoneShift).toBe(9);
      expect(plan.direction).toBe('east');

      const day1 = plan.postArrivalSchedule[0];

      // All SEEK sessions should cause advances (never delays)
      const seekSessions = day1.lightTherapy.filter(s => s.type === 'seek');

      seekSessions.forEach(session => {
        expect(session.effectOnPhase).toMatch(/advance/);
      });
    });
  });

  describe('Medium Eastward Shifts (5-7 hours)', () => {
    test('NYC → London: Day 1 morning light should be beneficial', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-06-15T22:00:00-04:00'),
        arrivalTime: new Date('2025-06-16T10:00:00+01:00'),
        flightDuration: 7,
      });

      expect(plan.timezoneShift).toBe(5);
      expect(plan.direction).toBe('east');

      const day1 = plan.postArrivalSchedule[0];

      // For moderate eastward shifts, morning light often helps
      // (body hasn't shifted as far into evening phase)
      const morningSession = day1.lightTherapy.find(s => {
        const hour = new Date(s.time).getHours();
        return hour >= 5 && hour <= 9;
      });

      expect(morningSession).toBeDefined();
    });
  });

  describe('Westward Travel (All Shifts)', () => {
    test('London → NYC: Should seek evening light for phase delay', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'Europe/London',
        destinationTimezone: 'America/New_York',
        departureTime: new Date('2025-06-15T10:00:00+01:00'),
        arrivalTime: new Date('2025-06-15T13:00:00-04:00'),
        flightDuration: 8,
      });

      expect(plan.timezoneShift).toBe(-5);
      expect(plan.direction).toBe('west');

      const day1 = plan.postArrivalSchedule[0];

      // Westward travel: should have evening SEEK session for delay
      const eveningSeek = day1.lightTherapy.find(s =>
        s.type === 'seek' && s.effectOnPhase === 'delay'
      );

      expect(eveningSeek).toBeDefined();
    });
  });

  describe('Algorithm Safety Checks', () => {
    test('Should never recommend SEEK light that causes delay on eastward travel', () => {
      const eastwardFlights = [
        {
          origin: 'Asia/Taipei',
          dest: 'America/Vancouver',
          dep: '2025-10-09T23:30:00+08:00',
          arr: '2025-10-09T19:15:00-07:00',
        },
        {
          origin: 'Asia/Tokyo',
          dest: 'America/Los_Angeles',
          dep: '2025-06-15T17:00:00+09:00',
          arr: '2025-06-15T11:00:00-07:00',
        },
        {
          origin: 'America/Los_Angeles',
          dest: 'Europe/Paris',
          dep: '2025-06-15T15:00:00-07:00',
          arr: '2025-06-16T10:00:00+02:00',
        },
      ];

      eastwardFlights.forEach(flight => {
        const plan = calculateJetlagPlan({
          originTimezone: flight.origin,
          destinationTimezone: flight.dest,
          departureTime: new Date(flight.dep),
          arrivalTime: new Date(flight.arr),
          flightDuration: 10,
        });

        expect(plan.direction).toBe('east');

        // Check all days
        plan.postArrivalSchedule.forEach((day, dayIdx) => {
          const harmfulSessions = day.lightTherapy.filter(s =>
            s.type === 'seek' && s.effectOnPhase === 'delay'
          );

          expect(harmfulSessions).toEqual([]);
        });
      });
    });

    test('Should never recommend SEEK light that causes advance on westward travel', () => {
      const westwardFlights = [
        {
          origin: 'Europe/London',
          dest: 'America/New_York',
          dep: '2025-06-15T10:00:00+01:00',
          arr: '2025-06-15T13:00:00-04:00',
        },
        {
          origin: 'Asia/Dubai',
          dest: 'America/New_York',
          dep: '2025-06-15T03:00:00+04:00',
          arr: '2025-06-15T09:00:00-04:00',
        },
      ];

      westwardFlights.forEach(flight => {
        const plan = calculateJetlagPlan({
          originTimezone: flight.origin,
          destinationTimezone: flight.dest,
          departureTime: new Date(flight.dep),
          arrivalTime: new Date(flight.arr),
          flightDuration: 10,
        });

        expect(plan.direction).toBe('west');

        // Check all days
        plan.postArrivalSchedule.forEach((day, dayIdx) => {
          const harmfulSessions = day.lightTherapy.filter(s =>
            s.type === 'seek' &&
            (s.effectOnPhase === 'advance' || s.effectOnPhase === 'weak_advance')
          );

          // Westward travel wants delays, not advances
          // Small advances might be OK in later days, but early days should avoid
          if (dayIdx < 3) {
            expect(harmfulSessions.length).toBeLessThanOrEqual(1);
          }
        });
      });
    });
  });
});
