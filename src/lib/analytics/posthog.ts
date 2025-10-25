/**
 * PostHog Analytics Configuration
 * With reverse proxy to avoid ad blockers
 */

import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest', // Reverse proxy endpoint
      ui_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      },
      capture_pageview: false, // We'll manually capture pageviews
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
          email: false,
        },
      },
    });
  }

  return posthog;
}

// Export singleton instance
export const ph = typeof window !== 'undefined' ? posthog : null;
