/**
 * Brave Search API client for image search
 * Documentation: https://api-dashboard.search.brave.com/app/documentation/image-search/get-started
 */

export interface BraveImageResult {
  type: 'image';
  title: string;
  url: string; // URL of the image
  source: string; // URL of the page containing the image
  page_fetched: string;
  thumbnail: {
    src: string;
    original: string;
    logo: boolean;
  };
  properties: {
    url: string;
    width: number;
    height: number;
    format: string;
    content_size?: string;
  };
}

export interface BraveImageSearchResponse {
  type: 'images';
  query: {
    original: string;
    show_strict_warning: boolean;
    altered?: string;
    safesearch: boolean;
    is_navigational: boolean;
    is_news_breaking: boolean;
    spellcheck_off: boolean;
    country: string;
    bad_results: boolean;
    should_fallback: boolean;
    postal_code: string;
    city: string;
    header_country: string;
    more_results_available: boolean;
    state: string;
  };
  results: BraveImageResult[];
}

export interface BraveSearchOptions {
  query: string;
  count?: number; // Default: 20, Max: 150
  safesearch?: 'off' | 'moderate' | 'strict'; // Default: moderate
  search_lang?: string; // Default: en
  country?: string; // Default: us
  spellcheck?: boolean; // Default: true
}

export class BraveSearchClient {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/images/search';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.BRAVE_SEARCH_API_KEY || '';
    if (!key) {
      throw new Error('Brave Search API key is required. Set BRAVE_SEARCH_API_KEY environment variable.');
    }
    this.apiKey = key;
  }

  /**
   * Search for images using Brave Search API
   */
  async searchImages(options: BraveSearchOptions): Promise<BraveImageSearchResponse> {
    const {
      query,
      count = 20,
      safesearch = 'strict',
      search_lang = 'en',
      country = 'us',
      spellcheck = true,
    } = options;

    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
      safesearch,
      search_lang,
      country,
      spellcheck: spellcheck ? '1' : '0',
    });

    const url = `${this.baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Brave Search API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Search for airport images with optimized queries
   */
  async searchAirportImages(
    airportCode: string,
    airportName: string,
    count: number = 20
  ): Promise<BraveImageResult[]> {
    // Try multiple search queries to find the best images
    const searchQueries = [
      `${airportCode} ${airportName} airport terminal exterior`,
      `${airportName} airport building`,
      `${airportCode} airport terminal`,
    ];

    const allResults: BraveImageResult[] = [];

    for (const query of searchQueries) {
      try {
        const response = await this.searchImages({
          query,
          count: Math.min(count, 20), // Brave API max per request
          safesearch: 'strict',
        });

        allResults.push(...response.results);

        // If we have enough results, stop searching
        if (allResults.length >= count) {
          break;
        }

        // Rate limiting: small delay between queries
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to search with query "${query}":`, error);
        // Continue with next query
      }
    }

    return this.filterAndRankAirportImages(allResults, airportCode, airportName);
  }

  /**
   * Filter and rank airport images by relevance and quality
   */
  private filterAndRankAirportImages(
    results: BraveImageResult[],
    airportCode: string,
    airportName: string
  ): BraveImageResult[] {
    return results
      .filter((img) => {
        // Filter out images that are too small
        if (!img.properties.width || !img.properties.height) return true; // Keep if unknown
        if (img.properties.width < 800 || img.properties.height < 600) return false;

        // Filter out logos
        if (img.thumbnail.logo) return false;

        // Filter out maps and diagrams (basic heuristics)
        const title = img.title.toLowerCase();
        if (title.includes('map') || title.includes('diagram') || title.includes('chart')) {
          return false;
        }

        return true;
      })
      .map((img) => ({
        ...img,
        relevanceScore: this.calculateRelevanceScore(img, airportCode, airportName),
      }))
      .sort((a, b) => {
        // Sort by relevance score (higher is better)
        const scoreA = (a as any).relevanceScore;
        const scoreB = (b as any).relevanceScore;
        return scoreB - scoreA;
      })
      .map(({ relevanceScore, ...img }) => img); // Remove the score from final results
  }

  /**
   * Calculate a relevance score for an image
   */
  private calculateRelevanceScore(
    img: BraveImageResult,
    airportCode: string,
    airportName: string
  ): number {
    let score = 0;
    const title = img.title.toLowerCase();
    const source = img.source.toLowerCase();
    const url = img.url.toLowerCase();

    // Positive signals
    if (title.includes(airportCode.toLowerCase())) score += 30;
    if (title.includes(airportName.toLowerCase())) score += 20;
    if (title.includes('airport')) score += 15;
    if (title.includes('terminal')) score += 10;
    if (title.includes('exterior')) score += 5;
    if (title.includes('building')) score += 5;

    // Quality signals
    const width = img.properties.width || 0;
    const height = img.properties.height || 0;
    const pixels = width * height;

    if (pixels >= 2000000) score += 15; // 2MP+
    else if (pixels >= 1000000) score += 10; // 1MP+
    else if (pixels >= 500000) score += 5; // 0.5MP+

    // Aspect ratio preference (landscape images for airports)
    if (width > 0 && height > 0) {
      const aspectRatio = width / height;
      if (aspectRatio >= 1.2 && aspectRatio <= 2.0) score += 10; // Good landscape ratio
    }

    // Source credibility (prefer official sources)
    if (
      source.includes('wikipedia') ||
      source.includes('official') ||
      source.includes('.gov') ||
      source.includes('.aero')
    ) {
      score += 20;
    }

    // Negative signals
    if (title.includes('map')) score -= 50;
    if (title.includes('diagram')) score -= 50;
    if (title.includes('logo')) score -= 50;
    if (title.includes('icon')) score -= 30;

    return score;
  }
}

// Export a factory function instead of singleton to avoid import-time errors
export function createBraveSearchClient(apiKey?: string): BraveSearchClient {
  return new BraveSearchClient(apiKey);
}
