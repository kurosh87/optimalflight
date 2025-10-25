/**
 * Affiliate Click Tracking API
 * Records clicks before redirecting to affiliate
 *
 * POST /api/affiliate/track-click
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliateClicks } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/helpers';
import { analytics } from '@/lib/analytics/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      affiliate,
      flightId,
      origin,
      destination,
      price,
      currency,
      metadata,
    } = body;

    // Generate unique click ID
    const clickId = crypto.randomUUID();

    // Get user if authenticated
    const user = await getCurrentUser();
    const userId = user?.id || null;

    // Store click in database
    await db.insert(affiliateClicks).values({
      userId,
      affiliate,
      flightId,
      clickId,
      origin,
      destination,
      price,
      currency,
      clickedAt: new Date(),
      metadata: metadata || {},
    });

    // Track in analytics
    if (typeof analytics !== 'undefined') {
      await analytics.trackServerSideEvent(
        'affiliate_click',
        {
          affiliate,
          origin,
          destination,
          price,
          userId,
        },
        userId || undefined
      );
    }

    // Return click ID and set cookie
    const response = NextResponse.json({
      success: true,
      clickId,
    });

    // Set first-party cookie for 30-day attribution
    response.cookies.set('fo_click_id', clickId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Allow client-side access
      sameSite: 'lax',
      path: '/',
    });

    response.cookies.set('fo_affiliate', affiliate, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json(
      { error: 'Failed to track click', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve click data by click ID
 * Used for reconciliation with Travelpayouts reports
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clickId = searchParams.get('clickId');

    if (!clickId) {
      return NextResponse.json(
        { error: 'clickId required' },
        { status: 400 }
      );
    }

    const { eq } = await import('drizzle-orm');

    const clicks = await db
      .select()
      .from(affiliateClicks)
      .where(eq(affiliateClicks.clickId, clickId))
      .limit(1);

    const click = clicks[0];

    if (!click) {
      return NextResponse.json(
        { error: 'Click not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(click);
  } catch (error: any) {
    console.error('Error retrieving click:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve click', details: error.message },
      { status: 500 }
    );
  }
}
