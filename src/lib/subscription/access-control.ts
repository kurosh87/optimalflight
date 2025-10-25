/**
 * Subscription Access Control & Feature Gates
 * Check user access to premium features
 */

import { db } from '@/lib/db';
import { subscriptions, subscriptionTiers, usageRecords } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export type Feature =
  | 'unlimited_search'
  | 'alliance_filter'
  | 'aircraft_filter'
  | 'jetlag_optimization'
  | 'price_alerts'
  | 'unlimited_alerts'
  | 'api_access'
  | 'priority_support'
  | 'historical_data'
  | 'multi_city_optimization';

/**
 * Get user's current subscription with tier details
 */
export async function getUserSubscription(userId: string) {
  const result = await db
    .select({
      subscription: subscriptions,
      tier: subscriptionTiers,
    })
    .from(subscriptions)
    .innerJoin(subscriptionTiers, eq(subscriptions.tierId, subscriptionTiers.id))
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!result.length) {
    // Return free tier as default
    const freeTier = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.name, 'free'))
      .limit(1);

    return {
      subscription: null,
      tier: freeTier[0],
    };
  }

  return result[0];
}

/**
 * Check if user can access a feature
 */
export async function canAccessFeature(
  userId: string,
  feature: Feature
): Promise<boolean> {
  const { tier } = await getUserSubscription(userId);

  if (!tier.features) return false;

  // @ts-ignore - features is typed as string[] but we know the values
  return tier.features.includes(feature);
}

/**
 * Check if user is within usage limits
 */
export async function checkUsageLimit(
  userId: string,
  resourceType: 'search' | 'alert' | 'api_call'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const { tier, subscription } = await getUserSubscription(userId);

  // Get limit for resource type
  const limits = tier.limits as any;
  let limit: number;

  switch (resourceType) {
    case 'search':
      limit = limits.searchesPerDay || 0;
      break;
    case 'alert':
      limit = limits.alertsPerMonth || 0;
      break;
    case 'api_call':
      limit = limits.apiCallsPerMonth || 0;
      break;
    default:
      return { allowed: false, remaining: 0, limit: 0 };
  }

  // Unlimited access
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // No access
  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  // Check current usage
  const periodStart = resourceType === 'search'
    ? new Date(new Date().setHours(0, 0, 0, 0)) // Today for daily limits
    : subscription?.currentPeriodStart || new Date(); // Billing period for monthly

  const periodEnd = resourceType === 'search'
    ? new Date(new Date().setHours(23, 59, 59, 999))
    : subscription?.currentPeriodEnd || new Date();

  const usage = await db
    .select({
      total: sql<number>`CAST(SUM(quantity) AS INTEGER)`,
    })
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        eq(usageRecords.resourceType, resourceType),
        gte(usageRecords.timestamp, periodStart),
        lte(usageRecords.timestamp, periodEnd)
      )
    );

  const currentUsage = usage[0]?.total || 0;
  const remaining = Math.max(0, limit - currentUsage);

  return {
    allowed: currentUsage < limit,
    remaining,
    limit,
  };
}

/**
 * Track usage of a resource
 */
export async function trackUsage(
  userId: string,
  resourceType: 'search' | 'alert' | 'api_call',
  quantity: number = 1,
  metadata?: Record<string, any>
) {
  const { subscription } = await getUserSubscription(userId);

  await db.insert(usageRecords).values({
    userId,
    resourceType,
    quantity,
    timestamp: new Date(),
    metadata: metadata || null,
    periodStart: subscription?.currentPeriodStart || null,
    periodEnd: subscription?.currentPeriodEnd || null,
  });
}

/**
 * Get remaining usage for display
 */
export async function getRemainingUsage(
  userId: string,
  resourceType: 'search' | 'alert' | 'api_call'
): Promise<{ used: number; remaining: number; limit: number }> {
  const { allowed, remaining, limit } = await checkUsageLimit(userId, resourceType);

  const used = limit === -1 ? 0 : limit - remaining;

  return {
    used,
    remaining,
    limit,
  };
}

/**
 * Check if subscription is active (not expired, canceled, or past_due)
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const { subscription } = await getUserSubscription(userId);

  if (!subscription) return false;

  const activeStatuses = ['active', 'trialing'];
  return activeStatuses.includes(subscription.status);
}

/**
 * Check if user is in trial period
 */
export async function isInTrial(userId: string): Promise<boolean> {
  const { subscription } = await getUserSubscription(userId);

  if (!subscription) return false;

  return subscription.status === 'trialing' &&
    subscription.trialEnd !== null &&
    new Date(subscription.trialEnd) > new Date();
}

/**
 * Get days remaining in trial
 */
export async function getTrialDaysRemaining(userId: string): Promise<number | null> {
  const { subscription } = await getUserSubscription(userId);

  if (!subscription || !subscription.trialEnd) return null;

  const now = new Date();
  const trialEnd = new Date(subscription.trialEnd);

  if (trialEnd < now) return 0;

  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
