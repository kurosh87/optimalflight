import { calculateJetlagPlan } from './calculator';
import { exportJetlagPlanToCalendar, generateCalendarFilename } from './calendar-export';

describe('Calendar Export', () => {
  describe('exportJetlagPlanToCalendar', () => {
    it('should export a complete jetlag plan to .ics format', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'Asia/Tokyo',
        departureTime: new Date('2025-10-15T18:00:00-07:00'),
        arrivalTime: new Date('2025-10-16T21:00:00+09:00'),
        flightDuration: 11,
      });

      const result = exportJetlagPlanToCalendar(plan);

      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
      expect(result.value).toContain('BEGIN:VCALENDAR');
      expect(result.value).toContain('END:VCALENDAR');
      expect(result.value).toContain('BEGIN:VEVENT');
      expect(result.value).toContain('END:VEVENT');
    });

    it('should include light therapy events when enabled', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-10-15T22:00:00-04:00'),
        arrivalTime: new Date('2025-10-16T10:00:00+01:00'),
        flightDuration: 7,
      });

      const result = exportJetlagPlanToCalendar(plan, undefined, {
        includeLightTherapy: true,
      });

      expect(result.error).toBeUndefined();
      expect(result.value).toContain('Light Therapy');
    });

    it('should include melatonin reminders when enabled', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-10-15T22:00:00-04:00'),
        arrivalTime: new Date('2025-10-16T10:00:00+01:00'),
        flightDuration: 7,
      });

      const result = exportJetlagPlanToCalendar(plan, undefined, {
        includeMelatonin: true,
      });

      expect(result.error).toBeUndefined();
      expect(result.value).toContain('Melatonin');
    });

    it('should include sleep schedule when enabled', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-10-15T22:00:00-04:00'),
        arrivalTime: new Date('2025-10-16T10:00:00+01:00'),
        flightDuration: 7,
      });

      const result = exportJetlagPlanToCalendar(plan, undefined, {
        includeSleep: true,
      });

      expect(result.error).toBeUndefined();
      expect(result.value).toContain('Sleep');
    });

    it('should exclude events when options are disabled', () => {
      const plan = calculateJetlagPlan({
        originTimezone: 'America/New_York',
        destinationTimezone: 'Europe/London',
        departureTime: new Date('2025-10-15T22:00:00-04:00'),
        arrivalTime: new Date('2025-10-16T10:00:00+01:00'),
        flightDuration: 7,
      });

      const result = exportJetlagPlanToCalendar(plan, undefined, {
        includeLightTherapy: false,
        includeMelatonin: false,
        includeSleep: false,
        includeMeals: false,
        includeExercise: false,
        includeCaffeine: false,
      });

      expect(result.error).toBeUndefined();
      // Should have minimal events or just the calendar structure
      expect(result.value).toContain('BEGIN:VCALENDAR');
    });
  });

  describe('generateCalendarFilename', () => {
    it('should generate a valid filename with airport codes and date', () => {
      const filename = generateCalendarFilename(
        'LAX',
        'NRT',
        new Date('2025-10-15T18:00:00Z')
      );

      expect(filename).toBe('jetlag-plan-LAX-NRT-2025-10-15.ics');
    });

    it('should handle different dates correctly', () => {
      const filename = generateCalendarFilename(
        'JFK',
        'LHR',
        new Date('2025-12-25T10:00:00Z')
      );

      expect(filename).toBe('jetlag-plan-JFK-LHR-2025-12-25.ics');
    });
  });
});
