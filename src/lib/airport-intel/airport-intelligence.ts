/**
 * Airport Intelligence Data Integration
 * Fetches and processes airport lounge quality, connection complexity, and tier data
 */

import { db } from '@/lib/db';
import { jetlagFacts } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export interface AirportLounge {
  name: string;
  terminal?: string;
  location: 'airside' | 'landside';
  access: string[];
  has_showers: boolean;
  has_sleep_areas: boolean;
  quality_rating: number;
}

export interface AirportIntelligence {
  iataCode: string;

  // Tier classification
  tier: 'tier_1' | 'tier_2' | 'tier_3' | 'unknown';

  // Lounge quality (1-10 scale)
  loungeQualityScore: number;
  hasPremiumLounges: boolean;
  hasShowerFacilities: boolean;
  hasSleepSeating: boolean;
  hasHealthyFood: boolean;
  allLounges: AirportLounge[];
  notableLounges: string[];
  bestForJetlag: string;

  // Sleep pod quality (0-10 scale)
  sleepPodQualityScore: number;
  sleepPodProvider?: string;
  sleepPodType: 'fully_enclosed' | 'semi_private' | 'open_pods' | 'none';
  sleepPodAirsideAvailable: boolean;
  sleepPodCount: number;

  // Shower quality (0-10 scale)
  showerQualityScore: number;
  showerFacilityType?: string;
  showerCount: number;
  showerAirsideAvailable: boolean;

  // Connection complexity (1-10 scale, lower = easier)
  connectionComplexityScore: number;
  minimumConnectionTimeMinutes: number;
  realisticConnectionTimeMinutes?: number;
  requiresSecurityRescreen: boolean;
  requiresTerminalChange: boolean;
  terminalChangeMethod?: string;
  hasFastTrackConnections: boolean;
  majorChallenges: string[];
  connectionTips?: string;

  // Data quality
  loungeConfidence: 'low' | 'medium' | 'high';
  connectionConfidence: 'low' | 'medium' | 'high';
  sleepPodConfidence: 'low' | 'medium' | 'high';
  showerConfidence: 'low' | 'medium' | 'high';
}

/**
 * Fetch airport intelligence for a single airport
 */
export async function getAirportIntelligence(iataCode: string): Promise<AirportIntelligence | null> {
  try {
    const facts = await db
      .select()
      .from(jetlagFacts)
      .where(
        and(
          eq(jetlagFacts.entityType, 'airport'),
          eq(jetlagFacts.entityIataCode, iataCode)
        )
      );

    if (facts.length === 0) {
      return null;
    }

    // Parse facts into structured data
    const factMap = new Map(facts.map(f => [f.propertyName, f.propertyValue]));

    return {
      iataCode,

      // Tier
      tier: (factMap.get('airport_tier') as any) || 'unknown',

      // Lounge quality
      loungeQualityScore: parseFloat(factMap.get('lounge_quality_score') || '5.0'),
      hasPremiumLounges: factMap.get('has_premium_lounges') === 'true',
      hasShowerFacilities: factMap.get('has_shower_facilities') === 'true',
      hasSleepSeating: factMap.get('has_sleep_seating') === 'true',
      hasHealthyFood: factMap.get('has_healthy_food') === 'true',
      allLounges: parseJSON(factMap.get('all_lounges'), []),
      notableLounges: parseJSON(factMap.get('notable_lounges'), []),
      bestForJetlag: factMap.get('best_lounge_for_jetlag') || '',

      // Sleep pod quality
      sleepPodQualityScore: parseFloat(factMap.get('sleep_pod_quality_score') || '0.0'),
      sleepPodProvider: factMap.get('sleep_pod_provider'),
      sleepPodType: (factMap.get('sleep_pod_type') as any) || 'none',
      sleepPodAirsideAvailable: factMap.get('sleep_pod_airside_available') === 'true',
      sleepPodCount: parseInt(factMap.get('sleep_pod_count') || '0'),

      // Shower quality
      showerQualityScore: parseFloat(factMap.get('shower_quality_score') || '0.0'),
      showerFacilityType: factMap.get('shower_facility_type'),
      showerCount: parseInt(factMap.get('shower_count') || '0'),
      showerAirsideAvailable: factMap.get('shower_airside_available') === 'true',

      // Connection complexity
      connectionComplexityScore: parseFloat(factMap.get('connection_complexity_score') || '5.0'),
      minimumConnectionTimeMinutes: parseInt(factMap.get('minimum_connection_time_minutes') || '60'),
      realisticConnectionTimeMinutes: factMap.get('realistic_connection_time_minutes')
        ? parseInt(factMap.get('realistic_connection_time_minutes')!)
        : undefined,
      requiresSecurityRescreen: factMap.get('requires_security_rescreen') === 'true',
      requiresTerminalChange: factMap.get('requires_terminal_change') === 'true',
      terminalChangeMethod: factMap.get('terminal_change_method'),
      hasFastTrackConnections: factMap.get('has_fast_track_connections') === 'true',
      majorChallenges: parseJSON(factMap.get('connection_challenges'), []),
      connectionTips: factMap.get('connection_tips'),

      // Confidence scores
      loungeConfidence: (factMap.get('lounge_confidence') as any) || 'medium',
      connectionConfidence: (factMap.get('connection_confidence') as any) || 'medium',
      sleepPodConfidence: (factMap.get('sleep_pod_confidence') as any) || 'medium',
      showerConfidence: (factMap.get('shower_confidence') as any) || 'medium',
    };
  } catch (error) {
    console.error(`Failed to fetch airport intelligence for ${iataCode}:`, error);
    return null;
  }
}

