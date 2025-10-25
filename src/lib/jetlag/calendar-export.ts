/**
 * Calendar Export for Jetlag Plans
 * Exports comprehensive jetlag plans to .ics format for easy calendar integration
 */

import { createEvents, EventAttributes } from 'ics';
import { JetlagPlan } from './calculator';
import { addMinutes, format } from 'date-fns';

export interface CalendarExportOptions {
  includeReminders?: boolean; // Add 15-min reminders before events
  includeLightTherapy?: boolean;
  includeMelatonin?: boolean;
  includeSleep?: boolean;
  includeMeals?: boolean;
  includeExercise?: boolean;
  includeCaffeine?: boolean;
  includeTimezoneInfo?: boolean; // Include timezone information in descriptions
  flightInfo?: {
    flightNumber?: string | null;
    originCity: string;
    destinationCity: string;
    originAirport: string;
    destinationAirport: string;
    destinationTimezone: string;
  };
}

const DEFAULT_OPTIONS: CalendarExportOptions = {
  includeReminders: true,
  includeLightTherapy: true,
  includeMelatonin: true,
  includeSleep: true,
  includeMeals: true,
  includeExercise: true,
  includeCaffeine: true,
  includeTimezoneInfo: true,
};

/**
 * Export a jetlag plan to .ics calendar format
 * @returns ICS file content as string, or error object
 */
