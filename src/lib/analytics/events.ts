/**
 * Analytics Event Tracking
 *
 * Centralized event tracking for user interactions
 * Currently logs to console; can be extended with PostHog, Mixpanel, GA4, etc.
 */

export interface BookingLinkClickEvent {
  event: 'booking_link_clicked';
  flightId: string;
  origin: string;
  destination: string;
  price?: number;
  currency?: string;
  jetlagScore?: number;
  stops?: number;
  departureTime?: string;
  bookingProvider: 'kiwi' | 'other';
}

export interface FlightSearchEvent {
  event: 'flight_search';
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

export interface RouteViewEvent {
  event: 'route_viewed';
  flightId: string;
  position: number; // Position in results list
  jetlagScore?: number;
}

export type AnalyticsEvent =
  | BookingLinkClickEvent
  | FlightSearchEvent
  | RouteViewEvent;

/**
 * Track an analytics event
 *
 * @example
 * trackEvent({
 *   event: 'booking_link_clicked',
 *   flightId: 'abc123',
 *   origin: 'JFK',
 *   destination: 'LAX',
 *   price: 450,
 *   currency: 'USD',
 *   bookingProvider: 'kiwi'
 * });
 */
export function trackEvent(event: AnalyticsEvent): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event.event, event);
  }

  // Send to analytics platform
  try {
    // Option 1: PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event.event, event);
    }

    // Option 2: Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, event);
    }

    // Option 3: Custom backend
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
          userAgent: navigator.userAgent,
        }),
      }).catch(err => console.error('[Analytics] Failed to send event:', err));
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Get or create a session ID for tracking user sessions
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const key = 'analytics_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Track booking link click
 * Convenience function for the most important conversion event
 */
export function trackBookingClick(params: Omit<BookingLinkClickEvent, 'event' | 'bookingProvider'>) {
  trackEvent({
    event: 'booking_link_clicked',
    bookingProvider: 'kiwi',
    ...params,
  });
}

/**
 * Track flight search
 */
export function trackFlightSearch(params: Omit<FlightSearchEvent, 'event'>) {
  trackEvent({
    event: 'flight_search',
    ...params,
  });
}

/**
 * Track route view (impression tracking)
 */
export function trackRouteView(params: Omit<RouteViewEvent, 'event'>) {
  trackEvent({
    event: 'route_viewed',
    ...params,
  });
}
