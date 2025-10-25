/**
 * Jet lag utility functions for calculating recovery time and recommendations
 * Based on scientific research and circadian rhythm principles
 *
 * Key Research Findings:
 * - Circadian clock adjusts ~1-1.5 hours per day
 * - Eastward travel is harder (phase advance) than westward (phase delay)
 * - Light exposure is the primary zeitgeber for circadian adjustment
 * - Age, sleep quality, and individual adaptability affect recovery
 */

interface TimezoneInfo {
  timezone: string;
  offsetHours: number;
}

export interface UserProfile {
  age?: number; // Age affects adaptation speed
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  adaptabilityLevel?: 'low' | 'medium' | 'high';
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';
}

/**
 * Calculate the timezone offset difference in hours
 */
export function getTimezoneOffsetDifference(fromTz: string, toTz: string): number {
  const now = new Date();

  // Get offset for source timezone
  const fromOffset = new Date(now.toLocaleString('en-US', { timeZone: fromTz })).getTime() -
                     new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();

  // Get offset for destination timezone
  const toOffset = new Date(now.toLocaleString('en-US', { timeZone: toTz })).getTime() -
                   new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();

  return Math.abs((toOffset - fromOffset) / (1000 * 60 * 60));
}

/**
 * Calculate estimated jet lag recovery days
 * Rule of thumb: ~1 day per timezone crossed when traveling east,
 * ~0.5 days per timezone when traveling west
 */
export function calculateRecoveryDays(
  fromTz: string,
  toTz: string,
  direction: 'east' | 'west' | 'unknown' = 'unknown'
): number {
  const hoursDiff = getTimezoneOffsetDifference(fromTz, toTz);

  if (hoursDiff <= 2) return 0; // Minimal jet lag

  // Eastward travel is harder to adjust to
  const multiplier = direction === 'east' ? 1 : direction === 'west' ? 0.5 : 0.75;

  return Math.ceil(hoursDiff * multiplier);
}

/**
 * Generate recovery timeline with recommendations
 */
export interface RecoveryPhase {
  day: number;
  phase: string;
  recommendations: string[];
  sleepWindow: { start: number; end: number }; // Hours in local time (24hr format)
}

export function generateRecoveryTimeline(
  timezonesDiff: number,
  arrivalTime: Date,
  destinationTz: string
): RecoveryPhase[] {
  const recoveryDays = Math.ceil(timezonesDiff * 0.75);
  const timeline: RecoveryPhase[] = [];

  for (let day = 0; day <= recoveryDays; day++) {
    const phase: RecoveryPhase = {
      day,
      phase: day === 0 ? 'Arrival Day' : day === recoveryDays ? 'Full Recovery' : `Adjustment Day ${day}`,
      recommendations: [],
      sleepWindow: { start: 22, end: 7 },
    };

    if (day === 0) {
      phase.recommendations = [
        'Stay awake until local bedtime if possible',
        'Get natural sunlight exposure in the afternoon',
        'Avoid caffeine after 2 PM',
        'Stay hydrated throughout the day',
      ];
      phase.sleepWindow = { start: 22, end: 7 };
    } else if (day === 1) {
      phase.recommendations = [
        'Wake up at consistent local time',
        'Eat meals according to local schedule',
        'Exercise in morning or early afternoon',
        'Limit screen time before bed',
      ];
      phase.sleepWindow = { start: 22, end: 6 };
    } else if (day < recoveryDays) {
      phase.recommendations = [
        'Maintain consistent sleep schedule',
        'Continue light exercise routine',
        'Avoid long naps (max 20-30 min)',
        'Stay socially active',
      ];
      phase.sleepWindow = { start: 23, end: 7 };
    } else {
      phase.recommendations = [
        'Fully adjusted to local timezone',
        'Maintain healthy sleep habits',
        'Continue regular exercise',
        'Stay hydrated',
      ];
      phase.sleepWindow = { start: 23, end: 7 };
    }

    timeline.push(phase);
  }

  return timeline;
}

/**
 * Get current phase of jet lag recovery
 */
export function getCurrentRecoveryPhase(
  arrivalTime: Date,
  timezonesDiff: number
): { currentDay: number; totalDays: number; percentage: number } {
  const now = new Date();
  const hoursSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60 * 60);
  const daysSinceArrival = Math.floor(hoursSinceArrival / 24);
  const totalDays = Math.ceil(timezonesDiff * 0.75);

  return {
    currentDay: Math.min(daysSinceArrival, totalDays),
    totalDays,
    percentage: Math.min((daysSinceArrival / totalDays) * 100, 100),
  };
}