export function exportJetlagPlanToCalendar(
  plan: JetlagPlan,
  userEmail?: string,
  options: CalendarExportOptions = DEFAULT_OPTIONS
): { error: Error; value: undefined } | { error: undefined; value: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events: EventAttributes[] = [];

  // Helper to convert Date to ICS date array format
  const toICSDate = (date: Date): [number, number, number, number, number] => {
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ];
  };

  // Helper to format time with timezone info
  const formatTimeWithTz = (date: Date, timezone: string): string => {
    try {
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
        hour12: true
      });
      const tzAbbr = new Date(date).toLocaleTimeString('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      }).split(' ').pop();
      return `${timeStr} ${tzAbbr}`;
    } catch {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  // Build timezone footer
  const buildTimezoneFooter = (eventTime: Date): string => {
    if (!opts.includeTimezoneInfo || !opts.flightInfo) return '';
    const destTime = formatTimeWithTz(eventTime, opts.flightInfo.destinationTimezone);
    return `\n\n🕐 Local time: ${destTime}`;
  };

  // Build booking reference footer
  const buildBookingRefFooter = (): string => {
    if (!opts.flightInfo?.flightNumber) return '';
    return `\n\n✈️ Flight: ${opts.flightInfo.flightNumber} (${opts.flightInfo.originAirport} → ${opts.flightInfo.destinationAirport})`;
  };

  const timezoneFooter = buildTimezoneFooter;
  const bookingRefFooter = buildBookingRefFooter();

  // Add pre-flight light therapy sessions
  if (opts.includeLightTherapy) {
    plan.preFlightSchedule.lightTherapy.forEach((session) => {
      events.push({
        start: toICSDate(session.time),
        duration: { minutes: session.duration },
        title: `💡 Light Therapy: ${session.type === 'seek' ? 'Seek' : 'Avoid'} Light`,
        description: `${session.description}\n\nIntensity: ${session.intensity}\nType: ${session.type}${timezoneFooter(session.time)}${bookingRefFooter}\n\n⚠️ Part of your jetlag recovery plan`,
        location: session.type === 'seek' ? 'Outdoors or by bright window' : 'Indoors with dim lighting',
        status: 'CONFIRMED',
        busyStatus: 'FREE',
        alarms: opts.includeReminders ? [{
          action: 'display',
          description: `Light therapy session in 15 minutes`,
          trigger: { minutes: 15, before: true },
        }] : undefined,
        categories: ['Jetlag Recovery', 'Light Therapy', 'Pre-Flight'],
      });
    });
  }

  // Add pre-flight sleep schedule
  if (opts.includeSleep) {
    plan.preFlightSchedule.sleep.forEach((sleep) => {
      const durationMinutes = sleep.duration * 60;
      events.push({
        start: toICSDate(sleep.bedtime),
        duration: { minutes: durationMinutes },
        title: `😴 ${sleep.quality === 'target' ? 'Sleep' : sleep.quality === 'nap' ? 'Nap' : 'Avoid Sleep'}`,
        description: `${sleep.notes}\n\nDuration: ${sleep.duration} hours\nQuality: ${sleep.quality}\n\n⚠️ Part of your jetlag recovery plan`,
        status: 'CONFIRMED',
        busyStatus: 'FREE',
        alarms: opts.includeReminders ? [{
          action: 'display',
          description: `Bedtime in 15 minutes - start winding down`,
          trigger: { minutes: 15, before: true },
        }] : undefined,
        categories: ['Jetlag Recovery', 'Sleep', 'Pre-Flight'],
      });
    });
  }

  // Add pre-flight meals
  if (opts.includeMeals) {
    plan.preFlightSchedule.meals.forEach((meal) => {
      events.push({
        start: toICSDate(meal.time),
        duration: { minutes: 60 },
        title: `🍽️ ${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}`,
        description: `${meal.description}\n\n⚠️ Part of your jetlag recovery plan`,
        status: 'CONFIRMED',
        busyStatus: 'FREE',
        alarms: opts.includeReminders ? [{
          action: 'display',
          description: `Meal time in 15 minutes`,
          trigger: { minutes: 15, before: true },
        }] : undefined,
        categories: ['Jetlag Recovery', 'Meals', 'Pre-Flight'],
      });
    });
  }

  // Add post-arrival schedule (all days)
  plan.postArrivalSchedule.forEach((day) => {
    const dayPrefix = `Day ${day.day} (${day.phase})`;

    // Light therapy
    if (opts.includeLightTherapy) {
      day.lightTherapy.forEach((session) => {
        events.push({
          start: toICSDate(session.time),
          duration: { minutes: session.duration },
          title: `💡 ${dayPrefix}: ${session.type === 'seek' ? 'Seek' : 'Avoid'} Light`,
          description: `${session.description}\n\nIntensity: ${session.intensity}\nType: ${session.type}\nPhase: ${day.phase}\n\n⚠️ Part of your jetlag recovery plan`,
          location: session.type === 'seek' ? 'Outdoors or by bright window' : 'Indoors with dim lighting',
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          alarms: opts.includeReminders ? [{
            action: 'display',
            description: `Light therapy session in 15 minutes`,
            trigger: { minutes: 15, before: true },
          }] : undefined,
          categories: ['Jetlag Recovery', 'Light Therapy', `Day ${day.day}`],
        });
      });
    }

    // Sleep schedule
    if (opts.includeSleep) {
      day.sleep.forEach((sleep) => {
        const durationMinutes = sleep.duration * 60;
        events.push({
          start: toICSDate(sleep.bedtime),
          duration: { minutes: durationMinutes },
          title: `😴 ${dayPrefix}: ${sleep.quality === 'target' ? 'Sleep' : sleep.quality === 'nap' ? 'Nap' : 'Avoid Sleep'}`,
          description: `${sleep.notes}\n\nDuration: ${sleep.duration} hours\nQuality: ${sleep.quality}\nPhase: ${day.phase}\n\n⚠️ Part of your jetlag recovery plan`,
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          alarms: opts.includeReminders ? [{
            action: 'display',
            description: `Bedtime in 15 minutes - start winding down`,
            trigger: { minutes: 15, before: true },
          }] : undefined,
          categories: ['Jetlag Recovery', 'Sleep', `Day ${day.day}`],
        });
      });
    }

    // Meals
    if (opts.includeMeals) {
      day.meals.forEach((meal) => {
        events.push({
          start: toICSDate(meal.time),
          duration: { minutes: 60 },
          title: `🍽️ ${dayPrefix}: ${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}`,
          description: `${meal.description}\n\nPhase: ${day.phase}\n\n⚠️ Part of your jetlag recovery plan`,
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          alarms: opts.includeReminders ? [{
            action: 'display',
            description: `Meal time in 15 minutes`,
            trigger: { minutes: 15, before: true },
          }] : undefined,
          categories: ['Jetlag Recovery', 'Meals', `Day ${day.day}`],
        });
      });
    }

    // Exercise
    if (opts.includeExercise) {
      day.exercise.forEach((exercise) => {
        events.push({
          start: toICSDate(exercise.time),
          duration: { minutes: exercise.duration },
          title: `🏃 ${dayPrefix}: ${exercise.type}`,
          description: `Exercise session\n\nType: ${exercise.type}\nDuration: ${exercise.duration} minutes\nPhase: ${day.phase}\n\n⚠️ Part of your jetlag recovery plan`,
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          alarms: opts.includeReminders ? [{
            action: 'display',
            description: `Exercise session in 15 minutes`,
            trigger: { minutes: 15, before: true },
          }] : undefined,
          categories: ['Jetlag Recovery', 'Exercise', `Day ${day.day}`],
        });
      });
    }

    // Caffeine
    if (opts.includeCaffeine) {
      day.caffeine.forEach((caffeine) => {
        events.push({
          start: toICSDate(caffeine.time),
          duration: { minutes: 15 },
          title: `☕ ${dayPrefix}: Caffeine`,
          description: `${caffeine.amount}\n\n${caffeine.notes}\n\nPhase: ${day.phase}\n\n⚠️ Part of your jetlag recovery plan`,
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          alarms: opts.includeReminders ? [{
            action: 'display',
            description: `Caffeine timing reminder`,
            trigger: { minutes: 5, before: true },
          }] : undefined,
          categories: ['Jetlag Recovery', 'Caffeine', `Day ${day.day}`],
        });
      });
    }

    // Melatonin (if applicable)
    if (opts.includeMelatonin && day.melatonin) {
      events.push({
        start: toICSDate(day.melatonin.time),
        duration: { minutes: 5 },
        title: `💊 ${dayPrefix}: Melatonin`,
        description: `Take ${day.melatonin.dosage} melatonin\n\n${day.melatonin.notes}\n\nPhase: ${day.phase}\n\n⚠️ IMPORTANT: 2 hours BEFORE bedtime\n⚠️ Consult your doctor if you have health conditions or take medications\n\n⚠️ Part of your jetlag recovery plan`,
        status: 'CONFIRMED',
        busyStatus: 'FREE',
        alarms: opts.includeReminders ? [
          {
            action: 'display',
            description: `Take melatonin NOW (${day.melatonin.dosage}) - 2 hours before bedtime`,
            trigger: { minutes: 0, before: true },
          },
          {
            action: 'display',
            description: `Melatonin reminder in 15 minutes`,
            trigger: { minutes: 15, before: true },
          },
        ] : undefined,
        categories: ['Jetlag Recovery', 'Melatonin', `Day ${day.day}`],
      });
    }
  });

  // Create the calendar file
  const result = createEvents(events);

  if (result.error) {
    return { error: result.error, value: undefined };
  }

  return { error: undefined, value: result.value || '' };
}

/**
 * Generate a filename for the calendar export
 */
export function generateCalendarFilename(
  originAirport: string,
  destinationAirport: string,
  departureDate: Date
): string {
  const dateStr = format(departureDate, 'yyyy-MM-dd');
  return `jetlag-plan-${originAirport}-${destinationAirport}-${dateStr}.ics`;
}
