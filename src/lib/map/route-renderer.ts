/**
 * Route Visualization with Great Circle Arcs
 * FlightConnections-style route rendering
 */

import * as turf from '@turf/turf';

export interface RouteLineStyle {
  color: string;
  width: number;
  opacity: number;
  blur: number;
}

/**
 * Create great circle path between two points
 * Returns GeoJSON LineString with 100 points for smooth arc
 *
 * @param originCoords [longitude, latitude]
 * @param destCoords [longitude, latitude]
 * @param npoints Number of points in arc (default: 100)
 */
export function createGreatCircleArc(
  originCoords: [number, number],
  destCoords: [number, number],
  npoints: number = 100
): GeoJSON.Feature<GeoJSON.LineString> {
  const from = turf.point(originCoords);
  const to = turf.point(destCoords);

  const greatCircle = turf.greatCircle(from, to, { npoints });

  return greatCircle as GeoJSON.Feature<GeoJSON.LineString>;
}

/**
 * Get route line color
 * Default: Cyan/blue (#00BCD4) like FlightConnections
 * Can customize by alliance, jetlag score, etc.
 */
export function getRouteLineColor(options?: {
  alliance?: string;
  jetlagScore?: number;
  isSelected?: boolean;
}): string {
  if (options?.isSelected) {
    return '#0288D1'; // Darker blue for selected
  }

  // Color by alliance
  if (options?.alliance) {
    switch (options.alliance) {
      case 'Star Alliance':
        return '#FFD700'; // Gold
      case 'Oneworld':
        return '#1E90FF'; // Dodger blue
      case 'SkyTeam':
        return '#87CEEB'; // Sky blue
      default:
        return '#00BCD4'; // Cyan
    }
  }

  // Color by jetlag score
  if (options?.jetlagScore) {
    if (options.jetlagScore <= 3) return '#51cf66'; // Green - low jetlag
    if (options.jetlagScore <= 5) return '#ffd43b'; // Yellow - moderate
    if (options.jetlagScore <= 7) return '#ff922b'; // Orange - high
    return '#ff6b6b'; // Coral - severe jetlag
  }

  // Default FlightConnections cyan
  return '#00BCD4';
}

/**
 * Get route line width
 * Scales based on selection state and frequency
 */
export function getRouteLineWidth(
  isSelected: boolean = false,
  frequencyPerWeek?: number
): number {
  if (isSelected) return 3;

  // Scale by frequency (more frequent = thicker line)
  if (frequencyPerWeek) {
    if (frequencyPerWeek >= 14) return 2; // 2+ flights per day
    if (frequencyPerWeek >= 7) return 1.5; // Daily
    return 1;
  }

  return 1.5; // Default
}

/**
 * Get route line opacity
 * Semi-transparent for overlapping routes visualization
 */
export function getRouteLineOpacity(isSelected: boolean = false): number {
  return isSelected ? 1.0 : 0.5;
}

/**
 * Generate complete route line style
 */
export function getRouteLineStyle(route: {
  isSelected?: boolean;
  alliance?: string;
  jetlagScore?: number;
  frequencyPerWeek?: number;
}): RouteLineStyle {
  return {
    color: getRouteLineColor({
      alliance: route.alliance,
      jetlagScore: route.jetlagScore,
      isSelected: route.isSelected,
    }),
    width: getRouteLineWidth(route.isSelected, route.frequencyPerWeek),
    opacity: getRouteLineOpacity(route.isSelected),
    blur: 0.5,
  };
}

/**
 * Generate Mapbox layer configuration for routes
 */
export function getRouteLayerConfig() {
  return {
    id: 'routes',
    type: 'line' as const,
    source: 'routes',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#0288D1', // Selected route
        '#00BCD4'  // Default cyan
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        3,   // Selected route width
        1.5  // Default route width
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1.0, // Selected route opacity
        0.5  // Default route opacity
      ],
      'line-blur': 0.5,
    },
  };
}

/**
 * Convert routes to GeoJSON FeatureCollection for Mapbox
 */
export function routesToGeoJSON(routes: Array<{
  routeId: string | number;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  airline?: string;
  alliance?: string;
  frequencyPerWeek?: number;
  jetlagScore?: number;
}>): GeoJSON.FeatureCollection {
  const features = routes.map(route => {
    const arc = createGreatCircleArc(
      [route.origin.longitude, route.origin.latitude],
      [route.destination.longitude, route.destination.latitude]
    );

    return {
      ...arc,
      id: route.routeId,
      properties: {
        routeId: route.routeId,
        airline: route.airline,
        alliance: route.alliance,
        frequencyPerWeek: route.frequencyPerWeek,
        jetlagScore: route.jetlagScore,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Calculate bounding box for routes
 * Used to fit map view to show all routes
 */
export function calculateRouteBounds(routes: Array<{
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}>): [[number, number], [number, number]] {
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  routes.forEach(route => {
    // Check origin
    minLng = Math.min(minLng, route.origin.longitude);
    maxLng = Math.max(maxLng, route.origin.longitude);
    minLat = Math.min(minLat, route.origin.latitude);
    maxLat = Math.max(maxLat, route.origin.latitude);

    // Check destination
    minLng = Math.min(minLng, route.destination.longitude);
    maxLng = Math.max(maxLng, route.destination.longitude);
    minLat = Math.min(minLat, route.destination.latitude);
    maxLat = Math.max(maxLat, route.destination.latitude);
  });

  // Add padding
  const padding = 5; // degrees
  return [
    [minLng - padding, minLat - padding],
    [maxLng + padding, maxLat + padding],
  ];
}

/**
 * Optimize route rendering for mobile
 * Reduces arc complexity on mobile devices
 */
export function getOptimalArcComplexity(isMobile: boolean = false): number {
  return isMobile ? 50 : 100; // Fewer points on mobile for performance
}
