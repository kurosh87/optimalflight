'use client';

/**
 * PostHog Provider Component
 * Initializes PostHog and provides analytics context
 */

import { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog } from '@/lib/analytics/posthog';
import posthog from 'posthog-js';

function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    // Track pageviews
    if (pathname) {
      posthog.capture('$pageview', {
        $current_url: window.origin + pathname,
      });
    }
  }, [pathname]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