/**
 * Determine travel direction (east or west)
 */
export function getTravelDirection(fromLng: number, toLng: number): 'east' | 'west' {
  // Normalize longitudes to -180 to 180
  const normFrom = ((fromLng + 180) % 360) - 180;
  const normTo = ((toLng + 180) % 360) - 180;

  const diff = normTo - normFrom;

  // If difference is positive and less than 180, or negative and less than -180, traveling east
  if ((diff > 0 && diff < 180) || (diff < -180)) {
    return 'east';
  }

  return 'west';
}

/**
 * Calculate personalized recovery days based on user profile
 * Research-based algorithm accounting for individual factors
 */
export function calculatePersonalizedRecoveryDays(
  timezonesDiff: number,
  direction: 'east' | 'west',
  userProfile?: UserProfile
): number {
  if (timezonesDiff <= 2) return 0; // Minimal jet lag

  // Base recovery rate: 1-1.5 hours adjustment per day
  // Eastward: ~1 hour/day, Westward: ~1.5 hours/day
  let baseRecoveryRate = direction === 'east' ? 1.0 : 1.5;

  // Adjustment factors based on user profile
  let recoveryMultiplier = 1.0;

  if (userProfile) {
    // Age factor: Older adults recover more slowly
    if (userProfile.age) {
      if (userProfile.age > 60) recoveryMultiplier *= 1.3;
      else if (userProfile.age > 45) recoveryMultiplier *= 1.15;
      else if (userProfile.age < 30) recoveryMultiplier *= 0.9;
    }

    // Sleep quality factor
    switch (userProfile.sleepQuality) {
      case 'excellent':
        recoveryMultiplier *= 0.85;
        break;
      case 'good':
        recoveryMultiplier *= 0.95;
        break;
      case 'fair':
        recoveryMultiplier *= 1.1;
        break;
      case 'poor':
        recoveryMultiplier *= 1.3;
        break;
    }

    // Adaptability factor
    switch (userProfile.adaptabilityLevel) {
      case 'high':
        recoveryMultiplier *= 0.8;
        break;
      case 'medium':
        recoveryMultiplier *= 1.0;
        break;
      case 'low':
        recoveryMultiplier *= 1.2;
        break;
    }

    // Exercise frequency (improves circadian adaptation)
    switch (userProfile.exerciseFrequency) {
      case 'active':
        recoveryMultiplier *= 0.9;
        break;
      case 'moderate':
        recoveryMultiplier *= 0.95;
        break;
      case 'light':
        recoveryMultiplier *= 1.0;
        break;
      case 'sedentary':
        recoveryMultiplier *= 1.15;
        break;
    }
  }

  // Calculate recovery days
  const daysToRecover = (timezonesDiff / baseRecoveryRate) * recoveryMultiplier;

  return Math.ceil(daysToRecover);
}

/**
 * Generate personalized recovery timeline with science-based recommendations
 */
