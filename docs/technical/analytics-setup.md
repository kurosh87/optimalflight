# Analytics Setup - FlightOptima

Complete analytics infrastructure with PostHog, Google Analytics 4, and Vercel Analytics.

---

## Overview

FlightOptima uses a multi-layered analytics approach:

1. **PostHog** - Product analytics, session recording, feature flags
2. **Google Analytics 4** - Marketing analytics, conversion tracking
3. **Vercel Analytics** - Web Vitals, performance monitoring

All integrated with type-safe event tracking.

---

## 1. PostHog Setup

### Installation

Already installed: `posthog-js`, `posthog-node`

### Configuration

**Environment Variables:**
```env
NEXT_PUBLIC_POSTHOG_KEY="phc_your_key_here"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

**Get Your Key:**
1. Sign up at https://posthog.com
2. Create project "FlightOptima"
3. Copy API key (starts with `phc_`)

### Reverse Proxy (Ad-Blocker Bypass)

**Endpoint:** `/ingest/*`
**File:** `src/app/ingest/[...path]/route.ts`

This proxies PostHog requests through your domain to avoid ad blockers.

**How it works:**
- Client sends to: `https://yoursite.com/ingest/...`
- Server proxies to: `https://us.i.posthog.com/...`
- Ad blockers don't block first-party requests!

### Features Enabled

**Session Recording:**
- Records user sessions for debugging
- Masks passwords, keeps emails visible
- Useful for understanding user behavior

**Feature Flags:**
- A/B test different CTAs
- Gradually roll out features
- Target specific user segments

---

## 2. Google Analytics 4 Setup

### Installation

Already installed: `@next/third-parties`

### Configuration

**Environment Variable:**
```env
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

**Get Your ID:**
1. Go to https://analytics.google.com
2. Create GA4 property for "FlightOptima"
3. Copy Measurement ID (starts with `G-`)

### Attribution Model

**Configured:** Last-click attribution
**Why:** Simple, clear conversion tracking
**Alternative:** Data-driven (requires 400+ conversions/month)

---

## 3. Vercel Analytics

### Installation

Already installed: `@vercel/analytics`, `@vercel/speed-insights`

### Configuration

**No configuration needed!**
- Automatically enabled on Vercel deployment
- Tracks Web Vitals
- Monitors Core Web Vitals: LCP, FID, CLS

**Dashboard:** https://vercel.com/your-project/analytics

---

## 4. Event Tracking

### Available Events

**Search Flow:**
```typescript
import { analytics } from '@/lib/analytics/events';

analytics.trackSearchInitiated({
  origin: 'SFO',
  destination: 'JFK',
  departureDate: '2025-12-01',
  passengers: 1,
  cabinClass: 'economy'
});

analytics.trackResultsDisplayed({
  resultCount: 24,
  searchDurationMs: 1250,
  origin: 'SFO',
  destination: 'JFK',
  hasFilters: false
});
```

**Affiliate Clicks:**
```typescript
analytics.trackAffiliateClick({
  affiliate: 'kiwi',
  flightId: 'flight_123',
  price: 350,
  currency: 'USD',
  origin: 'SFO',
  destination: 'JFK',
  airline: 'United'
});
```

**Filter Interactions:**
```typescript
analytics.trackFilterApplied({
  filterType: 'alliance',
  filterValue: 'Star Alliance',
  resultCountBefore: 50,
  resultCountAfter: 20
});
```

**Upgrade Prompts:**
```typescript
analytics.trackUpgradePromptShown({
  trigger: 'feature_gate',
  location: 'filter_panel',
  tier: 'free'
});
```

**Subscriptions:**
```typescript
analytics.trackSubscriptionStarted({
  tier: 'pro',
  price: 99,
  interval: 'annual',
  trial: true
});
```

### React Hooks

```typescript
import { useSearchTracking } from '@/lib/analytics/hooks';

function SearchPage() {
  const { trackSearch, trackResults } = useSearchTracking();

  const handleSearch = async () => {
    trackSearch({
      origin,
      destination,
      departureDate,
      passengers,
    });

    const results = await fetchFlights();

    trackResults({
      resultCount: results.length,
      searchDurationMs: performance.now() - startTime,
      origin,
      destination,
      hasFilters: false,
    });
  };

  return (
    // Component JSX
  );
}
```

---

## 5. Conversion Funnel

**Tracked automatically:**

```
1. search_initiated
   ↓
2. results_displayed
   ↓
3. affiliate_click (CONVERSION!)
   ↓
4. (external booking confirmation)
```

**In PostHog:**
- Go to Insights → Funnels
- Set up funnel with these events
- Track conversion rate at each step

**In GA4:**
- Go to Explore → Funnel Exploration
- Add events in order
- View drop-off rates

---

## 6. A/B Testing with PostHog

### Example: Test Upgrade CTA Copy

```typescript
import { useFeatureFlag } from 'posthog-js/react';

function UpgradeButton() {
  const variant = useFeatureFlag('upgrade-cta-test');

  return (
    <Button>
      {variant === 'variant-a' ? 'Start Free Trial' : 'Unlock Premium'}
    </Button>
  );
}
```

**In PostHog:**
1. Go to Feature Flags
2. Create flag: `upgrade-cta-test`
3. Set rollout: 50% variant-a, 50% variant-b
4. Track `subscription_started` as goal
5. PostHog auto-calculates statistical significance

---

## 7. Dashboard & Monitoring

### Key Metrics to Watch

**Product Metrics (PostHog):**
- Daily/Weekly Active Users
- Search conversion rate (search → affiliate click)
- Free-to-paid conversion rate
- Feature adoption (alliance filter usage, jetlag score views)
- Session duration
- Bounce rate

**Marketing Metrics (GA4):**
- Traffic sources (organic, paid, referral)
- Landing page performance
- Campaign ROI
- Geographic distribution

**Performance Metrics (Vercel):**
- LCP (Largest Contentful Paint) - Target: <2.5s
- FID (First Input Delay) - Target: <100ms
- CLS (Cumulative Layout Shift) - Target: <0.1

---

## 8. Privacy & GDPR

### Cookie Consent

```typescript
// TODO: Implement cookie consent banner
// Only initialize analytics after user consent

if (hasUserConsent()) {
  initPostHog();
}
```

**Required for EU users!**

### Data Retention

**PostHog:** 90 days for session recordings
**GA4:** 14 months default (configurable)

---

## 9. Implementation Files

**Core:**
- `src/lib/analytics/posthog.ts` - PostHog initialization
- `src/lib/analytics/events.ts` - Event tracking service
- `src/lib/analytics/hooks.ts` - React hooks

**Components:**
- `src/components/analytics/PostHogProvider.tsx` - Provider component

**API:**
- `src/app/ingest/[...path]/route.ts` - Reverse proxy

**Layout:**
- `src/app/layout.tsx` - Analytics integration

---

## 10. Usage Examples

### Track Search in Component

```typescript
'use client';

import { useSearchTracking } from '@/lib/analytics/hooks';

export default function SearchForm() {
  const { trackSearch } = useSearchTracking();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track the search
    trackSearch({
      origin: formData.origin,
      destination: formData.destination,
      departureDate: formData.departure,
      passengers: formData.passengers,
    });

    // Perform search...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Track Affiliate Click

```typescript
import { useAffiliateTracking } from '@/lib/analytics/hooks';

function FlightResult({ flight }) {
  const { trackClick } = useAffiliateTracking();

  const handleBookClick = () => {
    trackClick({
      affiliate: 'kiwi',
      flightId: flight.id,
      price: flight.price,
      currency: 'USD',
      origin: flight.origin,
      destination: flight.destination,
    });

    // Redirect to booking...
  };

  return (
    <button onClick={handleBookClick}>
      Book on Kiwi.com
    </button>
  );
}
```

### Server-Side Tracking

```typescript
import { analytics } from '@/lib/analytics/events';

export async function POST(request: Request) {
  // Track server-side event
  await analytics.trackServerSideEvent(
    'subscription_created',
    {
      tier: 'pro',
      price: 99,
      userId: user.id,
    },
    user.id
  );

  return NextResponse.json({ success: true });
}
```

---

## 11. Monitoring Setup

### PostHog Dashboards

**Create these dashboards:**

1. **User Acquisition**
   - New signups per day
   - Traffic sources
   - Landing page performance

2. **Product Engagement**
   - Searches per user
   - Feature adoption rates
   - Session duration

3. **Conversion Funnel**
   - Search → Results → Click → Subscribe
   - Drop-off rates at each step

4. **Revenue**
   - Free-to-paid conversion
   - Upgrade paths
   - Churn rate

### Alerts

**Set up PostHog alerts for:**
- Conversion rate drop > 20%
- Error rate spike > 5%
- New user signups < 10/day

---

## 12. Testing Analytics

### Local Testing

```bash
# Start dev server
npm run dev

# Open browser console
# Perform actions (search, filter, etc.)
# Check PostHog debugger shows events
```

### Production Testing

```bash
# Visit your live site
# Perform test actions
# Check PostHog dashboard for events (5-10 min delay)
# Check GA4 real-time reports (instant)
```

---

## Environment Variables Summary

```env
# PostHog
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# Google Analytics 4
NEXT_PUBLIC_GA_ID="G-..."

# Vercel Analytics (automatic)
```

---

## Status

✅ PostHog installed and configured
✅ Reverse proxy for ad-blocker bypass
✅ GA4 integration ready
✅ Vercel Analytics enabled
✅ Unified analytics service
✅ Type-safe event tracking
✅ React hooks for easy usage

**Just needs:** PostHog & GA4 API keys in .env

---

**Documentation:** This file
**Implementation:** src/lib/analytics/, src/components/analytics/
**Ready to track:** All key user actions and conversions!
