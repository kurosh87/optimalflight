/**
 * Reminder utilities for parsing and managing calendar event reminders
 */

import { EventType } from './color-schemes';

export const DEFAULT_REMINDERS: Record<EventType, number[]> = {
  light_therapy: [15], // 15 minutes before
  sleep: [30], // 30 minutes before
  melatonin: [0], // At the time
  meals: [10], // 10 minutes before
  exercise: [15], // 15 minutes before
  caffeine: [15], // 15 minutes before
};

export const REMINDER_PRESETS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 10080, label: '1 week before' },
];

/**
 * Parse JSONB reminder string to number array
 */
export function parseReminders(jsonString: string | null | undefined): number[] {
  if (!jsonString) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === 'number')) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Failed to parse reminders JSON:', error);
    return [];
  }
}

/**
 * Get reminders for a specific event type with fallback to defaults
 */
export function getEventReminders(
  eventType: EventType,
  customReminders?: Partial<Record<EventType, string | null>>
): number[] {
  if (customReminders && customReminders[eventType]) {
    const parsed = parseReminders(customReminders[eventType]);
    if (parsed.length > 0) {
      return parsed;
    }
  }
  return DEFAULT_REMINDERS[eventType];
}

/**
 * Serialize reminders array to JSON string for storage
 */
export function serializeReminders(reminders: number[]): string {
  return JSON.stringify(reminders);
}

/**
 * Validate reminder times (must be >= 0 and <= 1 week)
 */
export function isValidReminderTime(minutes: number): boolean {
  return minutes >= 0 && minutes <= 10080; // 1 week max
}

/**
 * Validate array of reminder times
 */
export function validateReminders(reminders: number[]): boolean {
  if (!Array.isArray(reminders)) return false;
  if (reminders.length === 0) return false;
  if (reminders.length > 5) return false; // Max 5 reminders per event
  return reminders.every(isValidReminderTime);
}

/**
 * Format reminder time as human-readable string
 */
export function formatReminderTime(minutes: number): string {
  if (minutes === 0) return 'At time of event';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} before`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} before`;
  }
  const days = Math.floor(minutes / 1440);
  return `${days} day${days !== 1 ? 's' : ''} before`;
}
