/**
 * Jetlag Tips Generator
 *
 * Generates contextual jetlag advice based on route patterns
 */

import { neon } from '@neondatabase/serverless';
import type { RoutePath } from './path-finder';

const sql = neon(process.env.DATABASE_URL!);

interface JetlagTips {
  direction: 'eastward' | 'westward' | 'mixed';
  advantage: string;
  bestDepartureTime: string;
  preAdjustmentDays: number;
  recoveryDuration: string;
  keyTips: string[];
  recommendations: string[];
}

/**
 * Generate comprehensive jetlag tips for a route
 */
export async function generateJetlagTips(
  origin: string,
  destination: string,
  routes: RoutePath[]
): Promise<JetlagTips> {
  try {
    // Get airport timezone data
    const airports = await sql`
      SELECT
        iata_code,
        timezone,
        latitude,
        longitude
      FROM airports
      WHERE iata_code IN (${origin}, ${destination})
    `;

    const originAirport = airports.find((a: any) => a.iata_code === origin);
    const destAirport = airports.find((a: any) => a.iata_code === destination);

    if (!originAirport || !destAirport) {
      return getDefaultTips();
    }

    // Calculate timezone difference
    const timezoneDiff = calculateTimezoneDiff(originAirport.timezone, destAirport.timezone);

    // Determine direction (eastward is harder for jetlag)
    const direction = timezoneDiff > 0 ? 'eastward' : timezoneDiff < 0 ? 'westward' : 'mixed';

    // Get best route for reference
    const bestRoute = routes.length > 0 ? routes[0] : null;

    // Generate tips based on direction and distance
    const tips = generateTipsBasedOnDirection(direction, Math.abs(timezoneDiff), bestRoute);

    return tips;

  } catch (error) {
    console.error('[Jetlag Tips] Error generating tips:', error);
    return getDefaultTips();
  }
}

/**
 * Calculate timezone difference (positive = eastward, negative = westward)
 */
function calculateTimezoneDiff(originTz: string, destTz: string): number {
  try {
    // Simple hour offset calculation
    // Format: "America/Asuncion" → UTC offset
    // This is simplified - in production, use a proper timezone library

    // For now, estimate based on common timezones
    const tzOffsets: Record<string, number> = {
      'America/Asuncion': -4,
      'Pacific/Tahiti': -10,
      'America/Los_Angeles': -8,
      'America/Sao_Paulo': -3,
      'America/Santiago': -3,
      'Pacific/Auckland': 12,
      'Europe/Paris': 1,
      'Asia/Dubai': 4,
      'Asia/Singapore': 8,
      'Asia/Tokyo': 9,
    };

    const originOffset = tzOffsets[originTz] || 0;
    const destOffset = tzOffsets[destTz] || 0;

    return destOffset - originOffset;

  } catch (error) {
    return 0; // Unable to calculate
  }
}

/**
 * Generate tips based on travel direction
 */
function generateTipsBasedOnDirection(
  direction: 'eastward' | 'westward' | 'mixed',
  timezonesCrossed: number,
  bestRoute: RoutePath | null
): JetlagTips {

  if (direction === 'westward') {
    // Westward travel is EASIER for jetlag
    return {
      direction: 'westward',
      advantage: 'Westward travel is easier on your body - you can stay up later naturally',
      bestDepartureTime: timezonesCrossed > 5 ? '14:00-17:00' : '10:00-14:00',
      preAdjustmentDays: timezonesCrossed > 5 ? 2 : 1,
      recoveryDuration: `${Math.ceil(timezonesCrossed / 2)}-${Math.ceil(timezonesCrossed / 1.5)} days`,
      keyTips: [
        '✓ Stay awake until local bedtime on arrival',
        '✓ Get bright light exposure in the evening',
        '✓ Delay your sleep schedule 1-2 hours before departure',
        '✓ Stay hydrated throughout journey (16+ hours)',
        `✓ Allow ${Math.ceil(timezonesCrossed / 2)} days for full adjustment`,
      ],
      recommendations: [
        'Afternoon departure flights work best for westward travel',
        'Try to stay active during your layover',
        bestRoute?.connections.length ?
          `Consider a 24-hour stopover in ${bestRoute.connections[0]} for recovery` :
          'Direct flights are best for minimizing fatigue',
        'Use the first 2 days for lighter activities',
        'Avoid alcohol and heavy meals during flight',
      ],
    };
  }

  if (direction === 'eastward') {
    // Eastward travel is HARDER for jetlag
    return {
      direction: 'eastward',
      advantage: 'Eastward travel is more challenging - extra preparation recommended',
      bestDepartureTime: '18:00-22:00',
      preAdjustmentDays: Math.min(timezonesCrossed, 3),
      recoveryDuration: `${Math.ceil(timezonesCrossed * 0.75)}-${timezonesCrossed} days`,
      keyTips: [
        '⚠ Eastward = Harder adjustment',
        '✓ Start shifting sleep earlier 3 days before departure',
        '✓ Get bright light exposure in the morning upon arrival',
        '✓ Avoid naps on arrival day',
        '✓ Consider melatonin supplement (consult doctor)',
        `✓ Allow ${timezonesCrossed} days for full adjustment`,
      ],
      recommendations: [
        'Evening departure flights help you sleep onboard',
        'Try to sleep during the flight (use eye mask, earplugs)',
        'Force yourself to stay awake until local bedtime on arrival',
        bestRoute?.connections.length ?
          'Use layover for light exercise and stretching' :
          'Direct flights reduce total travel fatigue',
        'Plan lighter schedule for first 3-4 days',
        'Morning sunlight exposure is critical for adjustment',
      ],
    };
  }

  // Mixed or no significant timezone change
  return {
    direction: 'mixed',
    advantage: 'Minimal timezone change - faster adjustment',
    bestDepartureTime: '10:00-16:00',
    preAdjustmentDays: 0,
    recoveryDuration: '1-2 days',
    keyTips: [
      '✓ Normal sleep schedule maintained',
      '✓ Stay hydrated during travel',
      '✓ Light adjustment period expected',
    ],
    recommendations: [
      'Any departure time works well',
      'Focus on comfort during flight',
      'Minimal pre-trip preparation needed',
    ],
  };
}

/**
 * Default tips when data is unavailable
 */
function getDefaultTips(): JetlagTips {
  return {
    direction: 'mixed',
    advantage: 'General jetlag advice applicable to most routes',
    bestDepartureTime: '10:00-16:00',
    preAdjustmentDays: 2,
    recoveryDuration: '2-4 days',
    keyTips: [
      '✓ Stay hydrated throughout your journey',
      '✓ Adjust to local time upon arrival',
      '✓ Get sunlight exposure at destination',
      '✓ Avoid heavy meals and alcohol during flight',
      '✓ Plan lighter activities for first few days',
    ],
    recommendations: [
      'Choose flights that help you maintain sleep schedule',
      'Consider seat selection for better rest',
      'Pack essentials: eye mask, earplugs, water bottle',
      'Download entertainment for flight',
    ],
  };
}
