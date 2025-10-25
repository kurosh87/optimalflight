/**
 * AirHex API utilities for fetching airline data and logos
 * API Documentation: https://airhex.com/api/
 */

import CryptoJS from 'crypto-js';

const AIRHEX_API_KEY = process.env.AIRHEX_API_KEY || 'VDjfGgv8mxiTvvLLwGicD6V2eq';
const AIRHEX_BASE_URL = 'https://airhex.com/api';
const AIRHEX_CONTENT_URL = 'https://content.airhex.com/content/logos';

export type LogoType = 'r' | 's' | 't' | 'f'; // rectangular, square, tail, flipped tail
export type ImageFormat = 'png' | 'gif' | 'jpg' | 'svg';

export interface AirlineData {
  iata: string;
  icao: string;
  name: string;
  fleet_size?: number;
  fleet_average_age?: string;
  date_founded?: number;
  hub_code?: string;
  country?: string;
  url?: string;
}

/**
 * Fetch airline data from AirHex API
 * @param iataCode - IATA airline code (e.g., "DL" for Delta)
 */
export async function getAirlineData(iataCode: string): Promise<AirlineData | null> {
  try {
    const response = await fetch(
      `${AIRHEX_BASE_URL}/airlines?api-key=${AIRHEX_API_KEY}&code=${iataCode}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      console.error(`AirHex API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching airline data from AirHex:', error);
    return null;
  }
}

/**
 * Universal MD5 key for AirHex logo authentication (watermark-free)
 * This is a pre-computed hash that works for all airlines
 */
const AIRHEX_MD5_KEY = '53604fb32abbadf2243a7c37812f7185';

/**
 * Get authenticated airline logo URL from AirHex with proper MD5 hashing
 * @param airlineCode - IATA airline code (e.g., "DL" for Delta)
 * @param options - Logo configuration options
 *
 * @example
 * // Rectangular PNG logo (default)
 * getAirlineLogoUrl("DL", { width: 350, height: 100 })
 *
 * @example
 * // Square logo
 * getAirlineLogoUrl("DL", { width: 200, height: 200, type: 's' })
 *
 * @example
 * // Tail logo with custom background
 * getAirlineLogoUrl("DL", { width: 300, height: 200, type: 't', background: '3399cc' })
 */
export function getAirlineLogoUrl(
  airlineCode: string,
  options: {
    width?: number;
    height?: number;
    type?: LogoType;
    format?: ImageFormat;
    proportions?: 'keep' | 'fill';
    background?: string;
  } = {}
): string {
  const {
    width = 350,
    height = 100,
    type = 'r', // rectangular by default
    format = 'png',
    proportions,
    background
  } = options;

  // SVG logos use a simpler format without dimensions or MD5 key
  if (format === 'svg') {
    return `${AIRHEX_CONTENT_URL}/airlines_${airlineCode}_${type}.svg`;
  }

  // Build base URL with universal MD5 key (watermark-free)
  let url = `${AIRHEX_CONTENT_URL}/airlines_${airlineCode}_${width}_${height}_${type}.${format}?md5apikey=${AIRHEX_MD5_KEY}`;

  // Add optional parameters
  if (proportions) {
    url += `&proportions=${proportions}`;
  }
  if (background) {
    url += `&background=${background}`;
  }

  return url;
}

/**
 * Get multiple airline logo versions (rectangular, square, tail)
 * Useful for storing all versions in Vercel Blob
 */
export function getAirlineLogoVersions(
  airlineCode: string,
  sizes: { width: number; height: number }[] = [
    { width: 350, height: 100 }, // rectangular
    { width: 200, height: 200 }, // square large
    { width: 100, height: 100 }, // square small
  ]
): Record<string, string> {
  const logos: Record<string, string> = {};

  sizes.forEach(({ width, height }) => {
    const type: LogoType = width === height ? 's' : 'r';
    const key = `${type}_${width}x${height}`;
    logos[key] = getAirlineLogoUrl(airlineCode, { width, height, type, proportions: 'keep' });
  });

  return logos;
}

/**
 * Extract airline IATA code from flight number or airline name
 * @param flightNumber - Flight number like "DL123" or "AC90"
 * @param airlineName - Airline name or code
 */
export function extractAirlineCode(flightNumber?: string | null, airlineName?: string | null): string | null {
  // If airline name is already a 2-letter code, use it
  if (airlineName && /^[A-Z]{2}$/.test(airlineName)) {
    return airlineName;
  }

  // Try to extract from flight number (first 2-3 letters)
  if (flightNumber) {
    const match = flightNumber.match(/^([A-Z]{2,3})/);
    if (match) {
      return match[1].substring(0, 2); // Use first 2 letters for IATA
    }
  }

  return null;
}
