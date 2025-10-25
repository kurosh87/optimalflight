"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plane, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AircraftImage } from "@/components/ui/entity-image";

interface AircraftBadgeProps {
  iataCode: string;
  name?: string;
  sleepScore?: number;
  isNextGen?: boolean;
  seatComfort?: number;
  cabinPressure?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

export function AircraftBadge({
  iataCode,
  name,
  sleepScore,
  isNextGen,
  seatComfort,
  cabinPressure,
  size = "sm",
  showDetails = false,
  className,
}: AircraftBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  // Determine variant based on sleep score
  const getVariant = () => {
    if (!sleepScore) return "outline";
    if (sleepScore >= 8) return "default";
    if (sleepScore >= 6) return "secondary";
    return "outline";
  };

  const getBadgeColor = () => {
    if (!sleepScore) return "";
    if (sleepScore >= 8) return "bg-green-600 hover:bg-green-700 text-white";
    if (sleepScore >= 6) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    return "";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getVariant()}
            className={cn(
              sizeClasses[size],
              getBadgeColor(),
              "cursor-help font-medium gap-1",
              className
            )}
          >
            <Plane className={iconSizes[size]} />
            <span>{iataCode}</span>
            {isNextGen && <Sparkles className={cn(iconSizes[size], "text-yellow-400")} />}
            {sleepScore && sleepScore >= 8 && (
              <CheckCircle2 className={cn(iconSizes[size], "text-green-200")} />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AircraftImage
                code={iataCode}
                name={name}
                size="md"
                rounded="md"
              />
              <p className="font-semibold flex-1">
                {name || iataCode} {isNextGen && "✨"}
              </p>
            </div>
            {isNextGen && (
              <p className="text-xs text-yellow-400">
                Next-generation aircraft with enhanced jetlag-recovery features
              </p>
            )}

            {sleepScore !== undefined && (
              <div className="space-y-1 pt-2 border-t border-primary/20">
                <div className="flex items-center justify-between text-xs">
                  <span>Sleep Quality Score:</span>
                  <span className="font-semibold tabular-nums">{sleepScore}/10</span>
                </div>
                {sleepScore >= 8 && (
                  <p className="text-xs text-green-400">Excellent for rest during flight</p>
                )}
                {sleepScore >= 6 && sleepScore < 8 && (
                  <p className="text-xs text-blue-400">Good for rest during flight</p>
                )}
                {sleepScore < 6 && (
                  <p className="text-xs text-muted-foreground">Adequate for shorter flights</p>
                )}
              </div>
            )}

            <div className="text-xs space-y-1 pt-2 border-t border-primary/20">
              <p className="font-medium">Key Features:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {seatComfort !== undefined && (
                  <li>Seat comfort: {seatComfort}/10</li>
                )}
                {cabinPressure !== undefined && (
                  <li>
                    Cabin pressure: {cabinPressure.toLocaleString()}ft
                    {cabinPressure <= 6000 && " (Excellent)"}
                  </li>
                )}
                {isNextGen && (
                  <>
                    <li>Advanced cabin humidity control</li>
                    <li>Larger windows for natural light</li>
                    <li>Quieter cabin environment</li>
                  </>
                )}
              </ul>
            </div>

            {!sleepScore && !seatComfort && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-primary/20">
                Using estimated values based on typical {iataCode} configuration
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact inline display with just essential info
export function AircraftInline({
  iataCode,
  name,
  sleepScore,
  isNextGen,
}: Pick<AircraftBadgeProps, "iataCode" | "name" | "sleepScore" | "isNextGen">) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Plane className="h-3.5 w-3.5" />
      <span className="font-medium">{name || iataCode}</span>
      {sleepScore !== undefined && (
        <span className="text-xs tabular-nums">({sleepScore}/10)</span>
      )}
      {isNextGen && <Sparkles className="h-3 w-3 text-yellow-500" />}
    </div>
  );
}
