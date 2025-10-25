/**
 * FlightConnections-Style Airport Marker System
 * Three-tier color-coded markers based on destination count
 */

export interface AirportMarkerStyle {
  color: string;
  radius: number;
  strokeWidth: number;
  strokeColor: string;
  opacity: number;
}

export type AirportSizeCategory = 'large' | 'medium' | 'small';

/**
 * Determine airport category based on destination count
 *
 * FlightConnections system:
 * - Blue (30+ destinations): Major international hubs (ATL: 244, JFK, LHR, DXB)
 * - Yellow (7-30 destinations): Regional hubs
 * - Red (<7 destinations): Small regional airports
 */
export function getAirportCategory(destinationCount: number): AirportSizeCategory {
  if (destinationCount >= 30) return 'large';
  if (destinationCount >= 7) return 'medium';
  return 'small';
}

/**
 * Get marker color for airport category
 * Matches FlightConnections visual hierarchy
 */
export function getAirportMarkerColor(category: AirportSizeCategory): string {
  switch (category) {
    case 'large':
      return '#2196F3'; // Blue - Major hubs
    case 'medium':
      return '#FFC107'; // Yellow - Regional hubs
    case 'small':
      return '#F44336'; // Red - Small airports
    default:
      return '#9E9E9E'; // Gray - Unknown
  }
}

/**
 * Calculate marker radius based on destination count
 * Scales with number of destinations for visual emphasis
 */
export function getAirportMarkerRadius(
  destinationCount: number,
  category: AirportSizeCategory
): number {
  switch (category) {
    case 'large':
      // Large airports: 8-20px radius
      return Math.min(8 + (destinationCount / 30), 20);
    case 'medium':
      // Medium airports: 6-12px radius
      return Math.min(6 + (destinationCount / 10), 12);
    case 'small':
      // Small airports: 4-10px radius
      return 4 + destinationCount;
    default:
      return 5;
  }
}

/**
 * Get complete marker style for Mapbox GL JS
 */
export function getAirportMarkerStyle(
  destinationCount: number
): AirportMarkerStyle {
  const category = getAirportCategory(destinationCount);
  const color = getAirportMarkerColor(category);
  const radius = getAirportMarkerRadius(destinationCount, category);

  return {
    color,
    radius,
    strokeWidth: 1,
    strokeColor: '#ffffff',
    opacity: 0.8,
  };
}

/**
 * Generate Mapbox layer configuration for airport markers
 */
export function getAirportLayerConfig() {
  return {
    id: 'airports',
    type: 'circle' as const,
    source: 'airports',
    paint: {
      // Color based on destination count
      'circle-color': [
        'case',
        ['>=', ['get', 'totalDestinationsCount'], 30],
        '#2196F3', // Blue - large
        ['>=', ['get', 'totalDestinationsCount'], 7],
        '#FFC107', // Yellow - medium
        '#F44336'  // Red - small
      ],
      // Radius based on destination count
      'circle-radius': [
        'case',
        ['>=', ['get', 'totalDestinationsCount'], 30],
        ['+', 8, ['/', ['get', 'totalDestinationsCount'], 30]], // 8-20px
        ['>=', ['get', 'totalDestinationsCount'], 7],
        ['+', 6, ['/', ['get', 'totalDestinationsCount'], 10]], // 6-12px
        ['+', 4, ['get', 'totalDestinationsCount']] // 4-10px
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.8,
    },
  };
}

/**
 * Get hover/selected state style
 */
export function getSelectedAirportStyle() {
  return {
    'circle-opacity': 1.0,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#000000',
    'circle-radius': ['*', ['get', 'circle-radius'], 1.3], // 30% larger
  };
}

/**
 * Format airport popup content
 */
export function formatAirportPopup(airport: {
  iataCode: string;
  airportName: string;
  cityName: string;
  countryName: string;
  totalDestinationsCount: number;
}): string {
  const category = getAirportCategory(airport.totalDestinationsCount);
  const categoryLabel = category === 'large' ? 'Major Hub' : category === 'medium' ? 'Regional Hub' : 'Regional Airport';

  return `
    <div class="p-3">
      <div class="font-bold text-lg mb-1">
        ${airport.iataCode} - ${airport.cityName}
      </div>
      <div class="text-sm text-gray-600 mb-2">
        ${airport.airportName}
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          ${categoryLabel}
        </span>
        <span class="text-sm text-gray-600">
          ${airport.totalDestinationsCount} destinations
        </span>
      </div>
    </div>
  `;
}
