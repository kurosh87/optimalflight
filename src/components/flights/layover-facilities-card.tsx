"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AirportTierBadge } from "./airport-tier-badge";
import { AirportImage } from "@/components/ui/entity-image";
import {
  Bed,
  Droplet,
  Sun,
  Armchair,
  Volume2,
  Dumbbell,
  Sparkles,
  Coffee,
  Brain,
  Wifi,
  Clock,
  Navigation,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AirportFacilities {
  // Core facilities
  sleepPods?: boolean;
  showers?: boolean;
  outdoorAccess?: boolean;
  outdoorAccessRequiresResecurity?: boolean;
  loungeAccess?: boolean;
  quietZones?: boolean;

  // Additional facilities
  gyms?: boolean;
  spas?: boolean;
  meditationRooms?: boolean;
  healthyFoodAvailable?: boolean;

  // Quality metrics (0-10 scale)
  loungeQuality?: number;
  naturalLightQuality?: number;
  wifiQuality?: number;

  // Stress factors
  securityWaitMinutes?: number;
  terminalDistanceMeters?: number;
  noiseLevel?: 'quiet' | 'moderate' | 'loud';

  // Operating hours
  facilityHours?: {
    facility: string;
    hours: string;
  }[];

  // Congestion timing
  peakCongestionHours?: string[];
}

interface LayoverFacilitiesCardProps {
  airportCode: string;
  airportName?: string;
  airportTier?: "tier_1" | "tier_2" | "tier_3";
  facilities: AirportFacilities;
  layoverDurationMinutes: number;
  compact?: boolean;
}

export function LayoverFacilitiesCard({
  airportCode,
  airportName,
  airportTier,
  facilities,
  layoverDurationMinutes,
  compact = false,
}: LayoverFacilitiesCardProps) {
  const layoverHours = Math.floor(layoverDurationMinutes / 60);
  const layoverMins = layoverDurationMinutes % 60;

  // Calculate overall facility score
  const calculateFacilityScore = (): number => {
    let score = 0;
    let maxScore = 0;

    // Core facilities (worth more)
    if (facilities.sleepPods !== undefined) {
      maxScore += 15;
      if (facilities.sleepPods) score += 15;
    }
    if (facilities.showers !== undefined) {
      maxScore += 12;
      if (facilities.showers) score += 12;
    }
    if (facilities.loungeAccess !== undefined) {
      maxScore += 10;
      if (facilities.loungeAccess) score += 10;
    }
    if (facilities.quietZones !== undefined) {
      maxScore += 8;
      if (facilities.quietZones) score += 8;
    }

    // Additional facilities
    if (facilities.gyms !== undefined) {
      maxScore += 5;
      if (facilities.gyms) score += 5;
    }
    if (facilities.spas !== undefined) {
      maxScore += 5;
      if (facilities.spas) score += 5;
    }
    if (facilities.meditationRooms !== undefined) {
      maxScore += 5;
      if (facilities.meditationRooms) score += 5;
    }
    if (facilities.healthyFoodAvailable !== undefined) {
      maxScore += 8;
      if (facilities.healthyFoodAvailable) score += 8;
    }

    // Quality metrics (normalize to percentage)
    if (facilities.loungeQuality !== undefined) {
      maxScore += 10;
      score += facilities.loungeQuality;
    }
    if (facilities.wifiQuality !== undefined) {
      maxScore += 7;
      score += (facilities.wifiQuality / 10) * 7;
    }

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  const facilityScore = calculateFacilityScore();

  // Get recommendation based on layover duration and facilities
  const getLayoverRecommendation = (): { text: string; severity: 'good' | 'neutral' | 'poor' } => {
    if (layoverDurationMinutes < 60) {
      return { text: 'Quick connection - limited time for facilities', severity: 'neutral' };
    }
    if (layoverDurationMinutes < 180) {
      if (facilities.loungeAccess || facilities.quietZones) {
        return { text: 'Good for rest and refresh', severity: 'good' };
      }
      return { text: 'Moderate layover - basic amenities available', severity: 'neutral' };
    }
    if (layoverDurationMinutes < 360) {
      if (facilities.sleepPods || (facilities.showers && facilities.loungeAccess)) {
        return { text: 'Excellent for recovery', severity: 'good' };
      }
      return { text: 'Long layover - consider exploring facilities', severity: 'neutral' };
    }
    // 6+ hours
    if (facilities.sleepPods || facilities.spas) {
      return { text: 'Ideal for rest and recovery', severity: 'good' };
    }
    return { text: 'Extended layover - facilities may help pass time', severity: 'poor' };
  };

  const recommendation = getLayoverRecommendation();

  return (
    <Card className={cn(
      "transition-all",
      facilityScore >= 70 && "border-green-200 dark:border-green-800",
      facilityScore >= 50 && facilityScore < 70 && "border-blue-200 dark:border-blue-800"
    )}>
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Airport Image */}
          <AirportImage
            code={airportCode}
            name={airportName}
            size="lg"
            rounded="md"
            className="flex-shrink-0"
          />

          <div className="flex-1 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-lg">{airportCode}</CardTitle>
                {airportTier && <AirportTierBadge tier={airportTier} size="sm" />}
                {airportName && (
                  <span className="text-sm text-muted-foreground">{airportName}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {layoverHours}h {layoverMins}m layover
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold tabular-nums">
                {Math.round(facilityScore)}
              </div>
              <div className="text-xs text-muted-foreground">Facility Score</div>
            </div>
          </div>
        </div>

        {/* Recommendation badge */}
        <div className="mt-2">
          <Badge
            variant={recommendation.severity === 'good' ? 'default' : 'outline'}
            className={cn(
              recommendation.severity === 'good' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
              recommendation.severity === 'poor' && 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400'
            )}
          >
            {recommendation.severity === 'good' ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : recommendation.severity === 'poor' ? (
              <AlertCircle className="mr-1 h-3 w-3" />
            ) : null}
            {recommendation.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Core Recovery Facilities */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Recovery Facilities
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <FacilityItem
              icon={Bed}
              label="Sleep Pods"
              available={facilities.sleepPods}
              highlight={layoverDurationMinutes >= 240}
            />
            <FacilityItem
              icon={Droplet}
              label="Showers"
              available={facilities.showers}
              highlight={layoverDurationMinutes >= 120}
            />
            <FacilityItem
              icon={Armchair}
              label="Lounge Access"
              available={facilities.loungeAccess}
              quality={facilities.loungeQuality}
            />
            <FacilityItem
              icon={Volume2}
              label="Quiet Zones"
              available={facilities.quietZones}
            />
          </div>
        </div>

        {/* Additional Amenities */}
        {(facilities.gyms || facilities.spas || facilities.meditationRooms || facilities.healthyFoodAvailable) && (
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Premium Amenities
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {facilities.gyms !== undefined && (
                <FacilityItem
                  icon={Dumbbell}
                  label="Gym"
                  available={facilities.gyms}
                />
              )}
              {facilities.spas !== undefined && (
                <FacilityItem
                  icon={Sparkles}
                  label="Spa Services"
                  available={facilities.spas}
                />
              )}
              {facilities.meditationRooms !== undefined && (
                <FacilityItem
                  icon={Brain}
                  label="Meditation"
                  available={facilities.meditationRooms}
                />
              )}
              {facilities.healthyFoodAvailable !== undefined && (
                <FacilityItem
                  icon={Coffee}
                  label="Healthy Food"
                  available={facilities.healthyFoodAvailable}
                />
              )}
            </div>
          </div>
        )}

        {/* Environment Quality */}
        {!compact && (facilities.wifiQuality !== undefined || facilities.naturalLightQuality !== undefined || facilities.noiseLevel !== undefined) && (
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-3">Environment</h4>
            <div className="space-y-2">
              {facilities.wifiQuality !== undefined && (
                <QualityMetric
                  icon={Wifi}
                  label="WiFi Quality"
                  score={facilities.wifiQuality}
                />
              )}
              {facilities.naturalLightQuality !== undefined && (
                <QualityMetric
                  icon={Sun}
                  label="Natural Light"
                  score={facilities.naturalLightQuality}
                />
              )}
              {facilities.noiseLevel && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span>Noise Level</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      facilities.noiseLevel === 'quiet' && 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
                      facilities.noiseLevel === 'moderate' && 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
                      facilities.noiseLevel === 'loud' && 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                    )}
                  >
                    {facilities.noiseLevel}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation & Logistics */}
        {!compact && (facilities.securityWaitMinutes !== undefined || facilities.terminalDistanceMeters !== undefined) && (
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-3">Navigation</h4>
            <div className="space-y-2 text-sm">
              {facilities.securityWaitMinutes !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Security Wait</span>
                  </div>
                  <span className="text-muted-foreground">~{facilities.securityWaitMinutes} min</span>
                </div>
              )}
              {facilities.terminalDistanceMeters !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span>Terminal Walk</span>
                  </div>
                  <span className="text-muted-foreground">~{Math.round(facilities.terminalDistanceMeters)}m</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Outdoor access note */}
        {facilities.outdoorAccess && (
          <div className="pt-3 border-t">
            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
              <Sun className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-900 dark:text-blue-100 font-medium">Outdoor Access Available</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
                  {facilities.outdoorAccessRequiresResecurity
                    ? 'Note: Requires re-clearing security'
                    : 'Can access outdoor areas without re-clearing security'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for facility items
function FacilityItem({
  icon: Icon,
  label,
  available,
  quality,
  highlight = false,
}: {
  icon: any;
  label: string;
  available?: boolean;
  quality?: number;
  highlight?: boolean;
}) {
  if (available === undefined) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
        available ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/50",
        highlight && available && "ring-2 ring-green-500/50"
      )}
    >
      {available ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate",
          available ? "text-green-900 dark:text-green-100" : "text-muted-foreground"
        )}>
          {label}
        </div>
        {quality !== undefined && available && (
          <div className="text-xs text-green-700 dark:text-green-300">
            Quality: {quality}/10
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for quality metrics
function QualityMetric({
  icon: Icon,
  label,
  score,
}: {
  icon: any;
  label: string;
  score: number;
}) {
  const getColor = (value: number): string => {
    if (value >= 8) return "bg-green-500";
    if (value >= 6) return "bg-blue-500";
    if (value >= 4) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="text-muted-foreground tabular-nums">{score}/10</span>
      </div>
      <Progress value={score * 10} className="h-1.5" indicatorClassName={getColor(score)} />
    </div>
  );
}
