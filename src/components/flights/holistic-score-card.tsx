"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Brain,
  Heart,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Info,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DimensionBreakdownPanel } from "./dimension-breakdown-panel";

interface HolisticScore {
  overallJetlagScore: number;
  recommendation: string;
  estimatedRecoveryDays: number;
  circadianScore: number;
  strategyScore: number;
  comfortScore: number;
  efficiencyScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  scenarios: Array<{ persona: string; match: number }>;
}

interface FlightInfo {
  price: number;
  currency: string;
  stops: number;
  duration: number;
}

interface PriceCategory {
  category: 'best-value' | 'cheapest' | 'best-jetlag' | 'balanced';
  valueScore: number;
  savingsFromBest?: number;
  extraCostForBest?: number;
}

interface HolisticScoreCardProps {
  score: HolisticScore;
  flight: FlightInfo;
  priceCategory?: PriceCategory;
  compact?: boolean;
}

export function HolisticScoreCard({
  score,
  flight,
  priceCategory,
  compact = false,
}: HolisticScoreCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  // Score → Color mapping
  const getScoreColor = (value: number): string => {
    if (value >= 80) return "text-green-600 dark:text-green-400";
    if (value >= 65) return "text-blue-600 dark:text-blue-400";
    if (value >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  // Score → Badge variant
  const getScoreBadgeVariant = (value: number): "default" | "secondary" | "outline" => {
    if (value >= 80) return "default";
    if (value >= 65) return "secondary";
    return "outline";
  };

  // Recommendation → Badge
  const getRecommendationBadge = () => {
    const rec = score.recommendation.toLowerCase();
    if (rec === "optimal") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Optimal
        </Badge>
      );
    }
    if (rec === "excellent") {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <Sparkles className="mr-1 h-3 w-3" />
          Excellent
        </Badge>
      );
    }
    if (rec === "good") {
      return <Badge variant="secondary">Good</Badge>;
    }
    return (
      <Badge variant="outline" className="text-yellow-700 dark:text-yellow-400">
        <AlertCircle className="mr-1 h-3 w-3" />
        {score.recommendation}
      </Badge>
    );
  };

  // Price category badge
  const getPriceCategoryBadge = () => {
    if (!priceCategory) return null;

    const badges = {
      'best-value': (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
          <TrendingUp className="mr-1 h-3 w-3" />
          Best Value
        </Badge>
      ),
      'cheapest': (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <DollarSign className="mr-1 h-3 w-3" />
          Cheapest
        </Badge>
      ),
      'best-jetlag': (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <Brain className="mr-1 h-3 w-3" />
          Best Jetlag
        </Badge>
      ),
      'balanced': (
        <Badge variant="secondary">
          Balanced Option
        </Badge>
      ),
    };

    return badges[priceCategory.category];
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-300",
        score.overallJetlagScore >= 80 && "border-green-200 dark:border-green-800",
        score.overallJetlagScore >= 65 && score.overallJetlagScore < 80 && "border-blue-200 dark:border-blue-800"
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {getRecommendationBadge()}
                {getPriceCategoryBadge()}
              </div>
              <CardTitle className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("text-4xl font-bold tabular-nums cursor-help", getScoreColor(score.overallJetlagScore))}>
                      {Math.round(score.overallJetlagScore)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold mb-1">Holistic Jetlag Score</p>
                    <p className="text-xs">
                      Combines circadian alignment (45%), route strategy (25%),
                      in-flight comfort (20%), and travel efficiency (10%) to predict
                      how well this flight minimizes jetlag impact.
                    </p>
                    <p className="text-xs mt-2">
                      <strong>{'80+'}:</strong> Optimal • <strong>65-79:</strong> Excellent •
                      <strong>50-64:</strong> Good • <strong>&lt;50:</strong> Consider alternatives
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-sm font-normal text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Jetlag Score</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help opacity-60 hover:opacity-100" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          Based on research from Burgess & Eastman (2005) and validated
                          circadian science. This score predicts your jetlag severity and
                          optimal recovery strategies.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs cursor-help">
                        <Clock className="h-3 w-3" />
                        {score.estimatedRecoveryDays.toFixed(1)} days recovery
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">
                        <strong>Estimated Recovery Time:</strong> Average days to fully
                        adapt to new timezone using recommended strategies. Actual recovery
                        varies by age, sleep quality, and adherence to light exposure protocols.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardTitle>
            </div>

          {/* Flight basics */}
          <div className="text-right text-sm">
            <div className="font-semibold text-lg">
              {flight.currency} {flight.price.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
              {flight.stops > 0 && ` • ${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </div>
            {priceCategory?.extraCostForBest && (
              <div className="text-xs text-muted-foreground mt-1">
                +${priceCategory.extraCostForBest} vs best jetlag
              </div>
            )}
            {priceCategory?.savingsFromBest && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Save ${priceCategory.savingsFromBest}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 4-Dimensional Score Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreDimension
            label="Circadian"
            score={score.circadianScore}
            weight={45}
            icon={Brain}
            description="Timing & timezone"
          />
          <ScoreDimension
            label="Strategy"
            score={score.strategyScore}
            weight={25}
            icon={Sparkles}
            description="Routing & facilities"
          />
          <ScoreDimension
            label="Comfort"
            score={score.comfortScore}
            weight={20}
            icon={Heart}
            description="Aircraft & service"
          />
          <ScoreDimension
            label="Efficiency"
            score={score.efficiencyScore}
            weight={10}
            icon={TrendingUp}
            description="Duration & stress"
          />
        </div>

        {/* Expandable Details */}
        {!compact && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full"
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Hide Detailed Analysis
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  View Detailed Analysis
                </>
              )}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-4">
                {/* Dimension Breakdown Panel */}
                <DimensionBreakdownPanel
                  circadianScore={score.circadianScore}
                  strategyScore={score.strategyScore}
                  comfortScore={score.comfortScore}
                  efficiencyScore={score.efficiencyScore}
                  defaultExpanded={false}
                />

                <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                  {/* Strengths */}
                  {score.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {score.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {score.weaknesses.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {score.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-orange-600 dark:text-orange-400 mt-0.5">!</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {score.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Optimization Tips</h4>
                    <ul className="space-y-1">
                      {score.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best for scenarios */}
                {score.scenarios.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                    <div className="flex flex-wrap gap-2">
                      {score.scenarios
                        .filter((s) => s.match >= 70)
                        .map((scenario, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {scenario.persona}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

// Sub-component for dimensional scores with detailed tooltips
function ScoreDimension({
  label,
  score,
  weight,
  icon: Icon,
  description,
}: {
  label: string;
  score: number;
  weight: number;
  icon: any;
  description: string;
}) {
  const getColor = (value: number): string => {
    if (value >= 80) return "bg-green-500";
    if (value >= 65) return "bg-blue-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  // Dimension-specific tooltip content
  const getTooltipContent = (dimension: string) => {
    switch (dimension) {
      case "Circadian":
        return (
          <div className="space-y-2">
            <p className="font-semibold">Circadian Alignment ({weight}% of total score)</p>
            <p className="text-xs">
              Measures how well this flight aligns with your body's internal clock.
              Based on validated circadian science from Burgess & Eastman (2005).
            </p>
            <div className="text-xs space-y-1 pt-1 border-t border-primary/20">
              <p><strong>Key factors:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                <li>Departure timing (28%): Optimal windows for east/west travel</li>
                <li>Arrival timing (28%): Landing 6-10am for quick adaptation</li>
                <li>Light exposure (16%): Strategic sunlight during flight</li>
                <li>Sleep opportunity (16%): Matching destination night cycles</li>
                <li>Airline lighting (8%): Circadian-optimized cabin protocols</li>
                <li>Body clock timing (4%): Pre-adaptation potential</li>
              </ul>
            </div>
          </div>
        );
      case "Strategy":
        return (
          <div className="space-y-2">
            <p className="font-semibold">Route Strategy ({weight}% of total score)</p>
            <p className="text-xs">
              Evaluates routing logic, layover quality, and airport facilities that
              support jetlag recovery during your journey.
            </p>
            <div className="text-xs space-y-1 pt-1 border-t border-primary/20">
              <p><strong>Key factors:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                <li>Routing logic (30%): Direct vs connections trade-offs</li>
                <li>Layover quality (30%): Duration optimized for recovery</li>
                <li>Airport facilities (30%): Sleep pods, showers, lounges</li>
                <li>Connection timing (10%): Avoiding rushed transfers</li>
              </ul>
              <p className="pt-1"><strong>Airport data:</strong> Enhanced with GPT-5 intelligence</p>
            </div>
          </div>
        );
      case "Comfort":
        return (
          <div className="space-y-2">
            <p className="font-semibold">In-Flight Comfort ({weight}% of total score)</p>
            <p className="text-xs">
              Assesses aircraft quality, airline service, and cabin environment that
              affect sleep quality and stress levels during the flight.
            </p>
            <div className="text-xs space-y-1 pt-1 border-t border-primary/20">
              <p><strong>Key factors:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                <li>Aircraft quality (35%): Sleep score, seat comfort, cabin features</li>
                <li>Airline service (30%): Service quality, meal timing, amenities</li>
                <li>Cabin pressure (15%): Lower altitude = less fatigue</li>
                <li>Cabin class (10%): Space for sleep and movement</li>
                <li>Humidity (5%): Newer aircraft have better systems</li>
                <li>Next-gen bonus (5%): A350, 787, A220 advantages</li>
              </ul>
            </div>
          </div>
        );
      case "Efficiency":
        return (
          <div className="space-y-2">
            <p className="font-semibold">Travel Efficiency ({weight}% of total score)</p>
            <p className="text-xs">
              Balances total travel time and connection stress against jetlag
              recovery potential.
            </p>
            <div className="text-xs space-y-1 pt-1 border-t border-primary/20">
              <p><strong>Key factors:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                <li>Total duration (40%): Journey time vs recovery trade-off</li>
                <li>Connection stress (35%): Multiple stops increase fatigue</li>
                <li>Airport congestion (25%): Security & crowd stress factors</li>
              </ul>
              <p className="pt-1">
                <strong>Note:</strong> Sometimes a longer direct flight scores better than
                shorter connections due to reduced stress and better circadian alignment.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-help">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg tabular-nums">{Math.round(score)}</div>
              <div className="text-xs text-muted-foreground">{weight}% weight</div>
            </div>
          </div>
          <Progress value={score} className="h-1.5" indicatorClassName={getColor(score)} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-md">
        {getTooltipContent(label)}
      </TooltipContent>
    </Tooltip>
  );
}
