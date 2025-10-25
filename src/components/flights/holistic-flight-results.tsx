"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  Brain,
  Sparkles,
  ArrowUpDown,
  Filter,
  Info,
  Zap,
} from "lucide-react";
import { HolisticScoreCard } from "./holistic-score-card";
import type { CompleteFlightOption } from "@/lib/ranking/holistic-scorer";

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

interface FlightResult {
  flight: CompleteFlightOption;
  score: HolisticScore;
  valueScore?: number;
  priceCategory?: {
    category: 'best-value' | 'cheapest' | 'best-jetlag' | 'balanced';
    valueScore: number;
    savingsFromBest?: number;
    extraCostForBest?: number;
  };
}

interface PriceAnalysis {
  cheapest: { id: string; price: number; jetlagScore: number };
  bestJetlag: { id: string; price: number; jetlagScore: number };
  bestValue: { id: string; price: number; jetlagScore: number; valueScore: number };
  balanced?: { id: string; price: number; jetlagScore: number };
  priceRange: { min: number; max: number };
  jetlagRange: { min: number; max: number };
}

interface ResultsSummary {
  total: number;
  optimal: number;
  excellent: number;
  good: number;
  insights: string[];
}

interface HolisticFlightResultsProps {
  results: FlightResult[];
  priceAnalysis?: PriceAnalysis;
  summary?: ResultsSummary;
  loading?: boolean;
  compact?: boolean;
}

type SortOption = 'jetlag-best' | 'price-low' | 'value-best' | 'duration-short';

export function HolisticFlightResults({
  results,
  priceAnalysis,
  summary,
  loading = false,
  compact = false,
}: HolisticFlightResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('jetlag-best');
  const [showFilters, setShowFilters] = useState(false);
  const [minScore, setMinScore] = useState(0);

  // Sort results based on selected option
  const sortedResults = useMemo(() => {
    const sorted = [...results];
    switch (sortBy) {
      case 'jetlag-best':
        return sorted.sort((a, b) => b.score.overallJetlagScore - a.score.overallJetlagScore);
      case 'price-low':
        return sorted.sort((a, b) => a.flight.price - b.flight.price);
      case 'value-best':
        return sorted.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));
      case 'duration-short':
        return sorted.sort((a, b) => a.flight.duration - b.flight.duration);
      default:
        return sorted;
    }
  }, [results, sortBy]);

  // Apply score filter
  const filteredResults = useMemo(() => {
    return sortedResults.filter(r => r.score.overallJetlagScore >= minScore);
  }, [sortedResults, minScore]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader className="h-32 bg-muted/50" />
          <CardContent className="h-64 bg-muted/30" />
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No flights found matching your criteria</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Analysis Summary */}
      {priceAnalysis && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Flight Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Best Value */}
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-sm">Best Value</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${priceAnalysis.bestValue.price.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Score: {Math.round(priceAnalysis.bestValue.jetlagScore)}/100
                </div>
              </div>

              {/* Cheapest */}
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm">Cheapest</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${priceAnalysis.cheapest.price.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Score: {Math.round(priceAnalysis.cheapest.jetlagScore)}/100
                </div>
              </div>

              {/* Best Jetlag */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-sm">Best Jetlag</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(priceAnalysis.bestJetlag.jetlagScore)}/100
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${priceAnalysis.bestJetlag.price.toLocaleString()}
                </div>
              </div>

              {/* Price Range */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Price Range</span>
                </div>
                <div className="text-lg font-bold">
                  ${priceAnalysis.priceRange.min.toLocaleString()} - ${priceAnalysis.priceRange.max.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Score range: {Math.round(priceAnalysis.jetlagRange.min)}-{Math.round(priceAnalysis.jetlagRange.max)}
                </div>
              </div>
            </div>

            {/* Insights */}
            {summary?.insights && summary.insights.length > 0 && (
              <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-sm">
                    {summary.insights.map((insight, idx) => (
                      <p key={idx} className="text-muted-foreground">{insight}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Controls Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {filteredResults.length} flight{filteredResults.length !== 1 ? 's' : ''}
                {summary && (
                  <span className="text-muted-foreground ml-2">
                    ({summary.optimal} optimal, {summary.excellent} excellent)
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jetlag-best">Best Jetlag Score</SelectItem>
                    <SelectItem value="price-low">Lowest Price</SelectItem>
                    <SelectItem value="value-best">Best Value</SelectItem>
                    <SelectItem value="duration-short">Shortest Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Minimum Jetlag Score: {minScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Any</span>
                  <span>Good {'(65+)'}</span>
                  <span>Excellent {'(80+)'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flight Results */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No flights match your current filters. Try adjusting the minimum score.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMinScore(0)}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((result, index) => (
            <div key={result.flight.id || index} className="relative">
              {/* Rank Badge for top 3 */}
              {index < 3 && sortBy === 'jetlag-best' && (
                <div className="absolute -left-3 top-4 z-10">
                  <Badge
                    className={
                      index === 0
                        ? "bg-yellow-500 text-yellow-950"
                        : index === 1
                        ? "bg-gray-400 text-gray-950"
                        : "bg-orange-700 text-orange-50"
                    }
                  >
                    #{index + 1}
                  </Badge>
                </div>
              )}

              <HolisticScoreCard
                score={result.score}
                flight={{
                  price: result.flight.price,
                  currency: result.flight.currency,
                  stops: result.flight.segments.length - 1,
                  duration: result.flight.duration,
                }}
                priceCategory={result.priceCategory}
                compact={compact}
              />
            </div>
          ))
        )}
      </div>

      {/* Results Summary Footer */}
      {summary && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredResults.length} of {summary.total} flights
              {minScore > 0 && (
                <span className="ml-2">
                  • Filtered by minimum score: {minScore}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
