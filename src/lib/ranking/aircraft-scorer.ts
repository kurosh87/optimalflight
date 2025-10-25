/**
 * Aircraft Scoring Algorithm - Generation-Based
 *
 * Scores aircraft based on generation (technology level):
 * - Next-gen (787, A350, A220): Score 10 - Latest tech, best cabin environment
 * - Modern (777, A330, 737MAX): Score 7 - Good performance
 * - Legacy (737NG, A320, older widebodies): Score 4 - Older tech
 * - Old (turboprops, very old jets): Score 2
 * - Unknown: Score 5 (neutral)
 *
 * Based on real aircraft in our database, no fabricated specs.
 */

export interface AircraftData {
  iataCode: string;
  generation: 'nextgen' | 'modern' | 'legacy' | 'old' | 'exclude';
  jetlagScore: number; // 10, 7, 4, 2, or 1
}

export interface AircraftScores {
  overallScore: number;       // 10, 7, 4, 2, or 1
  generation: string;         // 'nextgen', 'modern', 'legacy', 'old', 'exclude'
  explanation: string;
}

/**
 * Calculate aircraft jetlag score from generation
 */
export function calculateAircraftScore(aircraft: AircraftData): AircraftScores {
  const explanations = {
    nextgen: 'Latest generation aircraft with best cabin environment and passenger comfort.',
    modern: 'Modern aircraft with good jetlag performance.',
    legacy: 'Older generation aircraft - functional but less optimal for jetlag.',
    old: 'Very old aircraft with basic amenities.',
    exclude: 'Not applicable for commercial jetlag comparison (business jet, cargo, or obsolete).',
  };

  return {
    overallScore: aircraft.jetlagScore,
    generation: aircraft.generation,
    explanation: explanations[aircraft.generation] || explanations.exclude,
  };
}