/**
 * Batch fetch airport intelligence for multiple airports
 * More efficient than individual queries
 */
export async function getAirportIntelligenceBatch(
  iataCodes: string[]
): Promise<Map<string, AirportIntelligence>> {
  if (iataCodes.length === 0) {
    return new Map();
  }

  try {
    const facts = await db
      .select()
      .from(jetlagFacts)
      .where(
        and(
          eq(jetlagFacts.entityType, 'airport'),
          inArray(jetlagFacts.entityIataCode, iataCodes)
        )
      );

    // Group facts by airport
    const factsByAirport = new Map<string, Map<string, string>>();

    for (const fact of facts) {
      // Skip if no IATA code (should never happen for airports, but TypeScript safety)
      if (!fact.entityIataCode) continue;

      if (!factsByAirport.has(fact.entityIataCode)) {
        factsByAirport.set(fact.entityIataCode, new Map());
      }
      factsByAirport.get(fact.entityIataCode)!.set(fact.propertyName, fact.propertyValue);
    }

    // Build airport intelligence for each airport
    const result = new Map<string, AirportIntelligence>();

    for (const [iataCode, factMap] of factsByAirport.entries()) {
      result.set(iataCode, {
        iataCode,

        tier: (factMap.get('airport_tier') as any) || 'unknown',

        loungeQualityScore: parseFloat(factMap.get('lounge_quality_score') || '5.0'),
        hasPremiumLounges: factMap.get('has_premium_lounges') === 'true',
        hasShowerFacilities: factMap.get('has_shower_facilities') === 'true',
        hasSleepSeating: factMap.get('has_sleep_seating') === 'true',
        hasHealthyFood: factMap.get('has_healthy_food') === 'true',
        allLounges: parseJSON(factMap.get('all_lounges'), []),
        notableLounges: parseJSON(factMap.get('notable_lounges'), []),
        bestForJetlag: factMap.get('best_lounge_for_jetlag') || '',

        sleepPodQualityScore: parseFloat(factMap.get('sleep_pod_quality_score') || '0.0'),
        sleepPodProvider: factMap.get('sleep_pod_provider'),
        sleepPodType: (factMap.get('sleep_pod_type') as any) || 'none',
        sleepPodAirsideAvailable: factMap.get('sleep_pod_airside_available') === 'true',
        sleepPodCount: parseInt(factMap.get('sleep_pod_count') || '0'),

        showerQualityScore: parseFloat(factMap.get('shower_quality_score') || '0.0'),
        showerFacilityType: factMap.get('shower_facility_type'),
        showerCount: parseInt(factMap.get('shower_count') || '0'),
        showerAirsideAvailable: factMap.get('shower_airside_available') === 'true',

        connectionComplexityScore: parseFloat(factMap.get('connection_complexity_score') || '5.0'),
        minimumConnectionTimeMinutes: parseInt(factMap.get('minimum_connection_time_minutes') || '60'),
        realisticConnectionTimeMinutes: factMap.get('realistic_connection_time_minutes')
          ? parseInt(factMap.get('realistic_connection_time_minutes')!)
          : undefined,
        requiresSecurityRescreen: factMap.get('requires_security_rescreen') === 'true',
        requiresTerminalChange: factMap.get('requires_terminal_change') === 'true',
        terminalChangeMethod: factMap.get('terminal_change_method'),
        hasFastTrackConnections: factMap.get('has_fast_track_connections') === 'true',
        majorChallenges: parseJSON(factMap.get('connection_challenges'), []),
        connectionTips: factMap.get('connection_tips'),

        loungeConfidence: (factMap.get('lounge_confidence') as any) || 'medium',
        connectionConfidence: (factMap.get('connection_confidence') as any) || 'medium',
        sleepPodConfidence: (factMap.get('sleep_pod_confidence') as any) || 'medium',
        showerConfidence: (factMap.get('shower_confidence') as any) || 'medium',
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to batch fetch airport intelligence:', error);
    return new Map();
  }
}

/**
 * Get airports by tier
 */
export async function getAirportsByTier(tier: 'tier_1' | 'tier_2' | 'tier_3'): Promise<string[]> {
  try {
    const facts = await db
      .select()
      .from(jetlagFacts)
      .where(
        and(
          eq(jetlagFacts.entityType, 'airport'),
          eq(jetlagFacts.propertyName, 'airport_tier'),
          eq(jetlagFacts.propertyValue, tier)
        )
      );

    return facts.map(f => f.entityIataCode).filter((code): code is string => code !== null);
  } catch (error) {
    console.error(`Failed to fetch ${tier} airports:`, error);
    return [];
  }
}

/**
 * Get top airports for lounge quality
 */
export async function getTopLoungeAirports(limit: number = 20): Promise<Array<{ iataCode: string; score: number }>> {
  try {
    const facts = await db
      .select()
      .from(jetlagFacts)
      .where(
        and(
          eq(jetlagFacts.entityType, 'airport'),
          eq(jetlagFacts.propertyName, 'lounge_quality_score')
        )
      );

    return facts
      .map(f => ({ iataCode: f.entityIataCode, score: parseFloat(f.propertyValue) }))
      .filter((item): item is { iataCode: string; score: number } => item.iataCode !== null && item.score >= 7.0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch top lounge airports:', error);
    return [];
  }
}

/**
 * Get easiest connection airports (lowest complexity score)
 */
export async function getEasiestConnectionAirports(limit: number = 20): Promise<Array<{ iataCode: string; score: number }>> {
  try {
    const facts = await db
      .select()
      .from(jetlagFacts)
      .where(
        and(
          eq(jetlagFacts.entityType, 'airport'),
          eq(jetlagFacts.propertyName, 'connection_complexity_score')
        )
      );

    return facts
      .map(f => ({ iataCode: f.entityIataCode, score: parseFloat(f.propertyValue) }))
      .filter((item): item is { iataCode: string; score: number } => item.iataCode !== null && item.score <= 5.0)
      .sort((a, b) => a.score - b.score) // Lower is better
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch easiest connection airports:', error);
    return [];
  }
}

/**
 * Calculate layover suitability score
 * Combines lounge quality and connection complexity
 */
export function calculateLayoverScore(intel: AirportIntelligence): {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  reasons: string[];
} {
  // Lounge quality (0-100, higher is better)
  const loungeContribution = intel.loungeQualityScore * 6; // Convert 1-10 to 0-60

  // Connection complexity (0-100, inverted so lower complexity = higher score)
  const connectionContribution = (10 - intel.connectionComplexityScore) * 4; // Convert 1-10 to 0-40

  const totalScore = loungeContribution + connectionContribution;

  // Grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 60) grade = 'C';
  else if (totalScore >= 50) grade = 'D';
  else grade = 'F';

  // Reasons
  const reasons: string[] = [];

  if (intel.loungeQualityScore >= 8) {
    reasons.push('Excellent lounges for rest and recovery');
  }
  if (intel.hasShowerFacilities && intel.hasSleepSeating) {
    reasons.push('Shower and sleep facilities available');
  }
  if (intel.connectionComplexityScore <= 3) {
    reasons.push('Easy connections with minimal walking');
  }
  if (intel.hasFastTrackConnections) {
    reasons.push('Fast-track security for connections');
  }
  if (intel.requiresSecurityRescreen) {
    reasons.push('⚠️ Security re-screening required');
  }
  if (intel.majorChallenges.length > 0) {
    reasons.push(`⚠️ ${intel.majorChallenges[0]}`);
  }

  return { score: Math.round(totalScore), grade, reasons };
}

// Helper function to safely parse JSON
function parseJSON<T>(value: string | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

// Export default intelligence for airports without data
export const DEFAULT_AIRPORT_INTELLIGENCE: AirportIntelligence = {
  iataCode: '',
  tier: 'unknown',
  loungeQualityScore: 5.0,
  hasPremiumLounges: false,
  hasShowerFacilities: false,
  hasSleepSeating: false,
  hasHealthyFood: false,
  allLounges: [],
  notableLounges: [],
  bestForJetlag: 'Standard airport facilities',
  sleepPodQualityScore: 0.0,
  sleepPodProvider: undefined,
  sleepPodType: 'none',
  sleepPodAirsideAvailable: false,
  sleepPodCount: 0,
  showerQualityScore: 0.0,
  showerFacilityType: undefined,
  showerCount: 0,
  showerAirsideAvailable: false,
  connectionComplexityScore: 5.0,
  minimumConnectionTimeMinutes: 60,
  requiresSecurityRescreen: false,
  requiresTerminalChange: false,
  hasFastTrackConnections: false,
  majorChallenges: [],
  loungeConfidence: 'low',
  connectionConfidence: 'low',
  sleepPodConfidence: 'low',
  showerConfidence: 'low',
};
