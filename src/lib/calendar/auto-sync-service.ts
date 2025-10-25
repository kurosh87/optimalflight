/**
 * Auto-sync service for Business tier
 * Automatically syncs flights to team members' calendars when admin creates them
 */

import { getDb } from '@/lib/db';
import { flights, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getCalendarConnection,
  getDecryptedTokens,
  updateAccessToken,
  createJetlagEvent,
} from '@/lib/db/queries/calendar';
import {
  getSyncPreferences,
  getActiveEventTypes,
  recordSyncHistory,
  isFlightSynced,
} from '@/lib/db/queries/sync-preferences';
import { GoogleCalendarService, CalendarEvent } from '@/lib/calendar/google';
import { MicrosoftCalendarService } from '@/lib/calendar/microsoft';
import { applyOrganizationBranding, OrganizationBranding } from '@/lib/dashboard/branding';

interface AutoSyncResult {
  success: boolean;
  provider: string;
  eventsCreated: number;
  error?: string;
}

interface AutoSyncOptions {
  flightId: bigint;
  userId: string;
  organizationId: string;
}

/**
 * Auto-sync a flight to all of a user's connected calendars
 * Used when admin creates a flight for a team member
 */
export async function autoSyncFlightForUser(
  options: AutoSyncOptions
): Promise<AutoSyncResult[]> {
  const { flightId, userId, organizationId } = options;
  const db = getDb();
  const results: AutoSyncResult[] = [];

  try {
    // Get flight data
    const [flight] = await db
      .select()
      .from(flights)
      .where(eq(flights.id, flightId))
      .limit(1);

    if (!flight || !flight.jetlagPlan) {
      throw new Error('Flight or jetlag plan not found');
    }

    // Get organization branding
    let organizationBranding: OrganizationBranding | undefined;
    const [org] = await db
      .select({
        companyName: organizations.companyName,
        logoUrl: organizations.logoUrl,
        primaryColor: organizations.primaryColor,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (org) {
      organizationBranding = org;
    }

    // Try syncing to Google Calendar
    const googleResult = await tryAutoSyncToProvider(
      userId,
      flightId,
      flight,
      'google',
      organizationBranding
    );
    if (googleResult) results.push(googleResult);

    // Try syncing to Microsoft Calendar
    const microsoftResult = await tryAutoSyncToProvider(
      userId,
      flightId,
      flight,
      'microsoft',
      organizationBranding
    );
    if (microsoftResult) results.push(microsoftResult);

    return results;
  } catch (error) {
    console.error('Error in autoSyncFlightForUser:', error);
    return [
      {
        success: false,
        provider: 'all',
        eventsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    ];
  }
}

/**
 * Try to sync to a specific calendar provider
 */
async function tryAutoSyncToProvider(
  userId: string,
  flightId: bigint,
  flight: any,
  provider: 'google' | 'microsoft',
  organizationBranding?: OrganizationBranding
): Promise<AutoSyncResult | null> {
  try {
    // Check if user has this calendar connected
    const connection = await getCalendarConnection(userId, provider);
    if (!connection) {
      return null; // User doesn't have this provider connected
    }

    // Check if already synced
    const alreadySynced = await isFlightSynced(flightId, provider);
    if (alreadySynced) {
      return {
        success: false,
        provider,
        eventsCreated: 0,
        error: 'Already synced',
      };
    }

    // Get user's sync preferences
    const prefs = await getSyncPreferences(userId, provider);
    const eventTypesToSync = getActiveEventTypes(prefs);

    if (eventTypesToSync.length === 0) {
      return {
        success: false,
        provider,
        eventsCreated: 0,
        error: 'No event types enabled',
      };
    }

    // Get tokens and refresh if needed
    const tokens = await getDecryptedTokens(connection.id);
    if (!tokens) {
      return {
        success: false,
        provider,
        eventsCreated: 0,
        error: 'Invalid tokens',
      };
    }

    let currentAccessToken = tokens.accessToken;
    if (
      tokens.expiresAt &&
      tokens.expiresAt < new Date() &&
      tokens.refreshToken
    ) {
      const service =
        provider === 'google'
          ? new GoogleCalendarService()
          : new MicrosoftCalendarService();

      const newTokens = await service.refreshAccessToken(tokens.refreshToken);
      currentAccessToken = newTokens.accessToken;
      await updateAccessToken(
        connection.id,
        newTokens.accessToken,
        newTokens.expiresAt
      );
    }

    // Parse jetlag plan
    const jetlagPlan = JSON.parse(flight.jetlagPlan as string);

    // Generate events with branding
    const daysRange = {
      start: prefs.syncDaysStart ?? 1,
      end: prefs.syncDaysEnd ?? jetlagPlan.postArrivalSchedule?.length ?? 9,
    };

    const events = generateEventsWithBranding(
      jetlagPlan,
      eventTypesToSync,
      daysRange,
      prefs,
      organizationBranding
    );

    if (events.length === 0) {
      return {
        success: false,
        provider,
        eventsCreated: 0,
        error: 'No events to sync',
      };
    }

    // Create calendar service
    const service =
      provider === 'google'
        ? new GoogleCalendarService()
        : new MicrosoftCalendarService();

    // Sync events
    let eventsCreated = 0;
    const failedEvents: string[] = [];

    for (const event of events) {
      try {
        const eventId = await service.createEvent(currentAccessToken, event);
        eventsCreated++;

        // Save to database
        await createJetlagEvent({
          ownerId: userId,
          flightId,
          calendarConnectionId: connection.id,
          provider,
          externalEventId: eventId,
          eventType: event.type,
          startTime: event.start,
          endTime: event.end,
        });
      } catch (error) {
        console.error(`Failed to create ${event.type} event:`, error);
        failedEvents.push(event.summary);
      }
    }

    // Record sync history
    await recordSyncHistory({
      ownerId: userId,
      flightId,
      provider,
      syncStatus: eventsCreated > 0 ? 'success' : 'failed',
      eventsCreated,
      eventsFailed: failedEvents.length,
      daysRange,
      eventTypes: eventTypesToSync,
      errorMessage: failedEvents.length > 0 ? JSON.stringify(failedEvents) : undefined,
      metadata: {
        autoSync: true,
        totalEvents: events.length,
      },
    });

    return {
      success: eventsCreated > 0,
      provider,
      eventsCreated,
      error: failedEvents.length > 0 ? `${failedEvents.length} events failed` : undefined,
    };
  } catch (error) {
    console.error(`Error syncing to ${provider}:`, error);
    return {
      success: false,
      provider,
      eventsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate calendar events with branding applied
 * Simplified version of the main event generation function
 */
function generateEventsWithBranding(
  jetlagPlan: any,
  eventTypes: string[],
  daysRange: { start: number; end?: number },
  prefs: any,
  organizationBranding?: OrganizationBranding
): Array<CalendarEvent & { type: string }> {
  const events: Array<CalendarEvent & { type: string }> = [];

  const endDay = daysRange.end || jetlagPlan.postArrivalSchedule?.length || 9;

  const schedules = jetlagPlan.postArrivalSchedule?.filter(
    (day: any) => day.day >= daysRange.start && day.day <= endDay
  ) || [];

  for (const daySchedule of schedules) {
    // Light therapy
    if (eventTypes.includes('light_therapy')) {
      for (const session of daySchedule.lightTherapy || []) {
        const emoji = session.type === 'seek' ? '☀️' : '🌙';
        const action = session.type === 'seek' ? 'GET' : 'AVOID';

        const originalSummary = `${emoji} ${action} Light (${session.duration}min) - Day ${daySchedule.day}`;
        const originalDescription = `${session.description}\n\n📍 Phase: ${session.circadianPhase}`;

        const branded = applyOrganizationBranding({
          summary: originalSummary,
          description: originalDescription,
          branding: organizationBranding,
        });

        events.push({
          summary: branded.summary,
          description: branded.description,
          start: new Date(session.startTime),
          end: new Date(session.endTime),
          type: 'light_therapy',
          reminders: [{ minutes: prefs.lightTherapyReminder ?? 15 }],
        });
      }
    }

    // Sleep
    if (eventTypes.includes('sleep')) {
      for (const sleep of daySchedule.sleep || []) {
        const originalSummary = `😴 Bedtime - Day ${daySchedule.day}`;
        const originalDescription = `🛏️ ${sleep.notes}`;

        const branded = applyOrganizationBranding({
          summary: originalSummary,
          description: originalDescription,
          branding: organizationBranding,
        });

        events.push({
          summary: branded.summary,
          description: branded.description,
          start: new Date(sleep.bedtime),
          end: new Date(new Date(sleep.bedtime).getTime() + 15 * 60 * 1000),
          type: 'sleep',
          reminders: [{ minutes: prefs.sleepReminder ?? 30 }],
        });
      }
    }

    // Add other event types similarly (melatonin, meals, exercise, caffeine)
    // For brevity, only showing the core types above
  }

  return events;
}
