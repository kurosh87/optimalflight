"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Heart,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  Plane,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface FlightData {
  id: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  duration: number;
  stops: number;
  departureTime?: string;
  arrivalTime?: string;
}

interface ComparisonFlight {
  flight: FlightData;
  score: HolisticScore;
  priceCategory?: {
    category: 'best-value' | 'cheapest' | 'best-jetlag' | 'balanced';
  };
}

interface FlightComparisonProps {
  flights: ComparisonFlight[];
  onRemoveFlight?: (flightId: string) => void;
  maxFlights?: number;
}

export function FlightComparison({
  flights,
  onRemoveFlight,
  maxFlights = 3,
}: FlightComparisonProps) {
  if (flights.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No flights selected for comparison. Add flights to compare their jetlag scores.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find best/worst values for highlighting
  const prices = flights.map(f => f.flight.price);
  const scores = flights.map(f => f.score.overallJetlagScore);
  const durations = flights.map(f => f.flight.duration);
  const recoveryDays = flights.map(f => f.score.estimatedRecoveryDays);

  const bestPrice = Math.min(...prices);
  const bestScore = Math.max(...scores);
  const shortestDuration = Math.min(...durations);
  const fastestRecovery = Math.min(...recoveryDays);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Flight Comparison ({flights.length}/{maxFlights})
          </span>
          {flights.length >= 2 && (
            <Badge variant="outline" className="font-normal">
              Side-by-side analysis
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${flights.length}, minmax(280px, 1fr))` }}>
            {flights.map((item, index) => (
              <div key={item.flight.id} className="space-y-4">
                {/* Flight Header */}
                <div className="relative p-4 border rounded-lg bg-muted/30">
                  {onRemoveFlight && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => onRemoveFlight(item.flight.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-4 w-4 text-primary" />
                    <div className="flex items-center gap-1 font-semibold">
                      <span>{item.flight.origin}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{item.flight.destination}</span>
                    </div>
                  </div>

                  {item.priceCategory && (
                    <Badge
                      className={cn(
                        "mb-2",
                        item.priceCategory.category === 'best-value' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
                        item.priceCategory.category === 'cheapest' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                        item.priceCategory.category === 'best-jetlag' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      )}
                    >
                      {item.priceCategory.category === 'best-value' && 'Best Value'}
                      {item.priceCategory.category === 'cheapest' && 'Cheapest'}
                      {item.priceCategory.category === 'best-jetlag' && 'Best Jetlag'}
                      {item.priceCategory.category === 'balanced' && 'Balanced'}
                    </Badge>
                  )}

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className={cn(
                        "font-semibold",
                        item.flight.price === bestPrice && "text-green-600 dark:text-green-400"
                      )}>
                        {item.flight.currency} {item.flight.price.toLocaleString()}
                        {item.flight.price === bestPrice && " ✓"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className={cn(
                        item.flight.duration === shortestDuration && "text-green-600 dark:text-green-400 font-semibold"
                      )}>
                        {Math.floor(item.flight.duration / 60)}h {item.flight.duration % 60}m
                        {item.flight.duration === shortestDuration && " ✓"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stops:</span>
                      <span>{item.flight.stops} stop{item.flight.stops !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="p-4 border rounded-lg">
                  <div className="text-center mb-3">
                    <div className={cn(
                      "text-4xl font-bold tabular-nums",
                      item.score.overallJetlagScore === bestScore && "text-green-600 dark:text-green-400",
                      item.score.overallJetlagScore < bestScore && item.score.overallJetlagScore >= 65 && "text-blue-600 dark:text-blue-400",
                      item.score.overallJetlagScore < 65 && "text-yellow-600 dark:text-yellow-400"
                    )}>
                      {Math.round(item.score.overallJetlagScore)}
                      {item.score.overallJetlagScore === bestScore && (
                        <CheckCircle2 className="inline ml-2 h-6 w-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Jetlag Score</div>
                  </div>

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Recovery:</span>
                    <span className={cn(
                      "font-semibold",
                      item.score.estimatedRecoveryDays === fastestRecovery && "text-green-600 dark:text-green-400"
                    )}>
                      {item.score.estimatedRecoveryDays.toFixed(1)} days
                      {item.score.estimatedRecoveryDays === fastestRecovery && " ✓"}
                    </span>
                  </div>

                  <Badge
                    variant={item.score.recommendation.toLowerCase() === 'optimal' ? 'default' : 'outline'}
                    className="w-full justify-center"
                  >
                    {item.score.recommendation}
                  </Badge>
                </div>

                {/* Dimensional Scores */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Score Breakdown</h4>

                  <ScoreDimensionCompact
                    icon={Brain}
                    label="Circadian"
                    score={item.score.circadianScore}
                    weight={45}
                  />
                  <ScoreDimensionCompact
                    icon={Sparkles}
                    label="Strategy"
                    score={item.score.strategyScore}
                    weight={25}
                  />
                  <ScoreDimensionCompact
                    icon={Heart}
                    label="Comfort"
                    score={item.score.comfortScore}
                    weight={20}
                  />
                  <ScoreDimensionCompact
                    icon={TrendingUp}
                    label="Efficiency"
                    score={item.score.efficiencyScore}
                    weight={10}
                  />
                </div>

                {/* Strengths & Weaknesses */}
                <div className="space-y-3 border-t pt-3">
                  {item.score.strengths.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Strengths
                      </h5>
                      <ul className="space-y-0.5">
                        {item.score.strengths.slice(0, 2).map((strength, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-green-600">✓</span>
                            <span className="flex-1">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.score.weaknesses.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold mb-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                        Considerations
                      </h5>
                      <ul className="space-y-0.5">
                        {item.score.weaknesses.slice(0, 2).map((weakness, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-orange-600">!</span>
                            <span className="flex-1">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Summary */}
        {flights.length >= 2 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-semibold text-sm mb-3">Quick Comparison</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-1">Best Jetlag Score</div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {Math.round(bestScore)}/100
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Lowest Price</div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {flights[0].flight.currency} {bestPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Shortest Flight</div>
                <div className="font-semibold">
                  {Math.floor(shortestDuration / 60)}h {shortestDuration % 60}m
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Fastest Recovery</div>
                <div className="font-semibold">
                  {fastestRecovery.toFixed(1)} days
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact dimension score for comparison view
function ScoreDimensionCompact({
  icon: Icon,
  label,
  score,
  weight,
}: {
  icon: any;
  label: string;
  score: number;
  weight: number;
}) {
  const getColor = (value: number): string => {
    if (value >= 80) return "bg-green-500";
    if (value >= 65) return "bg-blue-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">({weight}%)</span>
        </div>
        <span className="font-semibold tabular-nums">{Math.round(score)}</span>
      </div>
      <Progress value={score} className="h-1" indicatorClassName={getColor(score)} />
    </div>
  );
}
