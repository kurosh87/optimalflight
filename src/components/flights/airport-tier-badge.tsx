"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, MapPin, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

type AirportTier = "tier_1" | "tier_2" | "tier_3";

interface AirportTierBadgeProps {
  tier: AirportTier;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AirportTierBadge({
  tier,
  showIcon = true,
  showLabel = true,
  size = "md",
  className,
}: AirportTierBadgeProps) {
  const tierConfig = getTierConfig(tier);

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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={tierConfig.variant}
            className={cn(
              sizeClasses[size],
              tierConfig.className,
              "cursor-help font-medium",
              className
            )}
          >
            {showIcon && (
              <tierConfig.icon className={cn(iconSizes[size], showLabel && "mr-1.5")} />
            )}
            {showLabel && tierConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{tierConfig.fullName}</p>
            <p className="text-xs">{tierConfig.description}</p>
            <div className="text-xs pt-2 border-t border-primary/20">
              <p className="font-medium mb-1">Characteristics:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {tierConfig.characteristics.map((char, idx) => (
                  <li key={idx}>{char}</li>
                ))}
              </ul>
            </div>
            {tierConfig.examples.length > 0 && (
              <div className="text-xs pt-2 border-t border-primary/20">
                <p className="font-medium mb-1">Examples:</p>
                <p className="text-muted-foreground">{tierConfig.examples.join(", ")}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getTierConfig(tier: AirportTier) {
  switch (tier) {
    case "tier_1":
      return {
        label: "Tier 1",
        fullName: "Major International Hub",
        icon: Building2,
        variant: "default" as const,
        className: "bg-blue-600 hover:bg-blue-700 text-white border-blue-700",
        description:
          "Major global hub airport with 40M+ passengers annually. Excellent facilities and connectivity.",
        characteristics: [
          "40M+ passengers per year",
          "100+ destinations served",
          "Major airline hub status",
          "Intercontinental flights",
          "Premium layover facilities",
        ],
        examples: ["JFK", "LHR", "DXB", "SIN", "LAX", "CDG", "FRA"],
      };
    case "tier_2":
      return {
        label: "Tier 2",
        fullName: "Regional Hub",
        icon: MapPin,
        variant: "secondary" as const,
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700",
        description:
          "Regional hub or large airport with 10-40M passengers annually. Good facilities and connections.",
        characteristics: [
          "10-40M passengers per year",
          "50-100 destinations served",
          "Regional hub status",
          "Some international routes",
          "Good layover facilities",
        ],
        examples: ["BOS", "SFO", "MUC", "ZRH", "SYD", "GRU", "YVR"],
      };
    case "tier_3":
      return {
        label: "Tier 3",
        fullName: "Domestic/Regional Airport",
        icon: Plane,
        variant: "outline" as const,
        className: "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700",
        description:
          "Domestic or small regional airport with <10M passengers annually. Basic facilities.",
        characteristics: [
          "<10M passengers per year",
          "Primarily domestic routes",
          "Limited international service",
          "Basic layover facilities",
          "Secondary/regional airport",
        ],
        examples: ["Most domestic US airports", "Regional European airports", "Secondary city airports"],
      };
    default:
      return getTierConfig("tier_3"); // Fallback
  }
}
