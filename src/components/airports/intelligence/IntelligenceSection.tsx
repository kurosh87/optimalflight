/**
 * Intelligence Section Component
 * Conditional wrapper that shows either full data or empty state
 */

'use client';

import { useState, useEffect } from 'react';
import { RecoveryFacilities } from './RecoveryFacilities';
import { EmptyState } from './EmptyState';
import { DataQualityBadge } from './DataQualityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LoungeQualityBadge, ConnectionComplexityBadge } from '@/components/airport-intel';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

interface IntelligenceSectionProps {
  airportCode: string;
  airportName: string;
}

export function IntelligenceSection({ airportCode, airportName }: IntelligenceSectionProps) {
  const [loading, setLoading] = useState(true);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        const response = await fetch(`/api/airports/${airportCode}/intelligence`);

        if (response.status === 404) {
          // No data available
          setIntelligence(null);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch intelligence data');
        }

        const data = await response.json();
        setIntelligence(data);
      } catch (err) {
        console.error('Error fetching intelligence:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchIntelligence();
  }, [airportCode]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading jetlag recovery data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            Unable to load intelligence data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if intelligence data exists and has any facilities
  const hasFacilities = intelligence && intelligence.recovery && (
    intelligence.recovery.sleepPods?.length > 0 ||
    intelligence.recovery.gyms?.length > 0 ||
    intelligence.recovery.quietZones?.length > 0 ||
    intelligence.recovery.showers?.length > 0 ||
    intelligence.recovery.spas?.length > 0 ||
    intelligence.recovery.meditationRooms?.length > 0 ||
    intelligence.recovery.outdoorAreas?.length > 0
  );

  // Check if enhanced intelligence data is available
  const hasEnhancedIntel = intelligence?.enhanced?.loungeQuality || intelligence?.enhanced?.connectionComplexity;

  if (!intelligence || (!hasFacilities && !hasEnhancedIntel)) {
    return <EmptyState airportCode={airportCode} airportName={airportName} />;
  }

  // Count total facilities
  const totalFacilities =
    (intelligence.recovery?.sleepPods?.length || 0) +
    (intelligence.recovery?.gyms?.length || 0) +
    (intelligence.recovery?.quietZones?.length || 0) +
    (intelligence.recovery?.showers?.length || 0) +
    (intelligence.recovery?.spas?.length || 0) +
    (intelligence.recovery?.meditationRooms?.length || 0) +
    (intelligence.recovery?.outdoorAreas?.length || 0);

  // Convert enhanced API data to AirportIntelligence format for badge components
  const convertedIntel = hasEnhancedIntel ? {
    iataCode: airportCode,
    tier: intelligence.enhanced?.tier || 'unknown',
    loungeQualityScore: intelligence.enhanced?.loungeQuality?.score || 0,
    hasPremiumLounges: intelligence.enhanced?.loungeQuality?.hasPremiumLounges || false,
    hasShowerFacilities: intelligence.enhanced?.loungeQuality?.hasShowerFacilities || false,
    hasSleepSeating: intelligence.enhanced?.loungeQuality?.hasSleepSeating || false,
    hasHealthyFood: intelligence.enhanced?.loungeQuality?.hasHealthyFood || false,
    notableLounges: intelligence.enhanced?.loungeQuality?.notableLounges || [],
    allLounges: intelligence.enhanced?.loungeQuality?.allLounges || [],
    bestForJetlag: intelligence.enhanced?.loungeQuality?.bestForJetlag || '',
    loungeConfidence: intelligence.enhanced?.loungeQuality?.confidence || 'low',
    connectionComplexityScore: intelligence.enhanced?.connectionComplexity?.score || 5,
    minimumConnectionTimeMinutes: intelligence.enhanced?.connectionComplexity?.minimumConnectionTimeMinutes || 60,
    realisticConnectionTimeMinutes: intelligence.enhanced?.connectionComplexity?.realisticConnectionTimeMinutes || 90,
    requiresSecurityRescreen: intelligence.enhanced?.connectionComplexity?.requiresSecurityRescreen || false,
    requiresTerminalChange: intelligence.enhanced?.connectionComplexity?.requiresTerminalChange || false,
    terminalChangeMethod: intelligence.enhanced?.connectionComplexity?.terminalChangeMethod || null,
    hasFastTrackConnections: intelligence.enhanced?.connectionComplexity?.hasFastTrackConnections || false,
    majorChallenges: intelligence.enhanced?.connectionComplexity?.majorChallenges || [],
    connectionTips: intelligence.enhanced?.connectionComplexity?.connectionTips || '',
    connectionConfidence: intelligence.enhanced?.connectionComplexity?.confidence || 'low',
  } : null;

  // Helper function to get tier badge styling
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier_1':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'tier_2':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'tier_3':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'tier_1':
        return '🌟 Tier 1 - Major Hub';
      case 'tier_2':
        return '⭐ Tier 2 - Regional Hub';
      case 'tier_3':
        return '✈️ Tier 3 - Domestic/Regional';
      default:
        return 'Unknown Tier';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Intelligence Card */}
      {hasEnhancedIntel && convertedIntel && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <h3 className="text-xl font-bold">Airport Intelligence</h3>
                  </div>
                  <Badge variant="outline" className={getTierColor(convertedIntel.tier)}>
                    {getTierLabel(convertedIntel.tier)}
                  </Badge>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    GPT-5-powered analysis of lounge quality, connection complexity, and jetlag recovery facilities.
                  </p>
                </div>
                <DataQualityBadge
                  quality={intelligence.dataQuality || 'minimal'}
                  lastUpdated={intelligence.lastUpdated}
                />
              </div>

              {/* Intelligence Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {intelligence.enhanced?.loungeQuality && (
                  <LoungeQualityBadge intel={convertedIntel} showDetails />
                )}
                {intelligence.enhanced?.connectionComplexity && (
                  <ConnectionComplexityBadge intel={convertedIntel} showDetails />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Summary Card (only if facilities exist) */}
      {hasFacilities && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">✈️ {totalFacilities} Recovery Facilities Available</h3>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  This airport offers dedicated jetlag recovery amenities to help you adjust your circadian rhythm,
                  reduce travel fatigue, and arrive at your destination feeling refreshed.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {intelligence.recovery?.sleepPods?.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                      🛏️ {intelligence.recovery.sleepPods.length} Sleep Pod{intelligence.recovery.sleepPods.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {intelligence.recovery?.gyms?.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                      💪 {intelligence.recovery.gyms.length} Gym{intelligence.recovery.gyms.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {intelligence.recovery?.quietZones?.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                      🤫 {intelligence.recovery.quietZones.length} Quiet Zone{intelligence.recovery.quietZones.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {intelligence.recovery?.showers?.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                      🚿 {intelligence.recovery.showers.length} Shower{intelligence.recovery.showers.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {intelligence.recovery?.spas?.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                      ✨ {intelligence.recovery.spas.length} Spa{intelligence.recovery.spas.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery Facilities (only if facilities exist) */}
      {hasFacilities && <RecoveryFacilities recovery={intelligence.recovery} />}
    </div>
  );
}
