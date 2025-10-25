import { getDb } from '@/lib/db';
import { calendarConnections, jetlagEvents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Get a calendar connection for a user and provider
 */
export async function getCalendarConnection(ownerId: string, provider: string) {
  const db = getDb();
  const [connection] = await db
    .select()
    .from(calendarConnections)
    .where(
      and(
        eq(calendarConnections.ownerId, ownerId),
        eq(calendarConnections.provider, provider),
        eq(calendarConnections.isActive, true)
      )
    )
    .limit(1);

  return connection || null;
}

/**
 * Create or update a calendar connection
 */
export async function upsertCalendarConnection(data: {
  ownerId: string;
  provider: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  calendarId?: string;
}) {
  const db = getDb();

  // Encrypt tokens before storage
  const encryptedAccessToken = await encrypt(data.accessToken);
  const encryptedRefreshToken = data.refreshToken ? await encrypt(data.refreshToken) : null;

  // Check if connection exists
  const existing = await getCalendarConnection(data.ownerId, data.provider);

  if (existing) {
    // Update existing connection
    const [updated] = await db
      .update(calendarConnections)
      .set({
        email: data.email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: data.expiresAt,
        calendarId: data.calendarId,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, existing.id))
      .returning();

    return updated;
  } else {
    // Insert new connection
    const [created] = await db
      .insert(calendarConnections)
      .values({
        ownerId: data.ownerId,
        provider: data.provider,
        email: data.email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: data.expiresAt,
        calendarId: data.calendarId,
      })
      .returning();

    return created;
  }
}

/**
 * Get decrypted tokens for a calendar connection
 */
export async function getDecryptedTokens(connectionId: bigint) {
  const db = getDb();

  const [connection] = await db
    .select()
    .from(calendarConnections)
    .where(eq(calendarConnections.id, connectionId))
    .limit(1);

  if (!connection) return null;

  return {
    accessToken: await decrypt(connection.accessToken),
    refreshToken: connection.refreshToken ? await decrypt(connection.refreshToken) : null,
    expiresAt: connection.expiresAt,
  };
}

/**
 * Update access token after refresh
 */
export async function updateAccessToken(
  connectionId: bigint,
  newAccessToken: string,
  expiresAt: Date
) {
  const db = getDb();
  const encrypted = await encrypt(newAccessToken);

  const [updated] = await db
    .update(calendarConnections)
    .set({
      accessToken: encrypted,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(calendarConnections.id, connectionId))
    .returning();

  return updated;
}

/**
 * Create a jetlag event record
 */
export async function createJetlagEvent(data: {
  ownerId: string;
  flightId: bigint;
  calendarConnectionId: bigint;
  provider: string;
  externalEventId: string;
  eventType: string;
  startTime: Date;
  endTime: Date;
}) {
  const db = getDb();

  const [event] = await db
    .insert(jetlagEvents)
    .values(data)
    .returning();

  return event;
}

/**
 * Get all events for a flight
 */
export async function getJetlagEventsByFlight(flightId: bigint) {
  const db = getDb();

  return await db
    .select()
    .from(jetlagEvents)
    .where(eq(jetlagEvents.flightId, flightId));
}

/**
 * Delete a calendar connection
 */
export async function deleteCalendarConnection(ownerId: string, provider: string) {
  const db = getDb();

  await db
    .delete(calendarConnections)
    .where(
      and(
        eq(calendarConnections.ownerId, ownerId),
        eq(calendarConnections.provider, provider)
      )
    );
}

/**
 * Get all user's calendar connections
 */
export async function getUserCalendarConnections(ownerId: string) {
  const db = getDb();

  return await db
    .select()
    .from(calendarConnections)
    .where(
      and(
        eq(calendarConnections.ownerId, ownerId),
        eq(calendarConnections.isActive, true)
      )
    );
}

/**
 * Deactivate a calendar connection instead of deleting
 */
export async function deactivateCalendarConnection(connectionId: bigint) {
  const db = getDb();

  const [updated] = await db
    .update(calendarConnections)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(calendarConnections.id, connectionId))
    .returning();

  return updated;
}
