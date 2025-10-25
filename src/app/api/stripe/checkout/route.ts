/**
 * Create Stripe Checkout Session
 * POST /api/stripe/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'priceId required' }, { status: 400 });
    }

    // Get user
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userResult.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult[0];

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    // Check if user had trial before
    const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    const hasUsedTrial = existing.some(s => s.trialStart !== null);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        trial_period_days: hasUsedTrial ? undefined : 14,
        metadata: { userId },
      },
      metadata: { userId },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed', details: error.message }, { status: 500 });
  }
}
