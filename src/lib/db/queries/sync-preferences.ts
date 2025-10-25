import { getDb } from '@/lib/db';
import {
  calendarSyncPreferences,
  calendarSyncHistory,
  flights,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface SyncPreferencesInput {
  ownerId: string;
  provider: string;
  syncLightTherapy?: boolean;
  syncSleep?: boolean;
  syncMelatonin?: boolean;
  syncMeals?: boolean;
  syncExercise?: boolean;
  syncCaffeine?: boolean;
  syncStrategy?: 'all_at_once' | 'day_by_day' | 'manual';
  lightTherapyReminder?: string | null;
  sleepReminder?: string | null;
  melatoninReminder?: string | null;
  mealsReminder?: string | null;
  exerciseReminder?: string | null;
  caffeineReminder?: string | null;
  syncDaysStart?: number;
  syncDaysEnd?: number | null;
  addLocationToEvents?: boolean;
  colorCode?: string;
}

export type SyncPreferences = typeof calendarSyncPreferences.$inferSelect;
export type SyncHistory = typeof calendarSyncHistory.$inferSelect;

/**
 * Get or create default sync preferences for a user and provider
 */
export async function getSyncPreferences(
  ownerId: string,
  provider: string
): Promise<SyncPreferences> {
  const db = getDb();

  const [prefs] = await db
    .select()
    .from(calendarSyncPreferences)
    .where(
      and(
        eq(calendarSyncPreferences.ownerId, ownerId),
        eq(calendarSyncPreferences.provider, provider)
      )
    )
    .limit(1);

  // Create default if doesn't exist
  if (!prefs) {
    const [created] = await db
      .insert(calendarSyncPreferences)
      .values({
        ownerId,
        provider,
        // Defaults are set in schema
      })
      .returning();

    return created;
  }

  return prefs;
}

/**
 * Update sync preferences
 */
export async function updateSyncPreferences(
  input: SyncPreferencesInput
): Promise<SyncPreferences> {
  const db = getDb();
  const existing = await getSyncPreferences(input.ownerId, input.provider);

  const updateData: Partial<typeof calendarSyncPreferences.$inferInsert> = {};

  // Only update fields that are provided
  if (input.syncLightTherapy !== undefined)
    updateData.syncLightTherapy = input.syncLightTherapy;
  if (input.syncSleep !== undefined) updateData.syncSleep = input.syncSleep;
  if (input.syncMelatonin !== undefined)
    updateData.syncMelatonin = input.syncMelatonin;
  if (input.syncMeals !== undefined) updateData.syncMeals = input.syncMeals;
  if (input.syncExercise !== undefined)
    updateData.syncExercise = input.syncExercise;
  if (input.syncCaffeine !== undefined)
    updateData.syncCaffeine = input.syncCaffeine;
  if (input.syncStrategy !== undefined)
    updateData.syncStrategy = input.syncStrategy;
  if (input.lightTherapyReminder !== undefined)
    updateData.lightTherapyReminder = input.lightTherapyReminder;
  if (input.sleepReminder !== undefined)
    updateData.sleepReminder = input.sleepReminder;
  if (input.melatoninReminder !== undefined)
    updateData.melatoninReminder = input.melatoninReminder;
  if (input.mealsReminder !== undefined)
    updateData.mealsReminder = input.mealsReminder;
  if (input.exerciseReminder !== undefined)
    updateData.exerciseReminder = input.exerciseReminder;
  if (input.caffeineReminder !== undefined)
    updateData.caffeineReminder = input.caffeineReminder;
  if (input.syncDaysStart !== undefined)
    updateData.syncDaysStart = input.syncDaysStart;
  if (input.syncDaysEnd !== undefined)
    updateData.syncDaysEnd = input.syncDaysEnd;
  if (input.addLocationToEvents !== undefined)
    updateData.addLocationToEvents = input.addLocationToEvents;
  if (input.colorCode !== undefined) updateData.colorCode = input.colorCode;

  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(calendarSyncPreferences)
    .set(updateData)
    .where(eq(calendarSyncPreferences.id, existing.id))
    .returning();

  return updated;
}

/**
 * Get active event types from preferences
 */
export function getActiveEventTypes(prefs: SyncPreferences): string[] {
  const types: string[] = [];
  if (prefs.syncLightTherapy) types.push('light_therapy');
  if (prefs.syncSleep) types.push('sleep');
  if (prefs.syncMelatonin) types.push('melatonin');
  if (prefs.syncMeals) types.push('meals');
  if (prefs.syncExercise) types.push('exercise');
  if (prefs.syncCaffeine) types.push('caffeine');
  return types;
}

/**
 * Record sync history
 */
export async function recordSyncHistory(data: {
  ownerId: string;
  flightId: bigint;
  provider: string;
  syncStatus: 'success' | 'partial' | 'failed';
  eventsCreated: number;
  eventsFailed: number;
  daysRange?: { start: number; end: number };
  eventTypes: string[];
  errorMessage?: string;
  metadata?: any;
}): Promise<SyncHistory> {
  const db = getDb();

  const [history] = await db
    .insert(calendarSyncHistory)
    .values({
      ownerId: data.ownerId,
      flightId: data.flightId,
      provider: data.provider,
      syncStatus: data.syncStatus,
      eventsCreated: data.eventsCreated,
      eventsFailed: data.eventsFailed,
      daysRange: data.daysRange ? JSON.stringify(data.daysRange) : null,
      eventTypes: JSON.stringify(data.eventTypes),
      errorMessage: data.errorMessage,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    })
    .returning();

  return history;
}

/**
 * Get sync history for a flight
 */
export async function getFlightSyncHistory(
  flightId: bigint
): Promise<SyncHistory[]> {
  const db = getDb();

  return await db
    .select()
    .from(calendarSyncHistory)
    .where(eq(calendarSyncHistory.flightId, flightId))
    .orderBy(desc(calendarSyncHistory.syncedAt));
}

/**
 * Check if flight is already synced to prevent duplicates
 */
export async function isFlightSynced(
  flightId: bigint,
  provider: string
): Promise<boolean> {
  const db = getDb();

  const [sync] = await db
    .select()
    .from(calendarSyncHistory)
    .where(
      and(
        eq(calendarSyncHistory.flightId, flightId),
        eq(calendarSyncHistory.provider, provider),
        eq(calendarSyncHistory.syncStatus, 'success')
      )
    )
    .limit(1);

  return !!sync;
}

/**
 * Get all sync history for a user
 */
export async function getUserSyncHistory(
  ownerId: string
): Promise<
  Array<SyncHistory & { flight: typeof flights.$inferSelect | null }>
> {
  const db = getDb();

  const history = await db
    .select({
      id: calendarSyncHistory.id,
      ownerId: calendarSyncHistory.ownerId,
      flightId: calendarSyncHistory.flightId,
      provider: calendarSyncHistory.provider,
      syncStatus: calendarSyncHistory.syncStatus,
      eventsCreated: calendarSyncHistory.eventsCreated,
      eventsFailed: calendarSyncHistory.eventsFailed,
      daysRange: calendarSyncHistory.daysRange,
      eventTypes: calendarSyncHistory.eventTypes,
      errorMessage: calendarSyncHistory.errorMessage,
      metadata: calendarSyncHistory.metadata,
      syncedAt: calendarSyncHistory.syncedAt,
      flight: flights,
    })
    .from(calendarSyncHistory)
    .leftJoin(flights, eq(calendarSyncHistory.flightId, flights.id))
    .where(eq(calendarSyncHistory.ownerId, ownerId))
    .orderBy(desc(calendarSyncHistory.syncedAt));

  return history;
}

/**
 * Delete sync preferences
 */
export async function deleteSyncPreferences(
  ownerId: string,
  provider: string
): Promise<void> {
  const db = getDb();

  await db
    .delete(calendarSyncPreferences)
    .where(
      and(
        eq(calendarSyncPreferences.ownerId, ownerId),
        eq(calendarSyncPreferences.provider, provider)
      )
    );
}
