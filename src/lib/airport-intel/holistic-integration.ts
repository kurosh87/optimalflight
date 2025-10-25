/**
 * Airport Intelligence → Holistic Scorer Integration
 * Maps airport intelligence data to holistic scoring system
 *
 * UPDATED: Uses V2 (consolidated airport_intelligence table)
 */

import { AirportIntelligence } from './airport-intelligence-v2';
import { AirportFacilities } from '../ranking/holistic-scorer';

/**
 * Convert AirportIntelligence to AirportFacilities format
 * for use in holistic scoring system
 */
/**
 * Extended airport facilities with derived scores
 */
export interface ExtendedAirportFacilities extends AirportFacilities {
  jetlagSupportScore: number;
  comfortScore: number;
  stressScore: number;
}

export function airportIntelToFacilities(intel: AirportIntelligence): ExtendedAirportFacilities {
  return {
    // Core recovery facilities
    sleepPods: intel.hasSleepSeating,
    showers: intel.hasShowerFacilities,
    outdoorAccess: false, // Not tracked in airport intel (yet)
    outdoorAccessRequiresResecurity: undefined,
    loungeAccess: intel.hasPremiumLounges || intel.notableLounges.length > 0,
    quietZones: intel.hasPremiumLounges, // Premium lounges typically have quiet zones

    // Additional recovery facilities
    gyms: false, // Not in current airport intel data
    spas: false, // Not in current airport intel data
    meditationRooms: false, // Not in current airport intel data
    healthyFoodAvailable: intel.hasHealthyFood,

    // Quality metrics - KEY ENHANCEMENTS
    loungeQuality: intel.loungeQualityScore, // 0-10 scale from GPT-5 assessment
    naturalLightQuality: undefined, // Not yet tracked

    // Stress factors - from connection complexity
    securityWaitMinutes: intel.requiresSecurityRescreen ? 30 : 15, // Estimated wait
    terminalDistanceMeters: intel.requiresTerminalChange ? 500 : 100, // Estimated (renamed from terminalWalkingDistanceMeters)
    noiseLevel: undefined, // Not tracked
    wifiQuality: undefined, // Not tracked

    // Operating hours - not yet in intel data
    facilityHours: undefined,

    // Peak congestion - not yet in intel data
    peakCongestionHours: undefined,

    // Overall scores - derived from intelligence (EXTENDED)
    comfortScore: deriveComfortScore(intel),
    stressScore: deriveStressScore(intel),
    jetlagSupportScore: deriveJetlagSupportScore(intel),
  };
}

/**
 * Derive comfort score from airport intelligence
 */
function deriveComfortScore(intel: AirportIntelligence): number {
  let score = 5.0; // Base score

  // Lounge quality is primary driver (0-5 points)
  score += (intel.loungeQualityScore / 10) * 5;

  // Amenities boost
  if (intel.hasPremiumLounges) score += 1.0;
  if (intel.hasShowerFacilities) score += 0.5;
  if (intel.hasSleepSeating) score += 0.5;
  if (intel.hasHealthyFood) score += 0.3;

  // Connection ease affects comfort
  if (intel.connectionComplexityScore <= 3) {
    score += 0.5; // Easy connections reduce stress
  }

  return Math.min(10, Math.max(0, score));
}

/**
 * Derive stress score from airport intelligence
 * Lower score = less stress (0-10 scale)
 */
function deriveStressScore(intel: AirportIntelligence): number {
  // Start with connection complexity as base (1-10, higher = more stress)
  let stress = intel.connectionComplexityScore;

  // Reduce stress if good facilities available
  if (intel.loungeQualityScore >= 7) {
    stress -= 1.0; // Good lounges reduce stress
  }

  if (intel.hasFastTrackConnections) {
    stress -= 0.5; // Fast-track reduces stress
  }

  // Increase stress for challenges
  if (intel.requiresSecurityRescreen) {
    stress += 1.0;
  }

  if (intel.majorChallenges.length > 2) {
    stress += 0.5;
  }

  return Math.min(10, Math.max(0, stress));
}

/**
 * Derive jetlag support score from airport intelligence
 * ENHANCED: Now uses sleep pod and shower quality scores
 */
