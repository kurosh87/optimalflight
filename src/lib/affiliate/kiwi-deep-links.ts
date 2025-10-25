/**
 * Kiwi.com Affiliate Deep Link Generator
 * With Travelpayouts tracking integration
 */

export interface KiwiDeepLinkParams {
  from: string; // IATA code
  to: string; // IATA code
  departure: string; // YYYY-MM-DD
  return?: string; // YYYY-MM-DD (optional for one-way)
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface TravelpayoutsParams {
  affiliateId: string; // Your Travelpayouts marker
  subId?: string; // Campaign/sub-affiliate tracking
  promoId?: string; // Usually 3791 for Kiwi
}

/**
 * Generate Kiwi.com deep link
 * Format: https://www.kiwi.com/deep?from=FCO&to=BOS&departure=2019-12-05&return=2019-12-13
 */
export function generateKiwiDeepLink(params: KiwiDeepLinkParams): string {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
    departure: params.departure,
  });

  if (params.return) {
    searchParams.set('return', params.return);
  }

  if (params.adults && params.adults > 1) {
    searchParams.set('adults', params.adults.toString());
  }

  if (params.children) {
    searchParams.set('children', params.children.toString());
  }

  if (params.infants) {
    searchParams.set('infants', params.infants.toString());
  }

  if (params.cabinClass && params.cabinClass !== 'economy') {
    searchParams.set('cabin_class', params.cabinClass);
  }

  return `https://www.kiwi.com/deep?${searchParams.toString()}`;
}

/**
 * Wrap Kiwi deep link with Travelpayouts tracking
 * Format: https://c111.travelpayouts.com/click?shmarker=AFFILIATE_ID.SUB_ID&promo_id=3791&source_type=customlink&type=click&custom_url=[encoded]
 */
export function wrapWithTravelpayouts(
  deepLink: string,
  travelpayouts: TravelpayoutsParams
): string {
  const marker = travelpayouts.subId
    ? `${travelpayouts.affiliateId}.${travelpayouts.subId}`
    : travelpayouts.affiliateId;

  const params = new URLSearchParams({
    shmarker: marker,
    promo_id: travelpayouts.promoId || '3791',
    source_type: 'customlink',
    type: 'click',
    custom_url: deepLink,
  });

  return `https://c111.travelpayouts.com/click?${params.toString()}`;
}

/**
 * Generate complete affiliate link with tracking
 */
export function generateAffiliateLink(
  flightParams: KiwiDeepLinkParams,
  clickId: string,
  affiliateId: string = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_ID || 'flightoptima'
): string {
  const deepLink = generateKiwiDeepLink(flightParams);

  const affiliateLink = wrapWithTravelpayouts(deepLink, {
    affiliateId,
    subId: clickId, // Use click_id as sub_id for attribution
    promoId: '3791',
  });

  return affiliateLink;
}

/**
 * Generate multi-city affiliate link
 * Kiwi supports multi-city with different parameter format
 */
export function generateMultiCityAffiliateLink(
  segments: Array<{ from: string; to: string; departure: string }>,
  clickId: string
): string {
  // Multi-city format: https://www.kiwi.com/deep?from0=FCO&to0=BOS&departure0=2019-12-05&from1=BOS&to1=NYC&departure1=2019-12-10
  const searchParams = new URLSearchParams();

  segments.forEach((segment, index) => {
    searchParams.set(`from${index}`, segment.from);
    searchParams.set(`to${index}`, segment.to);
    searchParams.set(`departure${index}`, segment.departure);
  });

  const deepLink = `https://www.kiwi.com/deep?${searchParams.toString()}`;

  return wrapWithTravelpayouts(deepLink, {
    affiliateId: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_ID || 'flightoptima',
    subId: clickId,
    promoId: '3791',
  });
}

/**
 * Parse Kiwi flight details for tracking
 */
export interface FlightDetails {
  airline: string;
  flightNumber?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  stops: number;
}

/**
 * Calculate expected commission (3% of booking value)
 */
export function calculateExpectedCommission(bookingValue: number): number {
  const KIWI_COMMISSION_RATE = 0.03; // 3%
  return Math.round(bookingValue * KIWI_COMMISSION_RATE * 100) / 100;
}