export function generatePersonalizedRecoveryTimeline(
  timezonesDiff: number,
  direction: 'east' | 'west',
  arrivalTime: Date,
  destinationTz: string,
  userProfile?: UserProfile
): RecoveryPhase[] {
  const recoveryDays = calculatePersonalizedRecoveryDays(timezonesDiff, direction, userProfile);
  const timeline: RecoveryPhase[] = [];

  for (let day = 0; day <= recoveryDays; day++) {
    const adjustmentProgress = day / recoveryDays;

    const phase: RecoveryPhase = {
      day,
      phase: day === 0 ? 'Arrival Day' : day === recoveryDays ? 'Full Recovery' : `Day ${day}`,
      recommendations: [],
      sleepWindow: { start: 22, end: 7 },
    };

    // Day-specific recommendations based on circadian science
    if (day === 0) {
      // Arrival day - critical for setting initial anchor
      phase.phase = 'Arrival & Anchoring';
      phase.recommendations = [
        direction === 'east'
          ? 'Seek bright light in the afternoon (3-7 PM local time)'
          : 'Seek bright light in the morning (7-11 AM local time)',
        'Stay awake until at least 9 PM local time',
        'Avoid heavy meals 3 hours before bedtime',
        'Take 0.5-3mg melatonin 30min before sleep (if eastward)',
        'Stay well hydrated - drink water regularly',
      ];
      phase.sleepWindow = { start: 22, end: 7 };
    } else if (day === 1) {
      phase.phase = 'Initial Adjustment';
      phase.recommendations = [
        'Wake at consistent time (7 AM local)',
        direction === 'east'
          ? 'Morning light exposure (6-9 AM) to advance clock'
          : 'Afternoon light exposure (3-6 PM) to delay clock',
        'Eat protein-rich breakfast within 1 hour of waking',
        'Light exercise (20-30 min walk) in the morning',
        'Avoid caffeine after 2 PM',
        'Strategic nap allowed: 20 min max, before 3 PM',
      ];
      phase.sleepWindow = { start: 22, end: 6 };
    } else if (adjustmentProgress < 0.5) {
      // Early adjustment phase
      phase.phase = 'Early Adaptation';
      phase.recommendations = [
        'Maintain strict sleep-wake schedule',
        'Outdoor light exposure: 30-60 minutes daily',
        'Eat meals at local times to entrain circadian rhythm',
        'Exercise in morning (boosts alertness)',
        'Limit blue light 2 hours before sleep',
        'Consider light melatonin if still struggling with sleep',
      ];
      phase.sleepWindow = { start: 22, end: 6 };
    } else if (adjustmentProgress < 0.8) {
      // Mid adjustment phase
      phase.phase = 'Progressive Adaptation';
      phase.recommendations = [
        'Continue consistent wake time',
        'Increase exercise intensity if comfortable',
        'Social activities aligned with local schedule',
        'Monitor and adjust caffeine intake',
        'Practice good sleep hygiene',
      ];
      phase.sleepWindow = { start: 23, end: 7 };
    } else if (day < recoveryDays) {
      // Late adjustment phase
      phase.phase = 'Final Adjustment';
      phase.recommendations = [
        'Nearly adjusted - maintain consistency',
        'Resume normal exercise routine',
        'Continue avoiding late caffeine',
        'Focus on sleep quality optimization',
      ];
      phase.sleepWindow = { start: 23, end: 7 };
    } else {
      // Fully recovered
      phase.phase = 'Fully Adapted';
      phase.recommendations = [
        'Circadian rhythm fully synchronized',
        'Maintain healthy sleep habits',
        'Continue regular exercise routine',
        'Stay hydrated and eat balanced meals',
        'Consider pre-adjusting for next trip',
      ];
      phase.sleepWindow = { start: 23, end: 7 };
    }

    timeline.push(phase);
  }

  return timeline;
}

/**
 * Calculate jet lag severity score (0-10)
 * Higher score = more severe jet lag
 */
export function calculateJetLagSeverity(
  timezonesDiff: number,
  direction: 'east' | 'west',
  flightDuration: number, // in hours
  userProfile?: UserProfile
): { score: number; severity: string; description: string } {
  let score = 0;

  // Timezone difference impact (0-4 points)
  score += Math.min(timezonesDiff * 0.5, 4);

  // Direction impact (0-2 points) - eastward is harder
  score += direction === 'east' ? 2 : 1;

  // Flight duration impact (0-2 points)
  score += Math.min(flightDuration / 6, 2);

  // User profile adjustments
  if (userProfile) {
    if (userProfile.age && userProfile.age > 60) score += 1;
    if (userProfile.sleepQuality === 'poor') score += 1;
    if (userProfile.adaptabilityLevel === 'low') score += 0.5;
    if (userProfile.sleepQuality === 'excellent') score -= 0.5;
    if (userProfile.adaptabilityLevel === 'high') score -= 0.5;
  }

  // Normalize to 0-10 scale
  score = Math.max(0, Math.min(10, score));

  let severity: string;
  let description: string;

  if (score <= 2) {
    severity = 'Minimal';
    description = 'Little to no jet lag expected. Minor adjustments may be needed.';
  } else if (score <= 4) {
    severity = 'Mild';
    description = 'Mild jet lag. You may experience some fatigue and sleep disruption.';
  } else if (score <= 6) {
    severity = 'Moderate';
    description = 'Moderate jet lag. Expect noticeable fatigue, sleep issues, and reduced alertness.';
  } else if (score <= 8) {
    severity = 'Severe';
    description = 'Severe jet lag. Significant impact on sleep, mood, and cognitive function expected.';
  } else {
    severity = 'Very Severe';
    description = 'Very severe jet lag. Major disruption to circadian rhythm. Follow recovery plan carefully.';
  }

  return { score: Math.round(score * 10) / 10, severity, description };
}
