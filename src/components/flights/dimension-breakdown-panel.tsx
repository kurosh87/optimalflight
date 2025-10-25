"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DimensionBreakdownCard } from "./dimension-breakdown-card";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DimensionBreakdownPanelProps {
  circadianScore: number;
  strategyScore: number;
  comfortScore: number;
  efficiencyScore: number;
  // Optional: Pass actual sub-component data when available
  circadianComponents?: Array<{ name: string; score: number; weight: number; description?: string }>;
  strategyComponents?: Array<{ name: string; score: number; weight: number; description?: string }>;
  comfortComponents?: Array<{ name: string; score: number; weight: number; description?: string }>;
  efficiencyComponents?: Array<{ name: string; score: number; weight: number; description?: string }>;
  defaultExpanded?: boolean;
}

export function DimensionBreakdownPanel({
  circadianScore,
  strategyScore,
  comfortScore,
  efficiencyScore,
  circadianComponents,
  strategyComponents,
  comfortComponents,
  efficiencyComponents,
  defaultExpanded = false,
}: DimensionBreakdownPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Default sub-components based on the weighting system
  const defaultCircadianComponents = circadianComponents || [
    { name: "Departure Timing", score: circadianScore, weight: 28, description: "Optimal departure time windows for your travel direction" },
    { name: "Arrival Timing", score: circadianScore, weight: 28, description: "Landing during ideal adaptation hours (6-10am)" },
    { name: "Light Exposure", score: circadianScore, weight: 16, description: "Strategic sunlight exposure during flight" },
    { name: "Sleep Opportunity", score: circadianScore, weight: 16, description: "Alignment with destination night cycles" },
    { name: "Airline Lighting", score: circadianScore, weight: 8, description: "Circadian-optimized cabin lighting protocols" },
    { name: "Body Clock Timing", score: circadianScore, weight: 4, description: "Pre-adaptation potential" },
  ];

  const defaultStrategyComponents = strategyComponents || [
    { name: "Routing Logic", score: strategyScore, weight: 30, description: "Optimal route choices for jetlag recovery" },
    { name: "Layover Quality", score: strategyScore, weight: 30, description: "Connection point facilities and timing" },
    { name: "Airport Facilities", score: strategyScore, weight: 30, description: "Rest and recovery amenities" },
    { name: "Connection Timing", score: strategyScore, weight: 10, description: "Time between flights" },
  ];

  const defaultComfortComponents = comfortComponents || [
    { name: "Aircraft Quality", score: comfortScore, weight: 35, description: "Sleep score, cabin pressure, next-gen features" },
    { name: "Airline Service", score: comfortScore, weight: 30, description: "Service quality and jetlag-recovery features" },
    { name: "Cabin Pressure", score: comfortScore, weight: 15, description: "Altitude equivalent (lower is better)" },
    { name: "Cabin Class", score: comfortScore, weight: 10, description: "Seat comfort and space" },
    { name: "Cabin Humidity", score: comfortScore, weight: 5, description: "Next-gen aircraft humidity control" },
    { name: "Next-Gen Bonus", score: comfortScore, weight: 5, description: "Advanced aircraft features" },
  ];

  const defaultEfficiencyComponents = efficiencyComponents || [
    { name: "Total Duration", score: efficiencyScore, weight: 40, description: "Overall journey time" },
    { name: "Connection Stress", score: efficiencyScore, weight: 35, description: "Transfer complexity and timing" },
    { name: "Airport Congestion", score: efficiencyScore, weight: 25, description: "Security wait times and terminal navigation" },
  ];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Score Breakdown by Dimension</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                Hide Details <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show Details <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Understanding how each dimension contributes to your overall jetlag score
        </p>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
              <DimensionBreakdownCard
                dimension="circadian"
                score={circadianScore}
                weight={45}
                subComponents={defaultCircadianComponents}
                compact
              />
              <DimensionBreakdownCard
                dimension="strategy"
                score={strategyScore}
                weight={25}
                subComponents={defaultStrategyComponents}
                compact
              />
              <DimensionBreakdownCard
                dimension="comfort"
                score={comfortScore}
                weight={20}
                subComponents={defaultComfortComponents}
                compact
              />
              <DimensionBreakdownCard
                dimension="efficiency"
                score={efficiencyScore}
                weight={10}
                subComponents={defaultEfficiencyComponents}
                compact
              />
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
