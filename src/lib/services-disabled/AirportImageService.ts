/**
 * Airport Image Service
 * Handles searching, caching, and managing airport images using Brave Search API and Vercel Blob
 */

import { put } from '@vercel/blob';
import { BraveSearchClient, BraveImageResult } from '../api/brave-search';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export interface AirportImageMetadata {
  sourceUrl: string;
  pageUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  cachedAt: string;
  searchQuery: string;
  imageQuality: 'high' | 'medium' | 'low';
}

export interface CacheImageResult {
  success: boolean;
  imageUrl?: string;
  metadata?: AirportImageMetadata;
  error?: string;
}

export class AirportImageService {
  private braveClient: BraveSearchClient;

  constructor(braveApiKey?: string) {
    this.braveClient = new BraveSearchClient(braveApiKey);
  }

  /**
   * Search, download, and cache the best airport image
   */
  async searchAndCacheAirportImage(
    airportCode: string,
    airportName: string,
    countryName?: string
  ): Promise<CacheImageResult> {
    try {
      // Search for airport images
      const searchQuery = countryName
        ? `${airportCode} ${airportName} ${countryName} airport`
        : `${airportCode} ${airportName} airport`;

      const images = await this.braveClient.searchAirportImages(
        airportCode,
        airportName,
        20 // Get top 20 to have good options
      );

      if (images.length === 0) {
        return {
          success: false,
          error: 'No images found',
        };
      }

      // Select the best image (first one after ranking)
      const bestImage = images[0];

      // Download and upload to Vercel Blob
      const result = await this.downloadAndCacheImage(
        bestImage,
        airportCode,
        searchQuery
      );

      if (result.success && result.imageUrl && result.metadata) {
        // Update database
        await this.updateAirportImage(airportCode, result.imageUrl, result.metadata);
      }

      return result;
    } catch (error) {
      console.error(`Error caching image for ${airportCode}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download image from URL and cache it to Vercel Blob
   */
  private async downloadAndCacheImage(
    image: BraveImageResult,
    airportCode: string,
    searchQuery: string
  ): Promise<CacheImageResult> {
    try {
      // Check for Vercel Blob token
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN not set');
      }

      // Download the image
      const response = await fetch(image.properties.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JetlagApp/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Determine file extension
      const extension = this.getFileExtension(contentType, image.properties.format);

      // Upload to Vercel Blob
      const blobFilename = `airports/${airportCode.toLowerCase()}.${extension}`;
      const blob = await put(blobFilename, imageBuffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false, // Use consistent filename
      });

      // Determine image quality
      const quality = this.assessImageQuality(image);

      const metadata: AirportImageMetadata = {
        sourceUrl: image.properties.url,
        pageUrl: image.source,
        dimensions: {
          width: image.properties.width,
          height: image.properties.height,
        },
        format: image.properties.format,
        cachedAt: new Date().toISOString(),
        searchQuery,
        imageQuality: quality,
      };

      return {
        success: true,
        imageUrl: blob.url,
        metadata,
      };
    } catch (error) {
      console.error('Error downloading/caching image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update airport record with image URL and metadata
   */
  private async updateAirportImage(
    airportCode: string,
    imageUrl: string,
    metadata: AirportImageMetadata
  ): Promise<void> {
    try {
      await sql`
        UPDATE airports
        SET
          image_url = ${imageUrl},
          image_metadata = ${JSON.stringify(metadata)}::jsonb,
          updated_at = NOW()
        WHERE iata_code = ${airportCode}
      `;
    } catch (error) {
      console.error(`Error updating database for ${airportCode}:`, error);
      throw error;
    }
  }

  /**
   * Assess image quality based on dimensions and format
   */
  private assessImageQuality(image: BraveImageResult): 'high' | 'medium' | 'low' {
    const width = image.properties.width;
    const height = image.properties.height;
    const pixels = width * height;

    if (pixels >= 2000000 && width >= 1920) return 'high';
    if (pixels >= 1000000 && width >= 1280) return 'medium';
    return 'low';
  }

  /**
   * Get file extension from content type or format
   */
  private getFileExtension(contentType: string, format?: string): string {
    if (format) {
      return format.toLowerCase();
    }

    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';

    return 'jpg'; // Default
  }

  /**
   * Get all airports that need images
   */
  async getAirportsNeedingImages(): Promise<
    Array<{
      id: string;
      iataCode: string;
      airportName: string;
      countryName: string | null;
    }>
  > {
    const results = await sql`
      SELECT id, iata_code as "iataCode", airport_name as "airportName", country_name as "countryName"
      FROM airports
      WHERE iata_code IS NOT NULL
        AND is_active = true
        AND (image_url IS NULL OR image_url = '')
      ORDER BY airport_name
    `;

    return results as any[];
  }

  /**
   * Get count of airports with and without images
   */
  async getImageStatistics(): Promise<{
    total: number;
    withImages: number;
    withoutImages: number;
    percentage: number;
  }> {
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(image_url) as with_images,
        COUNT(*) - COUNT(image_url) as without_images
      FROM airports
      WHERE iata_code IS NOT NULL AND is_active = true
    `;

    const row = stats[0] as any;
    const total = Number(row.total);
    const withImages = Number(row.with_images);
    const withoutImages = Number(row.without_images);
    const percentage = total > 0 ? (withImages / total) * 100 : 0;

    return {
      total,
      withImages,
      withoutImages,
      percentage: Math.round(percentage * 10) / 10,
    };
  }

  /**
   * Clear cached image for an airport (useful for re-caching)
   */
  async clearAirportImage(airportCode: string): Promise<void> {
    await sql`
      UPDATE airports
      SET
        image_url = NULL,
        image_metadata = NULL,
        updated_at = NOW()
      WHERE iata_code = ${airportCode}
    `;
  }
}

// Export singleton instance
export const airportImageService = new AirportImageService();
