/**
 * User-Facing Adaptation Language
 *
 * Converts internal "east/west" direction into user-friendly language
 * that describes what the user actually needs to do (advance/delay sleep).
 */

export interface AdaptationMessage {
  type: 'advance' | 'delay' | 'none';
  shortDescription: string;
  detailedDescription: string;
  strategy: string;
  difficultyLevel: 'easy' | 'moderate' | 'hard' | 'very_hard';
  userFriendlyDirection: string;
}

export function getAdaptationMessage(
  direction: 'east' | 'west' | 'none',
  hours: number,
  origin: string,
  destination: string
): AdaptationMessage {
  if (direction === 'none' || hours === 0) {
    return {
      type: 'none',
      shortDescription: 'No timezone adjustment needed',
      detailedDescription: `${origin} and ${destination} are in the same timezone. You won't experience jetlag from this flight.`,
      strategy: 'Maintain your normal sleep schedule',
      difficultyLevel: 'easy',
      userFriendlyDirection: 'Same timezone'
    };
  }

  if (direction === 'east') {
    // Eastward = advance sleep (go to bed earlier, wake up earlier)
    const difficulty = hours <= 3 ? 'moderate' : hours <= 6 ? 'hard' : 'very_hard';

    return {
      type: 'advance',
      shortDescription: `Advance your sleep schedule by ${hours} hours`,
      detailedDescription: `Your body needs to shift to an earlier sleep schedule. You'll need to go to bed ${hours} hours earlier than your body expects.`,
      strategy: `Gradually shift your bedtime earlier by 1-2 hours per day. Use morning bright light and avoid evening light to help your body adjust.`,
      difficultyLevel: difficulty,
      userFriendlyDirection: `${hours}h earlier` + (hours > 6 ? ' (challenging)' : '')
    };
  } else {
    // Westward = delay sleep (stay up later, wake up later)
    const difficulty = hours <= 4 ? 'easy' : hours <= 8 ? 'moderate' : 'hard';

    return {
      type: 'delay',
      shortDescription: `Delay your sleep schedule by ${hours} hours`,
      detailedDescription: `Your body needs to shift to a later sleep schedule. You'll need to stay up ${hours} hours later than your body expects.`,
      strategy: `Gradually shift your bedtime later by 2-3 hours per day. Use evening bright light and avoid morning light to help your body adjust.`,
      difficultyLevel: difficulty,
      userFriendlyDirection: `${hours}h later` + (hours > 8 ? ' (moderate effort)' : '')
    };
  }
}

/**
 * Get a simple user-friendly summary for display in UI
 */
export function getSimpleSummary(
  direction: 'east' | 'west' | 'none',
  hours: number,
  recoveryDays: number
): string {
  if (direction === 'none') {
    return 'No jetlag - same timezone';
  }

  const adaptationType = direction === 'east' ? 'advance' : 'delay';
  const action = direction === 'east' ? 'earlier' : 'later';

  return `${hours}h ${action} • ${recoveryDays} day${recoveryDays === 1 ? '' : 's'} recovery`;
}

/**
 * Get emoji indicator for difficulty
 */
export function getDifficultyEmoji(difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard'): string {
  switch (difficulty) {
    case 'easy': return '✅';
    case 'moderate': return '⚠️';
    case 'hard': return '🔴';
    case 'very_hard': return '💀';
  }
}

/**
 * Explain why geographic direction ≠ circadian direction
 * For user education / help docs
 */
export function explainGeographicVsCircadian(
  flightDirection: 'east' | 'west',
  adaptationDirection: 'east' | 'west',
  hours: number
): string | null {
  // If they match, no explanation needed
  if (flightDirection === adaptationDirection) {
    return null;
  }

  // They don't match - this happens with date line crossings
  return `Note: Although you're flying ${flightDirection}ward, your body will adapt ${adaptationDirection}ward. ` +
         `This is because adjusting ${hours} hours ${adaptationDirection}ward is faster than going ${24 - hours} hours ${flightDirection}ward. ` +
         `Your circadian rhythm takes the shortest path on the 24-hour clock.`;
}
