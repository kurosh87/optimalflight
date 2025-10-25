/**
 * Seed Subscription Tiers
 * Run: npx tsx scripts/seed-subscription-tiers.ts
 */

import { db } from '../src/lib/db';
import { subscriptionTiers } from '../src/lib/db/schema';

const tiers = [
  {
    name: 'free',
    price: 0,
    interval: 'month',
    features: ['basic_search', '10_searches_per_day', '3_saved_routes'],
    limits: {
      searchesPerDay: 10,
      alertsPerMonth: 0,
      savedRoutes: 3,
      apiCallsPerMonth: 0,
    },
  },
  {
    name: 'pro',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
    stripeProductId: 'prod_pro',
    price: 99,
    interval: 'year',
    features: [
      'unlimited_search',
      'alliance_filter',
      'jetlag_optimization',
      '10_price_alerts',
      'ad_free',
      'unlimited_saved_routes',
    ],
    limits: {
      searchesPerDay: -1, // Unlimited
      alertsPerMonth: 10,
      savedRoutes: -1,
      apiCallsPerMonth: 0,
    },
  },
  {
    name: 'expert',
    stripePriceId: 'price_expert_annual',
    stripeProductId: 'prod_expert',
    price: 149,
    interval: 'year',
    features: [
      'all_pro_features',
      'unlimited_alerts',
      'api_access',
      'priority_support',
      'historical_data',
      'multi_city_optimization',
    ],
    limits: {
      searchesPerDay: -1,
      alertsPerMonth: -1,
      savedRoutes: -1,
      apiCallsPerMonth: 100,
    },
  },
  {
    name: 'enterprise',
    stripePriceId: 'price_enterprise',
    stripeProductId: 'prod_enterprise',
    price: 499,
    interval: 'month',
    features: [
      'all_expert_features',
      'unlimited_api',
      'white_label',
      'custom_integrations',
      'dedicated_support',
      'sla_guarantee',
    ],
    limits: {
      searchesPerDay: -1,
      alertsPerMonth: -1,
      savedRoutes: -1,
      apiCallsPerMonth: -1, // Unlimited
    },
  },
];

async function seedTiers() {
  console.log('🌱 Seeding subscription tiers...\n');

  for (const tier of tiers) {
    try {
      await db.insert(subscriptionTiers).values(tier).onConflictDoNothing();
      console.log(`✅ Seeded tier: ${tier.name} ($${tier.price}/${tier.interval})`);
    } catch (error) {
      console.error(`❌ Failed to seed tier: ${tier.name}`, error);
    }
  }

  console.log('\n✨ Subscription tiers seeded!');
  console.log('\nTiers created:');
  tiers.forEach(t => {
    console.log(`  - ${t.name}: $${t.price}/${t.interval}`);
    console.log(`    Features: ${t.features.join(', ')}`);
  });

  process.exit(0);
}

seedTiers().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
