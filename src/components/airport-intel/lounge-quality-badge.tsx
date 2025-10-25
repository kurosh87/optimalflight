'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coffee, Droplets, Moon, Utensils, Sparkles } from 'lucide-react';
import { AirportIntelligence } from '@/lib/airport-intel/airport-intelligence';

interface LoungeQualityBadgeProps {
  intel: AirportIntelligence;
  showDetails?: boolean;
}

export function LoungeQualityBadge({ intel, showDetails = false }: LoungeQualityBadgeProps) {
  const score = intel.loungeQualityScore;

  // Color scheme based on score
  const getColorClass = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 6) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Get emoji based on score
  const getEmoji = (score: number) => {
    if (score >= 8) return '🌟';
    if (score >= 6) return '⭐';
    if (score >= 4) return '✈️';
    return '❌';
  };

  // Get grade
  const getGrade = (score: number) => {
    if (score >= 9) return 'A+';
    if (score >= 8) return 'A';
    if (score >= 7) return 'B+';
    if (score >= 6) return 'B';
    if (score >= 5) return 'C';
    return 'D';
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={getColorClass(score)} variant="outline">
              {getEmoji(score)} Lounge: {score.toFixed(1)}/10
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Lounge Quality: Grade {getGrade(score)}</p>
            <div className="mt-2 space-y-1 text-xs">
              {intel.hasPremiumLounges && (
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Premium lounges available</span>
                </div>
              )}
              {intel.hasShowerFacilities && (
                <div className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  <span>Shower facilities</span>
                </div>
              )}
              {intel.hasSleepSeating && (
                <div className="flex items-center gap-1">
                  <Moon className="h-3 w-3" />
                  <span>Sleep seating/pods</span>
                </div>
              )}
              {intel.hasHealthyFood && (
                <div className="flex items-center gap-1">
                  <Utensils className="h-3 w-3" />
                  <span>Healthy food options</span>
                </div>
              )}
            </div>
            {intel.notableLounges.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Featured: {intel.notableLounges.slice(0, 2).join(', ')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed view
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Coffee className="h-4 w-4" />
          Lounge Quality
        </h4>
        <Badge className={getColorClass(score)} variant="outline">
          {getEmoji(score)} {score.toFixed(1)}/10 (Grade {getGrade(score)})
        </Badge>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className={intel.hasPremiumLounges ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-gray-300'} />
          <span className={intel.hasPremiumLounges ? 'text-foreground' : 'text-muted-foreground'}>
            Premium Lounges
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className={intel.hasShowerFacilities ? 'h-4 w-4 text-blue-600' : 'h-4 w-4 text-gray-300'} />
          <span className={intel.hasShowerFacilities ? 'text-foreground' : 'text-muted-foreground'}>
            Showers
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Moon className={intel.hasSleepSeating ? 'h-4 w-4 text-purple-600' : 'h-4 w-4 text-gray-300'} />
          <span className={intel.hasSleepSeating ? 'text-foreground' : 'text-muted-foreground'}>
            Sleep Seating
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Utensils className={intel.hasHealthyFood ? 'h-4 w-4 text-orange-600' : 'h-4 w-4 text-gray-300'} />
          <span className={intel.hasHealthyFood ? 'text-foreground' : 'text-muted-foreground'}>
            Healthy Food
          </span>
        </div>
      </div>

      {/* Notable lounges */}
      {intel.notableLounges.length > 0 && (
        <div className="text-sm">
          <p className="text-muted-foreground mb-1">Featured Lounges:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {intel.notableLounges.slice(0, 3).map((lounge, idx) => (
              <li key={idx} className="text-xs">{lounge}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Best for jetlag */}
      {intel.bestForJetlag && (
        <p className="text-xs text-muted-foreground italic border-t pt-2">
          💡 {intel.bestForJetlag}
        </p>
      )}

      {/* Confidence */}
      <div className="text-xs text-muted-foreground">
        Data confidence: <span className="capitalize">{intel.loungeConfidence}</span>
      </div>
    </div>
  );
}
