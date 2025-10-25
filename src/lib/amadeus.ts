/**
 * Simple Amadeus API Client (MVP version)
 * Simplified without circuit breaker and usage tracking
 */

import Amadeus from 'amadeus';

// Initialize Amadeus client
export function getAmadeusClient(): Amadeus {
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    throw new Error('Amadeus API credentials not configured');
  }

  return new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
  });
}

// Export singleton instance
export const amadeus = getAmadeusClient();
