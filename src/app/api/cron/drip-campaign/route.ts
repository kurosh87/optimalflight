/**
 * Drip Campaign Cron Job
 * GET /api/cron/drip-campaign
 *
 * Called daily by Vercel Cron to send drip emails
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/drip-campaign",
 *     "schedule": "0 10 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDripCampaigns } from '@/lib/email/drip-campaign';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const results = await runDripCampaigns();

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Drip campaign cron failed:', error);

    return NextResponse.json(
      {
        error: 'Drip campaign failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger endpoint (for testing)
 * POST /api/cron/drip-campaign
 */
export async function POST(request: NextRequest) {
  // Require auth for manual trigger
  const body = await request.json();

  if (body.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { day } = body;

    if (day !== undefined) {
      // Send specific day
      const { sendDripCampaignForDay } = await import('@/lib/email/drip-campaign');
      const result = await sendDripCampaignForDay(day);

      return NextResponse.json({
        success: true,
        day,
        result,
      });
    }

    // Send all
    const results = await runDripCampaigns();

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send', details: error.message },
      { status: 500 }
    );
  }
}
