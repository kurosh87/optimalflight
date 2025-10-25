/**
 * Airport Intelligence V2 - CONSOLIDATED VERSION
 *
 * Uses airport_intelligence table instead of jetlag_facts
 * All data in proper JSON columns, no key-value mess
 */

import { db } from '@/lib/db';
import { airportIntelligence, airports } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

// ============================================================================
// TYPES (Same interface, better data source)
// ============================================================================

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

// ============================================================================
// FETCH FROM airport_intelligence TABLE
// ============================================================================

/**
 * Fetch airport intelligence from airport_intelligence table
 * Uses JSON columns instead of key-value pairs
 */
export async function getAirportIntelligence(iataCode: string): Promise<AirportIntelligence | null> {
  try {
    const result = await db
      .select()
      .from(airportIntelligence)
      .where(eq(airportIntelligence.iataCode, iataCode))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const record = result[0];

    // Parse JSON fields
    const jetlagData = parseJSON(record.jetlagRecoveryData, {});
    const loungeData = parseJSON(record.loungesData, {});
    const navData = parseJSON(record.navigationData, {});

    return {
      iataCode: record.iataCode || iataCode,

      // Tier from database
      tier: (record.tierPriority as any) || 'unknown',

      // Lounge quality from JSON
      loungeQualityScore: jetlagData.loungeQualityScore || loungeData.overallQuality || 5.0,
      hasPremiumLounges: loungeData.hasPremiumLounges || false,
      hasShowerFacilities: jetlagData.hasShowerFacilities || loungeData.hasShowers || false,
      hasSleepSeating: jetlagData.hasSleepPods || jetlagData.hasSleepSeating || false,
      hasHealthyFood: jetlagData.hasHealthyFood || false,
      allLounges: loungeData.lounges || [],
      notableLounges: loungeData.notableLounges || [],
      bestForJetlag: loungeData.bestForJetlag || jetlagData.bestLounge || '',

      // Sleep pod quality from jetlagData
      sleepPodQualityScore: jetlagData.sleepPodQualityScore || 0.0,
      sleepPodProvider: jetlagData.sleepPodProvider,
      sleepPodType: jetlagData.sleepPodType || 'none',
      sleepPodAirsideAvailable: jetlagData.sleepPodAirsideAvailable || false,
      sleepPodCount: jetlagData.sleepPodCount || 0,

      // Shower quality from jetlagData
      showerQualityScore: jetlagData.showerQualityScore || 0.0,
      showerFacilityType: jetlagData.showerFacilityType,
      showerCount: jetlagData.showerCount || 0,
      showerAirsideAvailable: jetlagData.showerAirsideAvailable || false,

      // Connection complexity from navigation data
      connectionComplexityScore: navData.complexityScore || 5.0,
      minimumConnectionTimeMinutes: navData.minimumConnectionTime || 60,
      realisticConnectionTimeMinutes: navData.realisticConnectionTime,
      requiresSecurityRescreen: navData.requiresSecurityRescreen || false,
      requiresTerminalChange: navData.requiresTerminalChange || false,
      terminalChangeMethod: navData.terminalChangeMethod,
      hasFastTrackConnections: navData.hasFastTrack || false,
      majorChallenges: navData.challenges || [],
      connectionTips: navData.tips,

      // Confidence from data quality
      loungeConfidence: (loungeData.confidence as any) || 'medium',
      connectionConfidence: (navData.confidence as any) || 'medium',
      sleepPodConfidence: (jetlagData.sleepPodConfidence as any) || 'medium',
      showerConfidence: (jetlagData.showerConfidence as any) || 'medium',
    };
  } catch (error) {
    console.error(`Failed to fetch airport intelligence for ${iataCode}:`, error);
    return null;
  }
}

/**
 * Batch fetch airport intelligence
 * MUCH more efficient than individual queries
 */
