/**
 * Email Drip Campaign Manager
 * Sends triggered emails based on user signup date and trial status
 */

import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import {
  sendWelcomeEmail,
  sendDay2Email,
  sendDay13Email,
} from './resend-service';

export interface DripCampaignSchedule {
  day: number;
  emailType: 'welcome' | 'feature_highlight' | 'social_proof' | 'trial_reminder';
  subject: string;
  sendFunction: (email: string, userName?: string, ...args: any[]) => Promise<any>;
}

/**
 * Drip campaign schedule
 */
export const DRIP_SCHEDULE: DripCampaignSchedule[] = [
  {
    day: 0,
    emailType: 'welcome',
    subject: 'Welcome to FlightOptima',
    sendFunction: sendWelcomeEmail,
  },
  {
    day: 2,
    emailType: 'feature_highlight',
    subject: 'Routes Nobody Else Offers',
    sendFunction: sendDay2Email,
  },
  // Day 5: Social proof case study (TODO: create template)
  // Day 7: Limited-time offer (TODO: create template)
  // Day 10: Premium features showcase (TODO: create template)
  {
    day: 13,
    emailType: 'trial_reminder',
    subject: 'Trial ends tomorrow',
    sendFunction: sendDay13Email,
  },
];

/**
 * Get users who should receive drip email today
 */
export async function getUsersForDripEmail(dayNumber: number) {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() - dayNumber);

  // Get users who signed up exactly N days ago
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const eligibleUsers = await db
    .select({
      user: users,
      subscription: subscriptions,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(
      and(
        gte(users.createdAt!, startOfDay),
        lte(users.createdAt!, endOfDay)
      )
    );

  return eligibleUsers;
}

/**
 * Send drip campaign emails for a specific day
 */
export async function sendDripCampaignForDay(dayNumber: number) {
  console.log(`📧 Sending Day ${dayNumber} drip campaign emails...`);

  const users = await getUsersForDripEmail(dayNumber);

  console.log(`   Found ${users.length} users eligible for Day ${dayNumber} email`);

  let sent = 0;
  let failed = 0;

  for (const { user, subscription } of users) {
    try {
      // Find email template for this day
      const campaign = DRIP_SCHEDULE.find(c => c.day === dayNumber);

      if (!campaign) {
        console.log(`   No email template for Day ${dayNumber}`);
        continue;
      }

      // Skip if user already paid (don't send trial reminders)
      if (dayNumber === 13 && subscription?.status === 'active') {
        console.log(`   Skipping ${user.email} - already subscribed`);
        continue;
      }

      // Send email
      let result;

      if (dayNumber === 13 && subscription?.trialEnd) {
        // Trial ending email needs special params
        const trialEndsDate = new Date(subscription.trialEnd).toLocaleDateString();
        result = await sendDay13Email(user.email, user.name || undefined, trialEndsDate);
      } else {
        // Standard drip emails
        result = await campaign.sendFunction(user.email, user.name || undefined);
      }

      if (result.success) {
        sent++;
        console.log(`   ✓ Sent to ${user.email}`);
      } else {
        failed++;
        console.log(`   ✗ Failed: ${user.email} - ${result.error}`);
      }

      // Rate limit: 1 email per second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failed++;
      console.error(`   ✗ Error sending to ${user.email}:`, error);
    }
  }

  console.log(`\n✅ Day ${dayNumber} campaign complete: ${sent} sent, ${failed} failed`);

  return { sent, failed };
}

/**
 * Run all drip campaigns (daily cron job)
 */
export async function runDripCampaigns() {
  console.log('🚀 Starting daily drip campaign run...\n');

  const results: Record<number, { sent: number; failed: number }> = {};

  for (const campaign of DRIP_SCHEDULE) {
    results[campaign.day] = await sendDripCampaignForDay(campaign.day);
  }

  console.log('\n✅ All drip campaigns complete!');
  console.log('Summary:');

  Object.entries(results).forEach(([day, stats]) => {
    console.log(`  Day ${day}: ${stats.sent} sent, ${stats.failed} failed`);
  });

  return results;
}

/**
 * Trigger immediate welcome email on signup
 */
export async function triggerWelcomeEmail(userId: string) {
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!userResult.length) {
    console.error('User not found:', userId);
    return { success: false, error: 'User not found' };
  }

  const user = userResult[0];

  return sendWelcomeEmail(user.email, user.name || undefined);
}
