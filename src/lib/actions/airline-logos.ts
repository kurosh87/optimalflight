"use server";

import { put, del, head } from "@vercel/blob";
import { getAirlineLogoUrl, getAirlineLogoVersions } from "@/lib/api/airhex";

/**
 * Cache airline logo to Vercel Blob Storage
 * Downloads from AirHex and uploads to Vercel Blob for faster loading
 */
export async function cacheAirlineLogo(
  airlineCode: string,
  options: {
    width?: number;
    height?: number;
    type?: 'r' | 's' | 't' | 'f';
    format?: 'png' | 'svg';
    overwrite?: boolean;
  } = {}
): Promise<string | null> {
  try {
    const { width = 350, height = 100, type = 'r', format = 'png', overwrite = false } = options;

    // Build blob key based on format
    const extension = format === 'svg' ? 'svg' : 'png';
    const blobKey = format === 'svg'
      ? `airline-logos/${airlineCode}_${type}.${extension}`
      : `airline-logos/${airlineCode}_${width}x${height}_${type}.${extension}`;

    // If overwrite is requested, delete existing blob first
    if (overwrite) {
      try {
        // Construct the full blob URL to delete
        const blobUrl = `https://nbxsi9emg84gcrw9.public.blob.vercel-storage.com/${blobKey}`;
        await del(blobUrl);
      } catch (delError) {
        // Ignore errors if blob doesn't exist
        console.log(`No existing blob to delete for ${blobKey}`);
      }
    }

    // Generate AirHex URL with proper authentication
    const airHexUrl = getAirlineLogoUrl(airlineCode, {
      width,
      height,
      type,
      format,
      proportions: 'keep'
    });

    // Download logo from AirHex
    const response = await fetch(airHexUrl);
    if (!response.ok) {
      console.error(`Failed to fetch airline logo for ${airlineCode}: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png';

    // Upload to Vercel Blob with caching headers
    const result = await put(blobKey, blob, {
      access: 'public',
      addRandomSuffix: false,
      contentType,
      cacheControlMaxAge: 31536000, // 1 year
    });

    return result.url;
  } catch (error) {
    console.error(`Error caching airline logo for ${airlineCode}:`, error);
    return null;
  }
}

/**
 * Cache multiple versions of an airline logo (rectangular, square, different sizes)
 * Returns URLs for all cached versions
 */
export async function cacheAirlineLogoVersions(
  airlineCode: string,
  options: { overwrite?: boolean; includeSvg?: boolean } = {}
): Promise<Record<string, string>> {
  const { overwrite = false, includeSvg = true } = options;

  type VersionConfig = {
    width: number;
    height: number;
    type: 'r' | 's' | 't' | 'f';
    format: 'png' | 'svg';
  };

  const versions: VersionConfig[] = [
    { width: 350, height: 100, type: 'r', format: 'png' }, // rectangular
    { width: 200, height: 200, type: 's', format: 'png' }, // square large
    { width: 100, height: 100, type: 's', format: 'png' }, // square small
    { width: 64, height: 64, type: 's', format: 'png' },   // square tiny (favicon)
  ];

  // Add SVG versions if requested
  if (includeSvg) {
    versions.push(
      { width: 0, height: 0, type: 'r', format: 'svg' }, // rectangular SVG
      { width: 0, height: 0, type: 's', format: 'svg' }, // square SVG
    );
  }

  const cachedUrls: Record<string, string> = {};

  await Promise.all(
    versions.map(async ({ width, height, type, format }) => {
      const key = format === 'svg' ? `${type}_svg` : `${type}_${width}x${height}`;
      const url = await cacheAirlineLogo(airlineCode, { width, height, type, format, overwrite });
      if (url) {
        cachedUrls[key] = url;
      }
    })
  );

  return cachedUrls;
}

/**
 * Get airline logo URL - either from Vercel Blob cache or directly from AirHex
 * This is a convenience function that tries cache first
 */
export async function getAirlineLogoUrlCached(
  airlineCode: string,
  options: {
    width?: number;
    height?: number;
    type?: 'r' | 's' | 't' | 'f';
    useCache?: boolean;
  } = {}
): Promise<string> {
  const { width = 350, height = 100, type = 'r', useCache = true } = options;

  if (useCache) {
    // Try to get from cache first
    const cachedUrl = await cacheAirlineLogo(airlineCode, { width, height, type });
    if (cachedUrl) {
      return cachedUrl;
    }
  }

  // Fallback to direct AirHex URL
  return getAirlineLogoUrl(airlineCode, {
    width,
    height,
    type,
    proportions: 'keep'
  });
}
