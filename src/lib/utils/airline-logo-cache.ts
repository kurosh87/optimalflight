/**
 * Airline logo cache helper - returns Vercel Blob URLs for cached SVG logos
 * Uses SVG format for perfect scaling and permanent storage
 */

import { extractAirlineCode } from '@/lib/api/airhex';

const VERCEL_BLOB_BASE = 'https://nbxsi9emg84gcrw9.public.blob.vercel-storage.com/airline-logos';

/**
 * All cached airline codes in Vercel Blob Storage
 * SVG versions are permanently stored and watermark-free
 */
export const CACHED_AIRLINES = ['AC', 'BR', 'EK', 'JL', 'LH', 'NH', 'SQ', 'UA'] as const;
export type CachedAirlineCode = typeof CACHED_AIRLINES[number];

/**
 * Get cached airline logo SVG URL from Vercel Blob
 * Always returns SVG for perfect scaling and no watermarks
 * @param flightNumber - Flight number (e.g., "JL61")
 * @param airlineName - Airline name or code
 * @param type - Logo type: 'r' (rectangular) or 's' (square)
 */
export function getCachedAirlineLogo(
  flightNumber: string | null,
  airlineName: string | null,
  type: 'r' | 's' = 'r'
): string | null {
  const code = extractAirlineCode(flightNumber, airlineName);

  if (!code) return null;
  if (!CACHED_AIRLINES.includes(code as CachedAirlineCode)) return null;

  return `${VERCEL_BLOB_BASE}/${code}_${type}.svg`;
}

/**
 * Get cached airline logo by code
 * @param airlineCode - IATA airline code (e.g., "JL", "UA")
 * @param type - Logo type: 'r' (rectangular) or 's' (square)
 */
export function getCachedAirlineLogoByCode(
  airlineCode: string,
  type: 'r' | 's' = 'r'
): string | null {
  if (!CACHED_AIRLINES.includes(airlineCode as CachedAirlineCode)) return null;
  return `${VERCEL_BLOB_BASE}/${airlineCode}_${type}.svg`;
}

/**
 * Check if an airline logo is cached
 */
export function isAirlineLogoCached(airlineCode: string): airlineCode is CachedAirlineCode {
  return CACHED_AIRLINES.includes(airlineCode as CachedAirlineCode);
}

/**
 * Get all available logo versions for a cached airline
 */
export function getAllLogoVersions(airlineCode: string) {
  if (!isAirlineLogoCached(airlineCode)) return null;

  return {
    rectangular: `${VERCEL_BLOB_BASE}/${airlineCode}_r.svg`,
    square: `${VERCEL_BLOB_BASE}/${airlineCode}_s.svg`,
    // PNG fallbacks (for older browsers that don't support SVG)
    rectangular_png: `${VERCEL_BLOB_BASE}/${airlineCode}_350x100_r.png`,
    square_png_large: `${VERCEL_BLOB_BASE}/${airlineCode}_200x200_s.png`,
    square_png_medium: `${VERCEL_BLOB_BASE}/${airlineCode}_100x100_s.png`,
    square_png_small: `${VERCEL_BLOB_BASE}/${airlineCode}_64x64_s.png`,
  };
}

/**
 * Get airline logo with fallback to direct AirHex SVG for uncached airlines
 * Returns cached Vercel Blob URL if available, otherwise falls back to AirHex direct URL
 */
export function getAirlineLogoWithFallback(
  flightNumber: string | null,
  airlineName: string | null,
  type: 'r' | 's' = 'r'
): string | null {
  const code = extractAirlineCode(flightNumber, airlineName);
  if (!code) return null;

  // Try cached version first
  if (isAirlineLogoCached(code)) {
    return `${VERCEL_BLOB_BASE}/${code}_${type}.svg`;
  }

  // Fallback to AirHex direct URL (SVG, no watermark)
  return `https://content.airhex.com/content/logos/airlines_${code}_${type}.svg`;
}