function deriveJetlagSupportScore(intel: AirportIntelligence): number {
  let score = 0;

  // Lounge quality (0-3 points) - reduced from 4 to make room for new scores
  score += (intel.loungeQualityScore / 10) * 3;

  // Sleep pod quality (0-3 points) - ENHANCED with actual quality scores
  if (intel.sleepPodQualityScore > 0) {
    score += (intel.sleepPodQualityScore / 10) * 3;
  } else if (intel.hasSleepSeating) {
    score += 1.5; // Fallback if quality score unavailable
  } else if (intel.hasPremiumLounges) {
    score += 0.5; // Premium lounges may have rest areas
  }

  // Shower quality (0-2 points) - ENHANCED with actual quality scores
  if (intel.showerQualityScore > 0) {
    score += (intel.showerQualityScore / 10) * 2;
  } else if (intel.hasShowerFacilities) {
    score += 1; // Fallback if quality score unavailable
  }

  // Healthy food (0-1 point)
  if (intel.hasHealthyFood) score += 1;

  // Connection ease (0-1 point) - less stress helps recovery
  if (intel.connectionComplexityScore <= 3) {
    score += 1;
  }

  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate enhanced layover quality score using airport intelligence
 * Replaces simplified boolean logic with rich data
 */
export function calculateEnhancedLayoverQuality(
  intel: AirportIntelligence,
  layoverDurationMinutes: number,
  isInternationalConnection: boolean
): number {
  let score = 50; // Base score

  // === 1. DURATION FACTOR (30 points) ===
  const optimalMin = 90;
  const optimalMax = 180;

  if (layoverDurationMinutes < optimalMin) {
    // Too short
    const penalty = ((optimalMin - layoverDurationMinutes) / optimalMin) * 30;
    score -= penalty;
  } else if (layoverDurationMinutes > optimalMax) {
    // Too long - but facilities make it better
    const excessMinutes = layoverDurationMinutes - optimalMax;
    const facilityBonus = intel.loungeQualityScore / 10; // 0-1 multiplier
    const penalty = (excessMinutes / 120) * (30 * (1 - facilityBonus * 0.5));
    score -= penalty;
  } else {
    // Perfect duration
    score += 10;
  }

  // === 2. LOUNGE QUALITY (25 points) ===
  score += (intel.loungeQualityScore / 10) * 25;

  // === 3. CONNECTION COMPLEXITY (20 points) ===
  // Invert complexity: lower complexity = higher score
  score += ((10 - intel.connectionComplexityScore) / 10) * 20;

  // === 4. RECOVERY FACILITIES (15 points) ===
  if (intel.hasShowerFacilities) score += 5;
  if (intel.hasSleepSeating) score += 5;
  if (intel.hasHealthyFood) score += 3;
  if (intel.hasPremiumLounges) score += 2;

  // === 5. STRESS FACTORS (10 points penalty) ===
  if (intel.requiresSecurityRescreen) {
    score -= 5;
    // Even worse if layover is short
    if (layoverDurationMinutes < 120) {
      score -= 3;
    }
  }

  if (isInternationalConnection && !intel.hasFastTrackConnections) {
    score -= 2;
  }

  // === MINIMUM CONNECTION TIME CHECK ===
  if (layoverDurationMinutes < intel.minimumConnectionTimeMinutes) {
    // Below MCT - severe penalty
    const deficit = intel.minimumConnectionTimeMinutes - layoverDurationMinutes;
    score -= (deficit / 10) * 5; // -5 points per 10 minutes under MCT
  }

  // === RECOMMENDED TIME BONUS ===
  if (intel.realisticConnectionTimeMinutes &&
      layoverDurationMinutes >= intel.realisticConnectionTimeMinutes) {
    score += 5; // Bonus for meeting recommended time
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Get connection advice based on intelligence
 */
export function getConnectionAdvice(intel: AirportIntelligence, layoverMinutes: number): {
  recommendation: 'excellent' | 'good' | 'marginal' | 'risky' | 'insufficient';
  reasons: string[];
  tips: string[];
} {
  const reasons: string[] = [];
  const tips: string[] = [];
  let recommendation: 'excellent' | 'good' | 'marginal' | 'risky' | 'insufficient';

  // Check against MCT
  if (layoverMinutes < intel.minimumConnectionTimeMinutes) {
    recommendation = 'insufficient';
    reasons.push(`Below minimum connection time (${intel.minimumConnectionTimeMinutes}min)`);
    tips.push('Consider a longer layover or different routing');
  } else if (layoverMinutes < (intel.realisticConnectionTimeMinutes || intel.minimumConnectionTimeMinutes * 1.2)) {
    recommendation = 'risky';
    reasons.push('Tight connection - delays could cause missed flight');
    if (intel.hasFastTrackConnections) {
      tips.push('Use fast-track if eligible');
    }
  } else if (layoverMinutes < 120) {
    recommendation = 'marginal';
    reasons.push('Adequate time but limited facility access');
  } else if (layoverMinutes < 240) {
    recommendation = 'good';
    reasons.push('Good balance of connection time and facility access');
    if (intel.loungeQualityScore >= 7) {
      tips.push(`Take advantage of ${intel.notableLounges[0] || 'airport lounges'}`);
    }
  } else {
    recommendation = 'excellent';
    reasons.push('Ample time to rest and recover');
    if (intel.hasShowerFacilities) {
      tips.push('Freshen up with a shower');
    }
    if (intel.hasSleepSeating) {
      tips.push('Take a nap in sleep pods or lounge');
    }
  }

  // Add intelligence-specific tips
  if (intel.connectionTips) {
    tips.push(intel.connectionTips);
  }

  if (intel.requiresSecurityRescreen) {
    tips.push('⚠️ Allow extra time for security re-screening');
  }

  if (intel.bestForJetlag) {
    tips.push(intel.bestForJetlag);
  }

  return { recommendation, reasons, tips };
}
