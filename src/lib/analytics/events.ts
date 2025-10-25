/**
 * Unified Analytics Event Tracking
 * Type-safe events for PostHog and Google Analytics 4
 */

import { ph } from './posthog';

// Event type definitions for type safety
export interface SearchInitiatedEvent {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: string;
}

export interface ResultsDisplayedEvent {
  resultCount: number;
  searchDurationMs: number;
  origin: string;
  destination: string;
  hasFilters: boolean;
}

export interface AffiliateClickEvent {
  affiliate: 'kiwi' | 'booking' | 'google_flights' | 'skyscanner';
  flightId: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  airline?: string;
}

export interface FilterAppliedEvent {
  filterType: 'alliance' | 'stops' | 'price' | 'airline' | 'aircraft' | 'jetlag';
  filterValue: string | number;
  resultCountBefore: number;
  resultCountAfter: number;
}

export interface UpgradePromptShownEvent {
  trigger: 'search_limit' | 'feature_gate' | 'aha_moment' | 'value_demonstration';
  location: 'search_results' | 'filter_panel' | 'modal' | 'pricing_page';
  tier: 'free' | 'pro' | 'expert';
}

export interface SubscriptionEvent {
  tier: 'pro' | 'expert' | 'enterprise';
  price: number;
  interval: 'monthly' | 'annual';
  trial: boolean;
}

export interface PriceAlertCreatedEvent {
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice: number;
}

export interface JetlagScoreViewedEvent {
  score: number;
  route: string;
  viewedDetails: boolean;
}

/**
 * Unified Analytics Service
 * Sends events to both PostHog and GA4
 */
class AnalyticsService {
  /**
   * Track search initiated
   */
  trackSearchInitiated(data: SearchInitiatedEvent) {
    // PostHog
    ph?.capture('search_initiated', data);

    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: `${data.origin}-${data.destination}`,
        ...data,
      });
    }
  }

  /**
   * Track results displayed
   */
  trackResultsDisplayed(data: ResultsDisplayedEvent) {
    ph?.capture('results_displayed', data);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_search_results', {
        value: data.resultCount,
        ...data,
      });
    }
  }

  /**
   * Track affiliate click (conversion event!)
   */
  trackAffiliateClick(data: AffiliateClickEvent) {
    ph?.capture('affiliate_click', data);

    // GA4 conversion event
    if (typeof window !== 'undefined' && window.gtag) {
      const { price, currency, ...otherData } = data;
      window.gtag('event', 'click_affiliate_link', {
        value: price,
        currency: currency,
        flight_route: `${data.origin}-${data.destination}`,
        ...otherData,
      });
    }
  }

  /**
   * Track filter applied
   */
  trackFilterApplied(data: FilterAppliedEvent) {
    ph?.capture('filter_applied', data);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'filter_applied', data);
    }
  }

  /**
   * Track upgrade prompt shown
   */
  trackUpgradePromptShown(data: UpgradePromptShownEvent) {
    ph?.capture('upgrade_prompt_shown', data);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'upgrade_prompt', data);
    }
  }

  /**
   * Track subscription started (conversion!)
   */
  trackSubscriptionStarted(data: SubscriptionEvent) {
    ph?.capture('subscription_started', data);

    // GA4 purchase event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: `sub_${Date.now()}`,
        value: data.price,
        currency: 'USD',
        items: [
          {
            item_id: data.tier,
            item_name: `FlightOptima ${data.tier}`,
            price: data.price,
            quantity: 1,
          },
        ],
      });
    }
  }

  /**
   * Track price alert created
   */
  trackPriceAlertCreated(data: PriceAlertCreatedEvent) {
    ph?.capture('price_alert_created', data);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'create_price_alert', data);
    }
  }

  /**
   * Track jetlag score viewed
   */
  trackJetlagScoreViewed(data: JetlagScoreViewedEvent) {
    ph?.capture('jetlag_score_viewed', data);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_jetlag_score', data);
    }
  }

  /**
   * Track pageview
   */
  trackPageView(url: string, title?: string) {
    ph?.capture('$pageview', { url, title });

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: title,
      });
    }
  }

  /**
   * Identify user (when authenticated)
   */
  identifyUser(userId: string, properties?: Record<string, any>) {
    ph?.identify(userId, properties);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', 'user_id', userId);
    }
  }

  /**
   * Reset user (on sign out)
   */
  resetUser() {
    ph?.reset();
  }

  /**
   * Server-side event tracking
   */
  async trackServerSideEvent(
    event: string,
    properties: Record<string, any>,
    userId?: string
  ) {
    // Use PostHog Node SDK for server-side tracking
    const { PostHog } = await import('posthog-node');

    const posthogNode = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: 'https://us.i.posthog.com',
    });

    posthogNode.capture({
      distinctId: userId || 'anonymous',
      event,
      properties,
    });

    await posthogNode.shutdown();
  }
}

// Export singleton
export const analytics = new AnalyticsService();
