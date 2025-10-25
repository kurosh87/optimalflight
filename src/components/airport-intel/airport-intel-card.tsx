'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Star } from 'lucide-react';
import { AirportIntelligence, calculateLayoverScore } from '@/lib/airport-intel/airport-intelligence';
import { LoungeQualityBadge } from './lounge-quality-badge';
import { ConnectionComplexityBadge } from './connection-complexity-badge';

interface AirportIntelCardProps {
  intel: AirportIntelligence;
  airportName?: string;
  showLayoverScore?: boolean;
}

export function AirportIntelCard({ intel, airportName, showLayoverScore = true }: AirportIntelCardProps) {
  const layoverScore = showLayoverScore ? calculateLayoverScore(intel) : null;

  // Tier badge color
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {airportName || intel.iataCode}
              <span className="text-sm text-muted-foreground font-normal">({intel.iataCode})</span>
            </CardTitle>
            <Badge variant="outline" className={getTierColor(intel.tier)}>
              {getTierLabel(intel.tier)}
            </Badge>
          </div>
          {layoverScore && (
            <div className="text-right">
              <div className="text-2xl font-bold">{layoverScore.score}</div>
              <div className="text-sm text-muted-foreground">Layover Score</div>
              <Badge variant="outline" className="mt-1">
                Grade {layoverScore.grade}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lounge quality section */}
        <LoungeQualityBadge intel={intel} showDetails />

        <Separator />

        {/* Connection complexity section */}
        <ConnectionComplexityBadge intel={intel} showDetails />

        {/* Layover score breakdown */}
        {layoverScore && layoverScore.reasons.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />
                Layover Highlights
              </h4>
              <ul className="space-y-1">
                {layoverScore.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className={reason.includes('⚠️') ? 'text-yellow-600' : 'text-green-600'}>
                      {reason.includes('⚠️') ? '⚠️' : '✓'}
                    </span>
                    <span className={reason.includes('⚠️') ? 'text-yellow-900' : 'text-foreground'}>
                      {reason.replace('⚠️ ', '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* All lounges list (if available) */}
        {intel.allLounges.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">All Lounges ({intel.allLounges.length})</h4>
              <div className="grid gap-2">
                {intel.allLounges.slice(0, 5).map((lounge, idx) => (
                  <div key={idx} className="text-xs p-2 bg-muted rounded space-y-1">
                    <div className="font-medium">{lounge.name}</div>
                    {lounge.terminal && (
                      <div className="text-muted-foreground">{lounge.terminal}</div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {lounge.has_showers && (
                        <Badge variant="secondary" className="text-xs">Showers</Badge>
                      )}
                      {lounge.has_sleep_areas && (
                        <Badge variant="secondary" className="text-xs">Sleep Areas</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Rating: {lounge.quality_rating}/10
                      </Badge>
                    </div>
                    {lounge.access && lounge.access.length > 0 && (
                      <div className="text-muted-foreground">
                        Access: {lounge.access.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {intel.allLounges.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    + {intel.allLounges.length - 5} more lounges
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
