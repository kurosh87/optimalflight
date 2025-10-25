'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Route, Timer, ShieldAlert, Zap, AlertCircle } from 'lucide-react';
import { AirportIntelligence } from '@/lib/airport-intel/airport-intelligence';

interface ConnectionComplexityBadgeProps {
  intel: AirportIntelligence;
  showDetails?: boolean;
}

export function ConnectionComplexityBadge({ intel, showDetails = false }: ConnectionComplexityBadgeProps) {
  const score = intel.connectionComplexityScore;

  // Color scheme (inverted - lower score is better)
  const getColorClass = (score: number) => {
    if (score <= 3) return 'bg-green-100 text-green-800 border-green-300';
    if (score <= 5) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Get emoji (lower is better)
  const getEmoji = (score: number) => {
    if (score <= 3) return '✅';
    if (score <= 5) return '⭐';
    if (score <= 7) return '⚠️';
    return '❌';
  };

  // Get difficulty label
  const getDifficulty = (score: number) => {
    if (score <= 3) return 'Easy';
    if (score <= 5) return 'Moderate';
    if (score <= 7) return 'Complex';
    return 'Difficult';
  };

  // Format MCT
  const formatMCT = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={getColorClass(score)} variant="outline">
              {getEmoji(score)} {getDifficulty(score)} ({score.toFixed(1)}/10)
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Connection Complexity</p>
            <p className="text-xs mt-1">Difficulty: {getDifficulty(score)}</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>Minimum connection time: {formatMCT(intel.minimumConnectionTimeMinutes)}</span>
              </div>
              {intel.requiresSecurityRescreen && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Security re-screening required</span>
                </div>
              )}
              {intel.hasFastTrackConnections && (
                <div className="flex items-center gap-1 text-green-600">
                  <Zap className="h-3 w-3" />
                  <span>Fast-track available</span>
                </div>
              )}
            </div>
            {intel.connectionTips && (
              <p className="mt-2 text-xs text-muted-foreground italic">
                💡 {intel.connectionTips}
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
          <Route className="h-4 w-4" />
          Connection Complexity
        </h4>
        <Badge className={getColorClass(score)} variant="outline">
          {getEmoji(score)} {getDifficulty(score)} ({score.toFixed(1)}/10)
        </Badge>
      </div>

      {/* Connection times */}
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Minimum Connection Time
          </span>
          <span className="font-semibold">{formatMCT(intel.minimumConnectionTimeMinutes)}</span>
        </div>
        {intel.realisticConnectionTimeMinutes && (
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Recommended Time
            </span>
            <span className="font-semibold">{formatMCT(intel.realisticConnectionTimeMinutes)}</span>
          </div>
        )}
      </div>

      {/* Requirements */}
      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 ${intel.requiresTerminalChange ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`h-2 w-2 rounded-full ${intel.requiresTerminalChange ? 'bg-orange-500' : 'bg-gray-300'}`} />
          <span>Terminal change required</span>
          {intel.terminalChangeMethod && (
            <span className="text-xs text-muted-foreground">
              ({intel.terminalChangeMethod.replace(/_/g, ' ')})
            </span>
          )}
        </div>
        <div className={`flex items-center gap-2 ${intel.requiresSecurityRescreen ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
          <div className={`h-2 w-2 rounded-full ${intel.requiresSecurityRescreen ? 'bg-yellow-500' : 'bg-gray-300'}`} />
          <span>Security re-screening required</span>
        </div>
        <div className={`flex items-center gap-2 ${intel.hasFastTrackConnections ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
          <div className={`h-2 w-2 rounded-full ${intel.hasFastTrackConnections ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>Fast-track connections</span>
        </div>
      </div>

      {/* Major challenges */}
      {intel.majorChallenges.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs font-medium mb-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Challenges:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {intel.majorChallenges.map((challenge, idx) => (
              <li key={idx} className="text-xs text-muted-foreground">{challenge}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Connection tips */}
      {intel.connectionTips && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          <p className="text-xs flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">💡</span>
            <span className="text-blue-900">{intel.connectionTips}</span>
          </p>
        </div>
      )}

      {/* Confidence */}
      <div className="text-xs text-muted-foreground">
        Data confidence: <span className="capitalize">{intel.connectionConfidence}</span>
      </div>
    </div>
  );
}
