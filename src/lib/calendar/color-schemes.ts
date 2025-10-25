/**
 * Calendar Event Color Schemes
 *
 * Default color codes for different jetlag recovery event types.
 * These can be customized per-user in their calendar sync preferences.
 */

export const DEFAULT_EVENT_COLORS = {
  light_therapy: { hex: '#FFB84D', name: 'Orange' },     // Orange - for light exposure
  sleep: { hex: '#9333EA', name: 'Purple' },             // Purple - for bedtime/sleep
  melatonin: { hex: '#1E40AF', name: 'Dark Blue' },      // Dark Blue - for melatonin supplements
  meals: { hex: '#059669', name: 'Green' },              // Green - for meal timing
  exercise: { hex: '#DC2626', name: 'Red' },             // Red - for physical activity
  caffeine: { hex: '#78350F', name: 'Brown' },           // Brown - for caffeine timing
} as const;

export type EventType = keyof typeof DEFAULT_EVENT_COLORS;

/**
 * Get color for an event type
 */
export function getEventColor(
  eventType: EventType,
  customColors?: Partial<Record<EventType, string>>
): string {
  return customColors?.[eventType] || DEFAULT_EVENT_COLORS[eventType].hex;
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Convert hex to RGB (for calendar services that need RGB)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get all event type colors with user preferences applied
 */
export function getAllEventColors(
  preferences?: {
    color_light_therapy?: string;
    color_sleep?: string;
    color_melatonin?: string;
    color_meals?: string;
    color_exercise?: string;
    color_caffeine?: string;
  }
): Record<EventType, string> {
  return {
    light_therapy: preferences?.color_light_therapy || DEFAULT_EVENT_COLORS.light_therapy.hex,
    sleep: preferences?.color_sleep || DEFAULT_EVENT_COLORS.sleep.hex,
    melatonin: preferences?.color_melatonin || DEFAULT_EVENT_COLORS.melatonin.hex,
    meals: preferences?.color_meals || DEFAULT_EVENT_COLORS.meals.hex,
    exercise: preferences?.color_exercise || DEFAULT_EVENT_COLORS.exercise.hex,
    caffeine: preferences?.color_caffeine || DEFAULT_EVENT_COLORS.caffeine.hex,
  };
}

/**
 * Convert hex color to Google Calendar color ID
 * Google Calendar only supports predefined colors (1-11)
 * We map our hex colors to the closest Google color
 */
export function hexToGoogleColorId(hex: string): string {
  // Google Calendar color mapping (closest matches to our defaults)
  const colorMap: Record<string, string> = {
    [DEFAULT_EVENT_COLORS.light_therapy.hex]: '6', // Orange
    [DEFAULT_EVENT_COLORS.sleep.hex]: '3',          // Purple
    [DEFAULT_EVENT_COLORS.melatonin.hex]: '9',      // Blue
    [DEFAULT_EVENT_COLORS.meals.hex]: '10',         // Green
    [DEFAULT_EVENT_COLORS.exercise.hex]: '11',      // Red
    [DEFAULT_EVENT_COLORS.caffeine.hex]: '5',       // Yellow/Brown
  };

  return colorMap[hex] || '1'; // Default to lavender if no match
}
