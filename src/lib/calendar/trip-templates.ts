/**
 * Trip Templates System
 * Pre-configured calendar preferences for common trip types
 */

import { EventType } from './color-schemes';

export interface TripTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  eventTypes: EventType[];
  reminders: Partial<Record<EventType, number[]>>;
  includeLocations: boolean;
  includeBookingRef: boolean;
  isDefault?: boolean;
  isCustom?: boolean;
}

// Built-in trip templates
export const DEFAULT_TEMPLATES: TripTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Just the essentials - sleep and light therapy',
    icon: '⚡',
    eventTypes: ['sleep', 'light_therapy'],
    reminders: {
      sleep: [30, 60],
      light_therapy: [15],
    },
    includeLocations: true,
    includeBookingRef: true,
    isDefault: true,
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    description: 'Full recovery plan with all recommendations',
    icon: '📋',
    eventTypes: ['sleep', 'light_therapy', 'melatonin', 'meals', 'exercise', 'caffeine'],
    reminders: {
      sleep: [30, 60],
      light_therapy: [15],
      melatonin: [0, 15],
      meals: [15],
      exercise: [15],
      caffeine: [5],
    },
    includeLocations: true,
    includeBookingRef: true,
    isDefault: true,
  },
  {
    id: 'business',
    name: 'Business Travel',
    description: 'Optimized for short trips with meetings',
    icon: '💼',
    eventTypes: ['sleep', 'light_therapy', 'caffeine'],
    reminders: {
      sleep: [30],
      light_therapy: [15],
      caffeine: [5],
    },
    includeLocations: false,
    includeBookingRef: true,
    isDefault: true,
  },
  {
    id: 'vacation',
    name: 'Vacation',
    description: 'Relaxed schedule focusing on sleep and meals',
    icon: '🏖️',
    eventTypes: ['sleep', 'light_therapy', 'meals'],
    reminders: {
      sleep: [60],
      light_therapy: [30],
      meals: [15],
    },
    includeLocations: true,
    includeBookingRef: false,
    isDefault: true,
  },
  {
    id: 'athletic',
    name: 'Athletic Event',
    description: 'Performance-focused with exercise and nutrition',
    icon: '🏃',
    eventTypes: ['sleep', 'light_therapy', 'meals', 'exercise', 'caffeine'],
    reminders: {
      sleep: [30, 60],
      light_therapy: [15],
      meals: [30],
      exercise: [30],
      caffeine: [10],
    },
    includeLocations: true,
    includeBookingRef: true,
    isDefault: true,
  },
  {
    id: 'family',
    name: 'Family Trip',
    description: 'Simplified schedule suitable for traveling with family',
    icon: '👨‍👩‍👧‍👦',
    eventTypes: ['sleep', 'light_therapy', 'meals'],
    reminders: {
      sleep: [60],
      light_therapy: [30],
      meals: [30],
    },
    includeLocations: true,
    includeBookingRef: true,
    isDefault: true,
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): TripTemplate | undefined {
  return DEFAULT_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get all available templates (built-in + custom)
 */
export function getAllTemplates(customTemplates: TripTemplate[] = []): TripTemplate[] {
  return [...DEFAULT_TEMPLATES, ...customTemplates];
}

/**
 * Create a custom template from current preferences
 */
export function createCustomTemplate(
  name: string,
  description: string,
  icon: string,
  eventTypes: EventType[],
  reminders: Partial<Record<EventType, number[]>>,
  includeLocations: boolean,
  includeBookingRef: boolean
): TripTemplate {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    icon,
    eventTypes,
    reminders,
    includeLocations,
    includeBookingRef,
    isCustom: true,
  };
}

/**
 * Apply template to calendar preferences
 * Returns preferences object to be saved
 */
export function applyTemplate(template: TripTemplate) {
  return {
    eventTypes: template.eventTypes,
    reminders: template.reminders,
    includeLocations: template.includeLocations,
    includeBookingRef: template.includeBookingRef,
  };
}
