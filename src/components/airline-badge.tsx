"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building, Star, Sun, Utensils, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AirlineImage } from "@/components/ui/entity-image";

interface AirlineBadgeProps {
  iataCode: string;
  name?: string;
  serviceQuality?: number;
  lightingProtocols?: "circadian-optimized" | "manual-dimming" | "basic" | "unknown";
  mealQuality?: number;
  isLegacyCarrier?: boolean;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

export function AirlineBadge({
  iataCode,
  name,
  serviceQuality,
  lightingProtocols,
  mealQuality,
  isLegacyCarrier,
  size = "sm",
  showDetails = false,
  className,
}: AirlineBadgeProps) {
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

  // Determine variant based on service quality
  const getVariant = () => {
    if (!serviceQuality) return "outline";
    if (serviceQuality >= 8) return "default";
    if (serviceQuality >= 6) return "secondary";
    return "outline";
  };

  const getBadgeColor = () => {
    if (!serviceQuality) return "";
    if (serviceQuality >= 8) return "bg-purple-600 hover:bg-purple-700 text-white";
    if (serviceQuality >= 6) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
    return "";
  };

  const hasCircadianLighting = lightingProtocols === "circadian-optimized";

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
            <Building className={iconSizes[size]} />
            <span>{iataCode}</span>
            {hasCircadianLighting && <Sun className={cn(iconSizes[size], "text-yellow-300")} />}
            {serviceQuality && serviceQuality >= 8 && (
              <CheckCircle2 className={cn(iconSizes[size], "text-purple-200")} />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AirlineImage
                code={iataCode}
                name={name}
                size="md"
                rounded="md"
              />
              <p className="font-semibold flex-1">
                {name || iataCode}
                {isLegacyCarrier && " (Legacy Carrier)"}
              </p>
            </div>

            {serviceQuality !== undefined && (
              <div className="space-y-1 pt-2 border-t border-primary/20">
                <div className="flex items-center justify-between text-xs">
                  <span>Service Quality:</span>
                  <span className="font-semibold tabular-nums">{serviceQuality}/10</span>
                </div>
                {serviceQuality >= 8 && (
                  <p className="text-xs text-purple-400">Premium service experience</p>
                )}
                {serviceQuality >= 6 && serviceQuality < 8 && (
                  <p className="text-xs text-blue-400">Good service standards</p>
                )}
                {serviceQuality < 6 && (
                  <p className="text-xs text-muted-foreground">Standard service</p>
                )}
              </div>
            )}

            <div className="text-xs space-y-1 pt-2 border-t border-primary/20">
              <p className="font-medium">Jetlag-Recovery Features:</p>
              <ul className="space-y-1">
                {lightingProtocols && (
                  <li className="flex items-start gap-1.5">
                    <Sun className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">
                        {lightingProtocols === "circadian-optimized" && "Circadian-Optimized Lighting ✨"}
                        {lightingProtocols === "manual-dimming" && "Manual Dimming Available"}
                        {lightingProtocols === "basic" && "Basic Lighting"}
                        {lightingProtocols === "unknown" && "Standard Lighting"}
                      </span>
                      {lightingProtocols === "circadian-optimized" && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Cabin lighting adapts to destination timezone for better sleep/wake cycles
                        </p>
                      )}
                    </div>
                  </li>
                )}

                {mealQuality !== undefined && (
                  <li className="flex items-start gap-1.5">
                    <Utensils className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Meal Quality: {mealQuality}/10</span>
                      {mealQuality >= 7 && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Well-timed meals support circadian adjustment
                        </p>
                      )}
                    </div>
                  </li>
                )}

                {isLegacyCarrier && (
                  <li className="flex items-start gap-1.5">
                    <Star className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Legacy Carrier</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Established airline with consistent service standards
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {!serviceQuality && !lightingProtocols && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-primary/20">
                Using estimated values based on typical {iataCode} service
              </p>
            )}

            {lightingProtocols === "circadian-optimized" && (
              <div className="pt-2 border-t border-primary/20">
                <p className="text-xs font-medium text-yellow-400">Premium airlines with this feature:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Emirates, Qatar Airways, Singapore Airlines, Etihad
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact inline display with just essential info
export function AirlineInline({
  iataCode,
  name,
  serviceQuality,
  lightingProtocols,
}: Pick<AirlineBadgeProps, "iataCode" | "name" | "serviceQuality" | "lightingProtocols">) {
  const hasCircadianLighting = lightingProtocols === "circadian-optimized";

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Building className="h-3.5 w-3.5" />
      <span className="font-medium">{name || iataCode}</span>
      {serviceQuality !== undefined && (
        <span className="text-xs tabular-nums">({serviceQuality}/10)</span>
      )}
      {hasCircadianLighting && <Sun className="h-3 w-3 text-yellow-500" />}
    </div>
  );
}
