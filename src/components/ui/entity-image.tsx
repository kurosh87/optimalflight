"use client";

import { Building2, Plane, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getCachedAirlineLogoByCode, isAirlineLogoCached } from "@/lib/utils/airline-logo-cache";

type EntityType = "airport" | "aircraft" | "airline";

interface EntityImageProps {
  type: EntityType;
  code?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  showLogo?: boolean; // New prop to enable actual logo loading
}

export function EntityImage({
  type,
  code,
  name,
  size = "md",
  className,
  rounded = "md",
  showLogo = true,
}: EntityImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    xs: "h-4 w-4",
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const getEntityConfig = () => {
    switch (type) {
      case "airport":
        return {
          icon: MapPin,
          bgColor: "bg-blue-500/10 dark:bg-blue-400/10",
          iconColor: "text-blue-600 dark:text-blue-400",
          label: code || "Airport",
        };
      case "aircraft":
        return {
          icon: Plane,
          bgColor: "bg-green-500/10 dark:bg-green-400/10",
          iconColor: "text-green-600 dark:text-green-400",
          label: code || "Aircraft",
        };
      case "airline":
        return {
          icon: Building2,
          bgColor: "bg-purple-500/10 dark:bg-purple-400/10",
          iconColor: "text-purple-600 dark:text-purple-400",
          label: code || "Airline",
        };
    }
  };

  const config = getEntityConfig();

  // Get logo URL for airlines
  const getLogoUrl = (): string | null => {
    if (type !== "airline" || !code || !showLogo) return null;

    // Try cached version first
    const cachedUrl = getCachedAirlineLogoByCode(code, 's');
    if (cachedUrl) return cachedUrl;

    // Fallback to AirHex direct SVG (watermark-free)
    return `https://content.airhex.com/content/logos/airlines_${code}_s.svg`;
  };

  const logoUrl = getLogoUrl();
  const shouldShowLogo = logoUrl && !imageError && type === "airline";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        "border-2 border-border",
        sizeClasses[size],
        roundedClasses[rounded],
        config.bgColor,
        className
      )}
      title={name || config.label}
    >
      {/* Placeholder background pattern */}
      <div className={cn("absolute inset-0 opacity-5", shouldShowLogo && imageLoaded && "opacity-0")}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id={`grid-${type}-${code}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" className={config.iconColor} />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#grid-${type}-${code})`} />
        </svg>
      </div>

      {/* Actual Logo Image (for airlines) */}
      {shouldShowLogo && logoUrl && (
        <img
          src={logoUrl}
          alt={`${name || code} logo`}
          className={cn(
            "absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.warn(`Failed to load logo for ${code}`);
            setImageError(true);
          }}
        />
      )}

      {/* Icon Fallback */}
      {(!shouldShowLogo || !imageLoaded) && (
        <config.icon className={cn(iconSizes[size], config.iconColor, "relative z-10")} />
      )}

      {/* Code overlay for larger sizes */}
      {code && (size === "lg" || size === "xl") && !imageLoaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-mono text-center py-0.5 backdrop-blur-sm">
          {code}
        </div>
      )}
    </div>
  );
}

// Specialized components for each entity type
export function AirportImage(props: Omit<EntityImageProps, "type">) {
  return <EntityImage {...props} type="airport" />;
}

export function AircraftImage(props: Omit<EntityImageProps, "type">) {
  return <EntityImage {...props} type="aircraft" />;
}

export function AirlineImage(props: Omit<EntityImageProps, "type">) {
  return <EntityImage {...props} type="airline" />;
}
