/**
 * Affiliate Revenue System
 * Secondary revenue stream (target: 10% of total)
 *
 * Revenue Sources:
 * 1. Credit card signups: $50-150 per signup
 * 2. Hotel bookings: 3-5% commission
 * 3. Flight bookings: $0.50-2.00 per search initiated
 * 4. Travel insurance: 5-10% commission
 */

export interface AffiliatePartner {
  id: string;
  name: string;
  type: 'credit_card' | 'hotel' | 'flight' | 'insurance';
  commissionType: 'cpa' | 'cpc' | 'percentage';
  commissionRate: number;
  trackingUrl: string;
}

/**
 * Affiliate Partners Configuration
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  // Credit Cards (Highest commission)
  {
    id: 'chase_sapphire',
    name: 'Chase Sapphire Reserve',
    type: 'credit_card',
    commissionType: 'cpa',
    commissionRate: 150, // $150 per signup
    trackingUrl: 'https://creditcards.chase.com/...',
  },
  {
    id: 'amex_platinum',
    name: 'Amex Platinum',
    type: 'credit_card',
    commissionType: 'cpa',
    commissionRate: 100,
    trackingUrl: 'https://americanexpress.com/...',
  },

  // Hotels
  {
    id: 'booking_com',
    name: 'Booking.com',
    type: 'hotel',
    commissionType: 'percentage',
    commissionRate: 4, // 4% of booking value
    trackingUrl: 'https://booking.com/affiliate/...',
  },
  {
    id: 'hotels_com',
    name: 'Hotels.com',
    type: 'hotel',
    commissionType: 'percentage',
    commissionRate: 4.5,
    trackingUrl: 'https://hotels.com/affiliate/...',
  },

  // Flight Search (CPC model)
  {
    id: 'google_flights',
    name: 'Google Flights',
    type: 'flight',
    commissionType: 'cpc',
    commissionRate: 1.5, // $1.50 per search initiated
    trackingUrl: 'https://www.google.com/flights/...',
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    type: 'flight',
    commissionType: 'cpc',
    commissionRate: 1.0,
    trackingUrl: 'https://skyscanner.com/...',
  },

  // Travel Insurance
  {
    id: 'world_nomads',
    name: 'World Nomads',
    type: 'insurance',
    commissionType: 'percentage',
    commissionRate: 8, // 8% of premium
    trackingUrl: 'https://worldnomads.com/affiliate/...',
  },
];

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(
  partnerId: string,
  userId: string | null,
  context: {
    route?: string;
    searchParams?: any;
  }
): Promise<void> {
  // TODO: Log affiliate click to database
  // Track conversion attribution

  console.log('Affiliate click tracked:', {
    partnerId,
    userId,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate affiliate tracking URL
 */
export function generateAffiliateUrl(
  partner: AffiliatePartner,
  userId: string | null,
  additionalParams?: Record<string, string>
): string {
  const baseUrl = partner.trackingUrl;

  // Add tracking parameters
  const params = new URLSearchParams({
    source: 'flightoptima',
    user_id: userId || 'anonymous',
    partner_id: partner.id,
    ...additionalParams,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Credit card recommendations based on route
 * Show relevant cards for the route being searched
 */
export function getRelevantCreditCards(route: {
  origin: string;
  destination: string;
  isInternational: boolean;
}): AffiliatePartner[] {
  const cards = AFFILIATE_PARTNERS.filter(p => p.type === 'credit_card');

  // Logic to show most relevant cards
  // International routes → travel cards
  // Domestic → cash back cards, etc.

  return cards.slice(0, 3); // Show top 3
}

/**
 * Revenue projections
 */
export const AFFILIATE_REVENUE_PROJECTIONS = {
  conservative: {
    creditCardSignups: 100, // per year
    revenue: 100 * 100, // $10,000/year
  },
  moderate: {
    creditCardSignups: 250,
    hotelBookings: 500,
    flightSearches: 10000,
    revenue: 250 * 100 + 500 * 50 * 0.04 + 10000 * 1, // $36,000/year
  },
  aggressive: {
    creditCardSignups: 500,
    hotelBookings: 2000,
    flightSearches: 50000,
    revenue: 500 * 100 + 2000 * 50 * 0.04 + 50000 * 1, // $104,000/year
  },
};

/**
 * Affiliate disclosure (legally required)
 */
export const AFFILIATE_DISCLOSURE = `
FlightOptima may earn a commission when you click on certain links and make purchases. This helps us keep the platform free and improve our services. Our recommendations are always based on value and user experience, not commission rates.
`;

/**
 * Where to show affiliate links
 */
export const AFFILIATE_PLACEMENTS = {
  flightResults: {
    show: true,
    type: 'credit_card',
    message: 'Earn 3x points on flights with...',
  },
  routePage: {
    show: true,
    type: 'hotel',
    message: 'Find hotels in [destination]',
  },
  sidebar: {
    show: true,
    type: 'all',
    message: 'Partner offers',
  },
  footer: {
    show: true,
    type: 'all',
    message: null,
  },
};
