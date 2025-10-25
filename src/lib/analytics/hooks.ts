'use client';

/**
 * React Hooks for Analytics
 * Easy-to-use hooks for tracking events in components
 */

import { useCallback } from 'react';
import { analytics } from './events';
import type {
  SearchInitiatedEvent,
  ResultsDisplayedEvent,
  AffiliateClickEvent,
  FilterAppliedEvent,
  UpgradePromptShownEvent,
  PriceAlertCreatedEvent,
  JetlagScoreViewedEvent,
} from './events';

/**
 * Hook for tracking search events
 */
export function useSearchTracking() {
  const trackSearch = useCallback((data: SearchInitiatedEvent) => {
    analytics.trackSearchInitiated(data);
  }, []);

  const trackResults = useCallback((data: ResultsDisplayedEvent) => {
    analytics.trackResultsDisplayed(data);
  }, []);

  return { trackSearch, trackResults };
}

/**
 * Hook for tracking affiliate clicks
 */
export function useAffiliateTracking() {
  const trackClick = useCallback((data: AffiliateClickEvent) => {
    analytics.trackAffiliateClick(data);
  }, []);

  return { trackClick };
}

/**
 * Hook for tracking filter interactions
 */
export function useFilterTracking() {
  const trackFilter = useCallback((data: FilterAppliedEvent) => {
    analytics.trackFilterApplied(data);
  }, []);

  return { trackFilter };
}

/**
 * Hook for tracking upgrade prompts
 */
export function useUpgradeTracking() {
  const trackPromptShown = useCallback((data: UpgradePromptShownEvent) => {
    analytics.trackUpgradePromptShown(data);
  }, []);

  return { trackPromptShown };
}

/**
 * Hook for tracking price alerts
 */
export function usePriceAlertTracking() {
  const trackAlertCreated = useCallback((data: PriceAlertCreatedEvent) => {
    analytics.trackPriceAlertCreated(data);
  }, []);

  return { trackAlertCreated };
}

/**
 * Hook for tracking jetlag score views
 */
export function useJetlagTracking() {
  const trackScoreViewed = useCallback((data: JetlagScoreViewedEvent) => {
    analytics.trackJetlagScoreViewed(data);
  }, []);

  return { trackScoreViewed };
}

/**
 * General purpose analytics hook
 */
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackSearchInitiated: analytics.trackSearchInitiated.bind(analytics),
    trackResultsDisplayed: analytics.trackResultsDisplayed.bind(analytics),
    trackAffiliateClick: analytics.trackAffiliateClick.bind(analytics),
    trackFilterApplied: analytics.trackFilterApplied.bind(analytics),
    trackUpgradePromptShown: analytics.trackUpgradePromptShown.bind(analytics),
    trackSubscriptionStarted: analytics.trackSubscriptionStarted.bind(analytics),
    trackPriceAlertCreated: analytics.trackPriceAlertCreated.bind(analytics),
    trackJetlagScoreViewed: analytics.trackJetlagScoreViewed.bind(analytics),
    identifyUser: analytics.identifyUser.bind(analytics),
    resetUser: analytics.resetUser.bind(analytics),
  };
}
