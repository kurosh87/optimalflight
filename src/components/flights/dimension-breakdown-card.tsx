"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Brain, Map, Armchair, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubComponent {
  name: string;
  score: number;
  weight: number;
  description?: string;
}

interface DimensionBreakdownCardProps {
  dimension: "circadian" | "strategy" | "comfort" | "efficiency";
  score: number;
  weight: number;
  subComponents?: SubComponent[];
  compact?: boolean;
}

export function DimensionBreakdownCard({
  dimension,
  score,
  weight,
  subComponents,
  compact = false,
}: DimensionBreakdownCardProps) {
  const config = getDimensionConfig(dimension);

  const getScoreColor = (value: number): string => {
    if (value >= 80) return "bg-green-500";
    if (value >= 65) return "bg-blue-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getScoreTextColor = (value: number): string => {
    if (value >= 80) return "text-green-600 dark:text-green-400";
    if (value >= 65) return "text-blue-600 dark:text-blue-400";
    if (value >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <Card className={cn("transition-all", compact && "border-0 shadow-none")}>
      <CardHeader className={cn(compact && "p-4 pb-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <config.icon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {config.name}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{config.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {weight}% of total score
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold tabular-nums", getScoreTextColor(score))}>
              {Math.round(score)}
            </div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
        </div>
      </CardHeader>

      {subComponents && subComponents.length > 0 && (
        <CardContent className={cn("space-y-3", compact && "p-4 pt-2")}>
          {subComponents.map((component, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-muted-foreground">{component.name}</span>
                  {component.description && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{component.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {component.weight}%
                  </span>
                  <span className={cn("font-semibold tabular-nums min-w-[2.5rem] text-right", getScoreTextColor(component.score))}>
                    {Math.round(component.score)}
                  </span>
                </div>
              </div>
              <Progress
                value={component.score}
                className="h-1.5"
                indicatorClassName={getScoreColor(component.score)}
              />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function getDimensionConfig(dimension: string) {
  switch (dimension) {
    case "circadian":
      return {
        name: "Circadian Alignment",
        icon: Brain,
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
        iconColor: "text-purple-600 dark:text-purple-400",
        description:
          "Measures how well this flight aligns with your body's internal clock and natural sleep-wake cycles.",
      };
    case "strategy":
      return {
        name: "Route Strategy",
        icon: Map,
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
        iconColor: "text-blue-600 dark:text-blue-400",
        description:
          "Evaluates routing choices, layover quality, and connection logistics for optimal jetlag recovery.",
      };
    case "comfort":
      return {
        name: "In-Flight Comfort",
        icon: Armchair,
        bgColor: "bg-green-100 dark:bg-green-900/20",
        iconColor: "text-green-600 dark:text-green-400",
        description:
          "Assesses aircraft quality, service standards, and physical comfort factors during flight.",
      };
    case "efficiency":
      return {
        name: "Travel Efficiency",
        icon: Zap,
        bgColor: "bg-orange-100 dark:bg-orange-900/20",
        iconColor: "text-orange-600 dark:text-orange-400",
        description:
          "Considers total travel time, connection stress, and airport congestion factors.",
      };
    default:
      return {
        name: dimension,
        icon: Info,
        bgColor: "bg-gray-100 dark:bg-gray-900/20",
        iconColor: "text-gray-600 dark:text-gray-400",
        description: "",
      };
  }
}