export async function getAirportIntelligenceBatch(
  iataCodes: string[]
): Promise<Map<string, AirportIntelligence>> {
  if (iataCodes.length === 0) {
    return new Map();
  }

  try {
    const uniqueCodes = [...new Set(iataCodes)];

    const results = await db
      .select()
      .from(airportIntelligence)
      .where(inArray(airportIntelligence.iataCode, uniqueCodes));

    const intelMap = new Map<string, AirportIntelligence>();

    for (const record of results) {
      if (!record.iataCode) continue;

      // Parse JSON fields
      const jetlagData = parseJSON(record.jetlagRecoveryData, {});
      const loungeData = parseJSON(record.loungesData, {});
      const navData = parseJSON(record.navigationData, {});

      intelMap.set(record.iataCode, {
        iataCode: record.iataCode,

        tier: (record.tierPriority as any) || 'unknown',

        loungeQualityScore: jetlagData.loungeQualityScore || loungeData.overallQuality || 5.0,
        hasPremiumLounges: loungeData.hasPremiumLounges || false,
        hasShowerFacilities: jetlagData.hasShowerFacilities || loungeData.hasShowers || false,
        hasSleepSeating: jetlagData.hasSleepPods || jetlagData.hasSleepSeating || false,
        hasHealthyFood: jetlagData.hasHealthyFood || false,
        allLounges: loungeData.lounges || [],
        notableLounges: loungeData.notableLounges || [],
        bestForJetlag: loungeData.bestForJetlag || jetlagData.bestLounge || '',

        // Sleep pod quality from jetlagData
        sleepPodQualityScore: jetlagData.sleepPodQualityScore || 0.0,
        sleepPodProvider: jetlagData.sleepPodProvider,
        sleepPodType: jetlagData.sleepPodType || 'none',
        sleepPodAirsideAvailable: jetlagData.sleepPodAirsideAvailable || false,
        sleepPodCount: jetlagData.sleepPodCount || 0,

        // Shower quality from jetlagData
        showerQualityScore: jetlagData.showerQualityScore || 0.0,
        showerFacilityType: jetlagData.showerFacilityType,
        showerCount: jetlagData.showerCount || 0,
        showerAirsideAvailable: jetlagData.showerAirsideAvailable || false,

        connectionComplexityScore: navData.complexityScore || 5.0,
        minimumConnectionTimeMinutes: navData.minimumConnectionTime || 60,
        realisticConnectionTimeMinutes: navData.realisticConnectionTime,
        requiresSecurityRescreen: navData.requiresSecurityRescreen || false,
        requiresTerminalChange: navData.requiresTerminalChange || false,
        terminalChangeMethod: navData.terminalChangeMethod,
        hasFastTrackConnections: navData.hasFastTrack || false,
        majorChallenges: navData.challenges || [],
        connectionTips: navData.tips,

        loungeConfidence: (loungeData.confidence as any) || 'medium',
        connectionConfidence: (navData.confidence as any) || 'medium',
        sleepPodConfidence: (jetlagData.sleepPodConfidence as any) || 'medium',
        showerConfidence: (jetlagData.showerConfidence as any) || 'medium',
      });
    }

    return intelMap;
  } catch (error) {
    console.error('Failed to batch fetch airport intelligence:', error);
    return new Map();
  }
}

// ============================================================================
// QUERY HELPERS (Same API as before)
// ============================================================================

export async function getAirportsByTier(tier: 'tier_1' | 'tier_2' | 'tier_3'): Promise<string[]> {
  try {
    const results = await db
      .select({ iataCode: airportIntelligence.iataCode })
      .from(airportIntelligence)
      .where(eq(airportIntelligence.tierPriority, tier));

    return results.map(r => r.iataCode).filter((code): code is string => code !== null);
  } catch (error) {
    console.error(`Failed to fetch ${tier} airports:`, error);
    return [];
  }
}

export async function getTopLoungeAirports(limit: number = 20): Promise<Array<{ iataCode: string; score: number }>> {
  try {
    const results = await db
      .select()
      .from(airportIntelligence)
      .limit(limit * 3); // Get more to filter

    const scored = results
      .map(r => {
        const loungeData = parseJSON(r.loungesData, {});
        const jetlagData = parseJSON(r.jetlagRecoveryData, {});
        const score = loungeData.overallQuality || jetlagData.loungeQualityScore || 0;

        return {
          iataCode: r.iataCode,
          score,
        };
      })
      .filter((item): item is { iataCode: string; score: number } => item.iataCode !== null && item.score >= 7.0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  } catch (error) {
    console.error('Failed to fetch top lounge airports:', error);
    return [];
  }
}

export async function getEasiestConnectionAirports(limit: number = 20): Promise<Array<{ iataCode: string; score: number }>> {
  try {
    const results = await db
      .select()
      .from(airportIntelligence)
      .limit(limit * 3);

    const scored = results
      .map(r => {
        const navData = parseJSON(r.navigationData, {});
        const score = navData.complexityScore || 5.0;

        return {
          iataCode: r.iataCode,
          score,
        };
      })
      .filter((item): item is { iataCode: string; score: number } => item.iataCode !== null && item.score <= 5.0)
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);

    return scored;
  } catch (error) {
    console.error('Failed to fetch easiest connection airports:', error);
    return [];
  }
}

export function calculateLayoverScore(intel: AirportIntelligence): {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  reasons: string[];
} {
  const loungeContribution = intel.loungeQualityScore * 6;
  const connectionContribution = (10 - intel.connectionComplexityScore) * 4;
  const totalScore = loungeContribution + connectionContribution;

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 60) grade = 'C';
  else if (totalScore >= 50) grade = 'D';
  else grade = 'F';

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

// Helper function
function parseJSON<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

// Default intelligence
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
