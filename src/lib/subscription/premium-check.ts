import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type SubscriptionTier = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due';

export interface SubscriptionFeatures {
  calendarIntegration: boolean;
  maxFlights: number;
  maxCalendarConnections: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  teamFeatures: boolean;
  autoSync: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  multipleReminders: boolean;
  tripTemplates: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    calendarIntegration: false,
    maxFlights: 3,
    maxCalendarConnections: 0,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    teamFeatures: false,
    autoSync: false,
    apiAccess: false,
    whiteLabel: false,
    multipleReminders: false,
    tripTemplates: false,
  },
  pro: {
    calendarIntegration: true,
    maxFlights: 50,
    maxCalendarConnections: 3,
    advancedAnalytics: true,
    prioritySupport: false,
    customBranding: false,
    teamFeatures: false,
    autoSync: false,
    apiAccess: false,
    whiteLabel: false,
    multipleReminders: true,
    tripTemplates: true,
  },
  business: {
    calendarIntegration: true,
    maxFlights: -1, // unlimited
    maxCalendarConnections: -1, // unlimited
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    teamFeatures: true,
    autoSync: true,
    apiAccess: true,
    whiteLabel: true,
    multipleReminders: true,
    tripTemplates: true,
  },
};

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  features: SubscriptionFeatures;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Check user's subscription status and features
 */
export async function checkUserSubscription(
  ownerId: string
): Promise<UserSubscription | null> {
  const db = getDb();

  const [subscription] = await db
    .select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.ownerId, ownerId))
    .limit(1);

  // No subscription record = free tier
  if (!subscription) {
    return {
      tier: 'free',
      status: 'free',
      isActive: false,
      features: TIER_FEATURES.free,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  // Determine tier based on status
  let tier: SubscriptionTier = 'free';
  let isActive = false;

  if (subscription.status === 'active') {
    // Check if subscription period is still valid
    const periodValid =
      !subscription.currentPeriodEnd ||
      subscription.currentPeriodEnd > new Date();

    if (periodValid) {
      tier = 'pro'; // Default to pro for active subscriptions
      isActive = true;
    }
  }

  return {
    tier,
    status: subscription.status as SubscriptionStatus,
    isActive,
    features: TIER_FEATURES[tier],
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
  };
}

/**
 * Require a specific premium feature, return error if not allowed
 */
export async function requirePremiumFeature(
  ownerId: string,
  feature: keyof SubscriptionFeatures
): Promise<{ allowed: boolean; error?: string; tier?: SubscriptionTier }> {
  const subscription = await checkUserSubscription(ownerId);

  if (!subscription) {
    return { allowed: false, error: 'User subscription not found' };
  }

  if (!subscription.isActive && subscription.tier !== 'free') {
    return {
      allowed: false,
      error: 'Subscription expired or inactive',
      tier: subscription.tier,
    };
  }

  if (!subscription.features[feature]) {
    return {
      allowed: false,
      error: `This feature requires a ${
        subscription.tier === 'free' ? 'Pro' : 'Business'
      } subscription`,
      tier: subscription.tier,
    };
  }

  return { allowed: true, tier: subscription.tier };
}

/**
 * Check if user has any active pro or business subscription
 */
export async function isPremiumUser(ownerId: string): Promise<boolean> {
  const subscription = await checkUserSubscription(ownerId);
  return subscription?.isActive || false;
}

/**
 * Check if user has pro tier or higher
 */
export async function isProUser(ownerId: string): Promise<boolean> {
  const subscription = await checkUserSubscription(ownerId);
  return subscription?.isActive && (subscription.tier === 'pro' || subscription.tier === 'business') || false;
}

/**
 * Check if user has business tier
 */
export async function isBusinessUser(ownerId: string): Promise<boolean> {
  const subscription = await checkUserSubscription(ownerId);
  return subscription?.isActive && subscription.tier === 'business' || false;
}

/**
 * Get user's current tier
 */
export async function getUserTier(ownerId: string): Promise<SubscriptionTier> {
  const subscription = await checkUserSubscription(ownerId);
  return subscription?.tier || 'free';
}
