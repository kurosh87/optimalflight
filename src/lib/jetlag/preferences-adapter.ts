/**
 * Preferences Adapter
 * Converts database user preferences to calculator UserPreferences format
 */

import { UserPreferences } from './calculator';

/**
 * Database user preferences structure (from schema.ts)
 */
export interface DbUserPreferences {
  sleepQuality?: string | null;           // "poor", "fair", "good", "excellent"
  typicalSleepHours?: number | null;
  bedtime?: string | null;                // "HH:MM" format (e.g., "23:00")
  wakeTime?: string | null;               // "HH:MM" format (e.g., "07:00")
  adaptabilityLevel?: string | null;      // "low", "medium", "high"
  ageRange?: string | null;               // "18-30", "31-50", "51-65", "65+"
  exerciseFrequency?: string | null;      // "sedentary", "light", "moderate", "active", "very-active"
  previousJetlagSeverity?: string | null; // "mild", "moderate", "severe"
  caffeineConsumption?: string | null;    // "none", "low", "moderate", "high"
  preferredRecoveryStyle?: string | null; // "aggressive", "balanced", "gentle"
  melatoninUse?: boolean | null;
  lightTherapyAccess?: boolean | null;
  chronotype?: string | null;             // "morning_lark", "night_owl", "intermediate" (if added to schema)
}

/**
 * Parse HH:MM time string to hour number (0-23)
 * @param timeString - Time in "HH:MM" format (e.g., "23:00")
 * @returns Hour as number (0-23)
 */
function parseTimeToHour(timeString: string | null | undefined): number | undefined {
  if (!timeString) return undefined;

  try {
    const [hours] = timeString.split(':').map(s => parseInt(s, 10));
    if (isNaN(hours) || hours < 0 || hours > 23) {
      console.warn(`Invalid time format: ${timeString}`);
      return undefined;
    }
    return hours;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeString}`, error);
    return undefined;
  }
}

/**
 * Convert age range string to midpoint age number
 * @param ageRange - Age range string (e.g., "31-50", "65+")
 * @returns Age as number
 */
function parseAgeRange(ageRange: string | null | undefined): number | undefined {
  if (!ageRange) return undefined;

  // Handle "65+" specially
  if (ageRange === '65+') {
    return 70; // Use 70 as representative age for 65+
  }

  // Handle ranges like "18-30", "31-50", "51-65"
  try {
    const [min, max] = ageRange.split('-').map(s => parseInt(s, 10));
    if (!isNaN(min) && !isNaN(max)) {
      return Math.floor((min + max) / 2); // Return midpoint
    } else if (!isNaN(min)) {
      return min; // If only min provided, use that
    }
  } catch (error) {
    console.warn(`Failed to parse age range: ${ageRange}`, error);
  }

  return undefined;
}

/**
 * Infer chronotype from user behavior patterns
 * Uses sleep patterns, caffeine consumption, and exercise frequency
 *
 * @param prefs - Database user preferences
 * @returns Inferred chronotype or undefined
 */
function inferChronotype(prefs: DbUserPreferences): 'morning_lark' | 'night_owl' | 'intermediate' | undefined {
  // If already specified in database, use that
  if (prefs.chronotype) {
    if (['morning_lark', 'night_owl', 'intermediate'].includes(prefs.chronotype)) {
      return prefs.chronotype as 'morning_lark' | 'night_owl' | 'intermediate';
    }
  }

  // Infer from bedtime
  const bedtimeHour = parseTimeToHour(prefs.bedtime);
  if (bedtimeHour !== undefined) {
    // Early bedtime (before 10 PM) → morning lark
    if (bedtimeHour < 22) {
      return 'morning_lark';
    }
    // Late bedtime (after midnight) → night owl
    if (bedtimeHour >= 24 || bedtimeHour < 2) {
      return 'night_owl';
    }
  }

  // Infer from caffeine consumption + typical sleep hours
  const highCaffeine = prefs.caffeineConsumption === 'high';
  const lowSleep = prefs.typicalSleepHours && prefs.typicalSleepHours < 7;

  // High caffeine + low sleep might indicate night owl struggling with early schedule
  if (highCaffeine && lowSleep) {
    return 'night_owl';
  }

  // Default to intermediate if we can't infer
  return 'intermediate';
}

/**
 * Convert database user preferences to calculator UserPreferences format
 *
 * @param dbPrefs - User preferences from database (nullable)
 * @returns Calculator-compatible UserPreferences or undefined if no preferences
 */
export function adaptUserPreferences(
  dbPrefs: DbUserPreferences | null | undefined
): UserPreferences | undefined {
  if (!dbPrefs) {
    return undefined;
  }

  const adapted: UserPreferences = {};

  // Convert bedtime from "HH:MM" to hour number
  const bedtimeHour = parseTimeToHour(dbPrefs.bedtime);
  if (bedtimeHour !== undefined) {
    adapted.normalBedtime = bedtimeHour;
  }

  // Convert wake time from "HH:MM" to hour number
  const wakeTimeHour = parseTimeToHour(dbPrefs.wakeTime);
  if (wakeTimeHour !== undefined) {
    adapted.normalWakeTime = wakeTimeHour;
  }

  // Convert age range to number
  const age = parseAgeRange(dbPrefs.ageRange);
  if (age !== undefined) {
    adapted.age = age;
  }

  // Infer or use chronotype
  const chronotype = inferChronotype(dbPrefs);
  if (chronotype) {
    adapted.chronotype = chronotype;
  }

  // Only return if we have at least one preference
  if (Object.keys(adapted).length === 0) {
    return undefined;
  }

  return adapted;
}

/**
 * Get user-friendly description of adapted preferences (for debugging/logging)
 */
export function describeAdaptedPreferences(prefs: UserPreferences): string {
  const parts: string[] = [];

  if (prefs.normalBedtime !== undefined) {
    parts.push(`Bedtime: ${prefs.normalBedtime}:00`);
  }
  if (prefs.normalWakeTime !== undefined) {
    parts.push(`Wake: ${prefs.normalWakeTime}:00`);
  }
  if (prefs.age !== undefined) {
    parts.push(`Age: ${prefs.age}`);
  }
  if (prefs.chronotype) {
    parts.push(`Type: ${prefs.chronotype.replace('_', ' ')}`);
  }

  return parts.join(', ') || 'No preferences';
}
