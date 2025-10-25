// TODO: Replace Clerk auth with NextAuth or custom auth solution
// import { auth } from '@clerk/nextjs/server';

// Clerk plan IDs from dashboard - B2C (User Plans)
// NOTE: These are deprecated - replace with new billing system
export const CLERK_PLANS = {
  PRO: 'cplan_33tFGnZdTo6mIjYzcUrnIBesAx2', // Pro plan
  BUSINESS: 'cplan_33tL9OSApIXc3', // Business plan
} as const;

// Clerk plan IDs for Organizations (B2B)
// NOTE: These are deprecated - replace with new billing system
export const CLERK_ORG_PLANS = {
  TEAM: 'cplan_ORG_TEAM_REPLACE_ME',
  ENTERPRISE: 'cplan_ORG_ENTERPRISE_REPLACE_ME',
} as const;

/**
 * Check if user has access to a specific feature
 * TODO: Replace Clerk implementation with proper billing/subscription system
 */
export async function hasFeature(featureName: string): Promise<boolean> {
  // TODO: Implement proper feature check from database or billing system
  console.warn('hasFeature is using placeholder - implement proper billing');
  return false; // PLACEHOLDER

  // const { has } = await auth();
  // return has({ feature: featureName }) || false;
}

/**
 * Check if user has a specific plan
 * TODO: Replace Clerk implementation with proper billing/subscription system
 */
export async function hasPlan(planId: string): Promise<boolean> {
  // TODO: Implement proper plan check from database or billing system
  console.warn('hasPlan is using placeholder - implement proper billing');
  return false; // PLACEHOLDER

  // const { has } = await auth();
  // return has({ plan: planId }) || false;
}

/**
 * Get user's current subscription tier
 * TODO: Replace Clerk implementation with proper billing/subscription system
 */
export async function getSubscriptionTier(): Promise<'free' | 'pro' | 'business'> {
  // TODO: Implement proper tier check from database or billing system
  console.warn('getSubscriptionTier is using placeholder - implement proper billing');
  return 'free'; // PLACEHOLDER

  // if (await hasPlan(CLERK_PLANS.BUSINESS)) return 'business';
  // if (await hasPlan(CLERK_PLANS.PRO)) return 'pro';
  // return 'free';
}

/**
 * Check if user can access Pro features
 * TODO: Replace with proper billing system
 */
export async function canAccessProFeatures(): Promise<boolean> {
  console.warn('canAccessProFeatures is using placeholder - implement proper billing');
  return false; // PLACEHOLDER
  // return (await hasPlan(CLERK_PLANS.PRO)) || (await hasPlan(CLERK_PLANS.BUSINESS));
}

/**
 * Check if user can access Business features
 * TODO: Replace with proper billing system
 */
export async function canAccessBusinessFeatures(): Promise<boolean> {
  console.warn('canAccessBusinessFeatures is using placeholder - implement proper billing');
  return false; // PLACEHOLDER
  // return await hasPlan(CLERK_PLANS.BUSINESS);
}

// ===== Feature-specific helpers =====

/**
 * Check if user can sync calendars
 */
export async function canSyncCalendars(): Promise<boolean> {
  return await hasFeature('calendar_sync');
}

/**
 * Check if user can create unlimited flights
 */
export async function hasUnlimitedFlights(): Promise<boolean> {
  return await hasFeature('unlimited_flights');
}

/**
 * Check if user has access to advanced recovery plans
 */
export async function hasAdvancedRecoveryPlans(): Promise<boolean> {
  return await hasFeature('advanced_recovery_plans');
}

/**
 * Check if user has access to flight monitoring
 */
export async function hasFlightMonitoring(): Promise<boolean> {
  return await hasFeature('flight_monitoring');
}

/**
 * Check if user has access to team collaboration
 */
export async function hasTeamCollaboration(): Promise<boolean> {
  return await hasFeature('team_collaboration');
}

/**
 * Check if user has priority support
 */
export async function hasPrioritySupport(): Promise<boolean> {
  return await hasFeature('priority_support');
}

/**
 * Check if user has API access
 */
export async function hasApiAccess(): Promise<boolean> {
  return await hasFeature('api_access');
}

// ===== Limit helpers =====

/**
 * Get flight limit for user's plan
 */
export async function getFlightLimit(): Promise<number> {
  if (await hasUnlimitedFlights()) return Infinity;
  if (await canAccessProFeatures()) return 50;
  return 3; // free tier
}

/**
 * Get calendar connection limit for user's plan
 */
export async function getCalendarLimit(): Promise<number> {
  if (await canAccessBusinessFeatures()) return Infinity;
  if (await canAccessProFeatures()) return 3;
  return 0; // free tier
}

/**
 * Get API rate limit for user's plan
 */
export async function getApiRateLimit(): Promise<number> {
  if (await canAccessBusinessFeatures()) return 10000; // 10k requests/hour
  if (await hasApiAccess()) return 1000; // 1k requests/hour
  return 0; // no API access
}

/**
 * Get flight monitoring polling interval based on tier
 * Returns interval in minutes
 */
export async function getMonitoringInterval(): Promise<number> {
  if (await canAccessBusinessFeatures()) return 2; // 2 minutes for Business
  if (await canAccessProFeatures()) return 15; // 15 minutes for Pro
  return 0; // No monitoring for free tier
}

/**
 * Check if user has real-time flight tracking (Pro+)
 */
export async function hasRealtimeFlightTracking(): Promise<boolean> {
  return await canAccessProFeatures();
}

/**
 * Check if user has predictive delay alerts (Business only)
 */
export async function hasPredictiveDelayAlerts(): Promise<boolean> {
  return await canAccessBusinessFeatures();
}

/**
 * Check if user has live flight map (Business only)
 */
export async function hasLiveFlightMap(): Promise<boolean> {
  return await canAccessBusinessFeatures();
}

/**
 * Check if user has historical delay data (Business only)
 */
export async function hasHistoricalDelayData(): Promise<boolean> {
  return await canAccessBusinessFeatures();
}
