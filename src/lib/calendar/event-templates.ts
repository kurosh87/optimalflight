/**
 * Smart Event Title Templates
 *
 * Customizable templates for generating calendar event titles.
 * Supports template variables that get replaced with actual values.
 */

import type { EventType } from './color-schemes';

/**
 * Template variables that can be used in event titles:
 * - {emoji} - Event type emoji (☀️, 😴, 💊, etc.)
 * - {type} - Action type (GET/AVOID for light, Breakfast/Lunch/Dinner for meals)
 * - {duration} - Duration in minutes
 * - {dosage} - Melatonin dosage
 * - {amount} - Caffeine amount
 * - {day} - Recovery plan day number
 * - {flight} - Flight identifier (e.g., "SFO→NYC")
 * - {time} - Start time formatted
 */

export const DEFAULT_TEMPLATES: Record<EventType, string> = {
  light_therapy: '{emoji} {type} Light ({duration}min) - Day {day}',
  sleep: '{emoji} Bedtime - Day {day}',
  melatonin: '{emoji} Take Melatonin ({dosage}) - Day {day}',
  meals: '{emoji} {type} - Day {day}',
  exercise: '{emoji} {type} ({duration}min) - Day {day}',
  caffeine: '{emoji} {amount} - Day {day}',
};

export const TEMPLATE_VARIABLES = [
  { key: '{emoji}', description: 'Event type emoji' },
  { key: '{type}', description: 'Action or meal type' },
  { key: '{duration}', description: 'Duration in minutes' },
  { key: '{dosage}', description: 'Melatonin dosage (e.g., "0.5mg")' },
  { key: '{amount}', description: 'Caffeine amount (e.g., "1 cup coffee")' },
  { key: '{day}', description: 'Recovery day number' },
  { key: '{flight}', description: 'Flight route (e.g., "SFO→NYC")' },
  { key: '{time}', description: 'Event start time' },
] as const;

export interface TemplateContext {
  emoji?: string;
  type?: string;
  duration?: number | string;
  dosage?: string;
  amount?: string;
  day: number;
  flight?: string;
  time?: Date | string;
}

/**
 * Generate event title from template and context
 */
export function generateEventTitle(
  eventType: EventType,
  context: TemplateContext,
  customTemplate?: string
): string {
  const template = customTemplate || DEFAULT_TEMPLATES[eventType];

  let title = template;

  // Replace template variables
  if (context.emoji) title = title.replace(/{emoji}/g, context.emoji);
  if (context.type) title = title.replace(/{type}/g, context.type);
  if (context.duration !== undefined) title = title.replace(/{duration}/g, String(context.duration));
  if (context.dosage) title = title.replace(/{dosage}/g, context.dosage);
  if (context.amount) title = title.replace(/{amount}/g, context.amount);
  if (context.day !== undefined) title = title.replace(/{day}/g, String(context.day));
  if (context.flight) title = title.replace(/{flight}/g, context.flight);
  if (context.time) {
    const timeStr = context.time instanceof Date
      ? context.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : context.time;
    title = title.replace(/{time}/g, timeStr);
  }

  return title;
}

/**
 * Get all template strings with user preferences applied
 */
export function getAllTemplates(
  preferences?: {
    title_template_light_therapy?: string;
    title_template_sleep?: string;
    title_template_melatonin?: string;
    title_template_meals?: string;
    title_template_exercise?: string;
    title_template_caffeine?: string;
  }
): Record<EventType, string> {
  return {
    light_therapy: preferences?.title_template_light_therapy || DEFAULT_TEMPLATES.light_therapy,
    sleep: preferences?.title_template_sleep || DEFAULT_TEMPLATES.sleep,
    melatonin: preferences?.title_template_melatonin || DEFAULT_TEMPLATES.melatonin,
    meals: preferences?.title_template_meals || DEFAULT_TEMPLATES.meals,
    exercise: preferences?.title_template_exercise || DEFAULT_TEMPLATES.exercise,
    caffeine: preferences?.title_template_caffeine || DEFAULT_TEMPLATES.caffeine,
  };
}

/**
 * Validate template (check for valid variables)
 */
export function isValidTemplate(template: string): boolean {
  // Template is valid if it doesn't have unmatched curly braces
  const openBraces = (template.match(/{/g) || []).length;
  const closeBraces = (template.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    return false;
  }

  // Extract all variables and check if they're valid
  const variables = template.match(/{[^}]+}/g) || [];
  const validVars = TEMPLATE_VARIABLES.map(v => v.key);

  for (const variable of variables) {
    if (!validVars.includes(variable)) {
      return false;
    }
  }

  return true;
}

/**
 * Preview template with sample data
 */
export function previewTemplate(
  eventType: EventType,
  template: string
): string {
  const sampleContext: Record<EventType, TemplateContext> = {
    light_therapy: {
      emoji: '☀️',
      type: 'GET',
      duration: 30,
      day: 2,
      flight: 'SFO→NYC',
      time: '09:00 AM',
    },
    sleep: {
      emoji: '😴',
      day: 2,
      flight: 'SFO→NYC',
      time: '11:00 PM',
    },
    melatonin: {
      emoji: '💊',
      dosage: '0.5mg',
      day: 2,
      flight: 'SFO→NYC',
      time: '09:00 PM',
    },
    meals: {
      emoji: '🍳',
      type: 'Breakfast',
      day: 2,
      flight: 'SFO→NYC',
      time: '08:00 AM',
    },
    exercise: {
      emoji: '🏃',
      type: 'Light walk',
      duration: 20,
      day: 2,
      flight: 'SFO→NYC',
      time: '10:00 AM',
    },
    caffeine: {
      emoji: '☕',
      amount: '1 cup coffee',
      day: 2,
      flight: 'SFO→NYC',
      time: '09:00 AM',
    },
  };

  return generateEventTitle(eventType, sampleContext[eventType], template);
}

/**
 * Parse JSON string templates (for backward compatibility)
 */
export function parseTemplateJson(jsonStr: string | null): Record<EventType, string> | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Get emoji for event type
 */
export function getEventEmoji(eventType: EventType): string {
  const emojis: Record<EventType, string> = {
    light_therapy: '☀️',
    sleep: '😴',
    melatonin: '💊',
    meals: '🍽️',
    exercise: '🏃',
    caffeine: '☕',
  };
  return emojis[eventType];
}

/**
 * Get template for event type
 */
export function getEventTemplate(eventType: EventType, preferences?: any): string {
  const templates = getAllTemplates(preferences);
  return templates[eventType];
}

/**
 * Get human-readable event type name
 */
export function getEventTypeName(eventType: EventType): string {
  const names: Record<EventType, string> = {
    light_therapy: 'Light Therapy',
    sleep: 'Sleep',
    melatonin: 'Melatonin',
    meals: 'Meals',
    exercise: 'Exercise',
    caffeine: 'Caffeine',
  };
  return names[eventType];
}
