/**
 * FlightOptima Pricing Tiers
 * 4-tier model: Free, Pro, Expert, Enterprise
 *
 * Transparent billing (unlike FlightConnections)
 * Monthly AND annual options
 * No dark patterns, no surprise renewals
 */

export type SubscriptionTier = 'free' | 'pro' | 'expert' | 'enterprise';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  savings: number; // percentage saved with annual
  features: string[];
  limits: {
    searchesPerDay: number;
    alertsPerMonth: number;
    apiCallsPerMonth: number;
    savedRoutes: number;
  };
  highlighted?: boolean; // Show as "Most Popular"
}

export const PRICING_TIERS: Record<SubscriptionTier, PricingTier> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for occasional travelers',
    monthlyPrice: 0,
    annualPrice: 0,
    savings: 0,
    features: [
      'Basic route visualization',
      'Single airline filtering',
      'Direct flights only',
      '10 searches per day',
      'Mobile app access',
      'Basic airport search',
      'Community support',
    ],
    limits: {
      searchesPerDay: 10,
      alertsPerMonth: 0,
      apiCallsPerMonth: 0,
      savedRoutes: 3,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For award travel enthusiasts',
    monthlyPrice: 9.99,
    annualPrice: 99, // $99/year = $8.25/month (17% discount)
    savings: 17,
    features: [
      '✨ Everything in Free, plus:',
      'Unlimited searches',
      'Ad-free experience',
      '🌟 Alliance filtering (Star Alliance, OneWorld, SkyTeam)',
      'Class of service filtering',
      'Aircraft filtering',
      '12-month forward schedules',
      'Basic award availability indicators',
      '10 email alerts per month',
      'Unlimited saved routes',
      'Priority email support (24-hour response)',
      'Connection search (1-stop, 2-stop)',
      'Jetlag optimization scores',
    ],
    limits: {
      searchesPerDay: -1, // Unlimited
      alertsPerMonth: 10,
      apiCallsPerMonth: 0,
      savedRoutes: -1, // Unlimited
    },
    highlighted: true, // Most popular
  },

  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'For serious travel hackers',
    monthlyPrice: 14.99,
    annualPrice: 149, // $149/year = $12.42/month (17% discount)
    savings: 17,
    features: [
      '✨ Everything in Pro, plus:',
      '🎯 Real-time award availability (Seats.aero integration)',
      'Unlimited email/SMS alerts',
      'Advanced filtering (exclude specific carriers within alliances)',
      'Multi-city route optimization',
      'Historical award availability trends',
      'Price prediction and trend charts',
      '100 API calls per month',
      'Priority 24-hour support',
      'Early access to new features',
      'Export search results (CSV, PDF)',
      'Advanced jetlag optimization (personalized)',
    ],
    limits: {
      searchesPerDay: -1,
      alertsPerMonth: -1, // Unlimited
      apiCallsPerMonth: 100,
      savedRoutes: -1,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For travel agencies and businesses',
    monthlyPrice: 499,
    annualPrice: 4990, // $4,990/year (17% discount)
    savings: 17,
    features: [
      '✨ Everything in Expert, plus:',
      'Unlimited API access (custom rate limits)',
      'White-label options',
      'Multi-user team accounts',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees (99.9% uptime)',
      'Priority feature development',
      'Data export capabilities',
      'Custom reporting and analytics',
      'Webhook integrations',
      'SSO integration',
    ],
    limits: {
      searchesPerDay: -1,
      alertsPerMonth: -1,
      apiCallsPerMonth: -1, // Unlimited
      savedRoutes: -1,
    },
  },
};

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy: SubscriptionTier[] = ['free', 'pro', 'expert', 'enterprise'];
  const userLevel = tierHierarchy.indexOf(userTier);
  const requiredLevel = tierHierarchy.indexOf(requiredTier);

  return userLevel >= requiredLevel;
}

/**
 * Get tier by Stripe price ID
 * Used in webhook handlers
 */
export function getTierByStripePriceId(priceId: string): SubscriptionTier | null {
  // Map Stripe price IDs to tiers
  // These will be set in Stripe dashboard
  const priceIdMap: Record<string, SubscriptionTier> = {
    'price_pro_monthly': 'pro',
    'price_pro_annual': 'pro',
    'price_expert_monthly': 'expert',
    'price_expert_annual': 'expert',
    'price_enterprise': 'enterprise',
  };

  return priceIdMap[priceId] || null;
}

/**
 * Calculate savings with annual plan
 */
export function calculateAnnualSavings(tier: PricingTier): number {
  const monthlyTotal = tier.monthlyPrice * 12;
  const savings = monthlyTotal - tier.annualPrice;
  return savings;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Check if user is within daily search limit
 */
export async function canUserSearch(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  const limits = PRICING_TIERS[tier].limits;

  // Unlimited for paid tiers
  if (limits.searchesPerDay === -1) return true;

  // TODO: Query searchHistory for today's count
  // For now, return true
  return true;
}

/**
 * Check if user can create alert
 */
export async function canUserCreateAlert(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  const limits = PRICING_TIERS[tier].limits;

  // No alerts for free tier
  if (limits.alertsPerMonth === 0) return false;

  // Unlimited for expert/enterprise
  if (limits.alertsPerMonth === -1) return true;

  // TODO: Query priceAlerts for current month count
  // For now, return true
  return true;
}
