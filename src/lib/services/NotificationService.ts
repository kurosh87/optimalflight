/**
 * NotificationService - Core service for creating and managing notifications
 */

import { getDb } from '@/lib/db';
import { notifications, notificationPreferences, subscriptions } from '@/lib/db/schema';
import { eq, and, desc, lte, isNull, sql } from 'drizzle-orm';
import { sendFlightDelayEmail, sendGateChangeEmail, sendLightTherapyEmail, sendJetlagReminderEmail } from '@/lib/email';

export type NotificationType =
  | 'flight_delay'
  | 'gate_change'
  | 'flight_cancellation'
  | 'pre_flight'
  | 'light_therapy'
  | 'sleep_reminder'
  | 'jetlag_recovery';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type DeliveryChannel = 'in_app' | 'email';

export interface CreateNotificationInput {
  userId: string;
  flightId?: bigint | null;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  channels?: DeliveryChannel[];
  metadata?: Record<string, any>;
  scheduledFor?: Date;
}

export interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  limit?: number;
}

export class NotificationService {
  private db = getDb();

  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput) {
    const {
      userId,
      flightId,
      type,
      title,
      message,
      priority = 'normal',
      channels = ['in_app'],
      metadata,
      scheduledFor,
    } = input;

    // Check user preferences
    const prefs = await this.getUserPreferences(userId);
    const allowedChannels = this.filterChannelsByPreferences(channels, prefs, type);

    if (allowedChannels.length === 0) {
      console.log(`User ${userId} has disabled all notification channels for type ${type}`);
      return null;
    }

    // Check quiet hours if scheduling for now
    if (!scheduledFor && (await this.isInQuietHours(userId))) {
      console.log(`User ${userId} is in quiet hours, skipping notification`);
      return null;
    }

    const [notification] = await this.db
      .insert(notifications)
      .values({
        ownerId: userId,
        flightId: flightId || null,
        type,
        title,
        message,
        priority,
        status: 'unread',
        deliveryChannels: JSON.stringify(allowedChannels),
        metadata: metadata ? JSON.stringify(metadata) : null,
        scheduledFor: scheduledFor || null,
        sentAt: scheduledFor ? null : new Date(),
      })
      .returning();

    // Send immediately if not scheduled
    if (!scheduledFor) {
      await this.deliverNotification(notification, allowedChannels);
    }

    return this.serializeNotification(notification);
  }

  /**
   * Send a notification immediately
   */
  async sendNow(notificationId: bigint) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.sentAt) {
      console.log(`Notification ${notificationId} already sent`);
      return;
    }

    const channels = JSON.parse(notification.deliveryChannels) as DeliveryChannel[];
    await this.deliverNotification(notification, channels);

    // Update sentAt timestamp
    await this.db
      .update(notifications)
      .set({ sentAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  /**
   * Process scheduled notifications that are due
   */
  async processScheduledNotifications() {
    const dueNotifications = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          lte(notifications.scheduledFor, new Date()),
          isNull(notifications.sentAt)
        )
      )
      .limit(100);

    console.log(`Processing ${dueNotifications.length} scheduled notifications`);

    for (const notification of dueNotifications) {
      try {
        await this.sendNow(notification.id);
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
      }
    }

    return dueNotifications.length;
  }

  /**
   * Deliver notification via specified channels
   */
  private async deliverNotification(notification: any, channels: DeliveryChannel[]) {
    const promises = channels.map((channel) => {
      if (channel === 'in_app') {
        return this.sendInApp(notification);
      } else if (channel === 'email') {
        return this.sendEmail(notification);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Send in-app notification (already stored in DB, just log)
   */
  private async sendInApp(notification: any) {
    console.log(`In-app notification sent: ${notification.title}`);
    // In-app notifications are stored in DB and will be fetched by frontend
    return true;
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: any) {
    try {
      // Get user email from Neon Auth users_sync table
      const userResult = await this.db.execute(
        sql`SELECT email FROM neon_auth.users_sync WHERE id = ${notification.ownerId} LIMIT 1`
      );

      if (!userResult.rows[0]?.email) {
        console.error(`No email found for user ${notification.ownerId}`);
        return false;
      }

      const userEmail = userResult.rows[0].email as string;
      const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

      // Send appropriate email based on notification type
      switch (notification.type) {
        case 'flight_delay':
          await sendFlightDelayEmail(userEmail, {
            title: notification.title,
            message: notification.message,
            ...metadata,
          });
          break;
        case 'gate_change':
          await sendGateChangeEmail(userEmail, {
            title: notification.title,
            message: notification.message,
            ...metadata,
          });
          break;
        case 'light_therapy':
          await sendLightTherapyEmail(userEmail, {
            title: notification.title,
            message: notification.message,
            ...metadata,
          });
          break;
        case 'jetlag_recovery':
        case 'sleep_reminder':
          await sendJetlagReminderEmail(userEmail, {
            title: notification.title,
            message: notification.message,
            ...metadata,
          });
          break;
        default:
          console.warn(`No email template for notification type: ${notification.type}`);
      }

      console.log(`Email notification sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: bigint, userId: string) {
    await this.db
      .update(notifications)
      .set({ status: 'read', readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.ownerId, userId)));
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ status: 'read', readAt: new Date() })
      .where(and(eq(notifications.ownerId, userId), eq(notifications.status, 'unread')));
  }

  /**
   * Get user notifications with optional filters
   */
  async getUserNotifications(userId: string, filter?: NotificationFilter) {
    const conditions = [eq(notifications.ownerId, userId)];

    if (filter?.status) {
      conditions.push(eq(notifications.status, filter.status));
    }

    if (filter?.type) {
      conditions.push(eq(notifications.type, filter.type));
    }

    const limit = filter?.limit || 50;
    const results = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.insertedAt))
      .limit(limit);

    return results.map(this.serializeNotification);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const results = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.ownerId, userId), eq(notifications.status, 'unread')));

    return results.length;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: bigint, userId: string) {
    await this.db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.ownerId, userId)));
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string) {
    const [prefs] = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.ownerId, userId))
      .limit(1);

    // Return default preferences if none exist
    if (!prefs) {
      return {
        emailEnabled: true,
        inAppEnabled: true,
        flightUpdates: true,
        jetlagReminders: true,
        lightTherapyAlerts: true,
        sleepReminders: true,
        realTimeFlightMonitoring: false,
        gateChangeAlerts: false,
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      };
    }

    return prefs;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<typeof notificationPreferences.$inferInsert>) {
    const existing = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.ownerId, userId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await this.db
        .update(notificationPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(notificationPreferences.ownerId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(notificationPreferences)
        .values({ ownerId: userId, ...preferences })
        .returning();
      return created;
    }
  }

  /**
   * Check if user is in quiet hours
   */
  private async isInQuietHours(userId: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);

    if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Simple time comparison (HH:MM format)
    return currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd;
  }

  /**
   * Filter channels based on user preferences
   */
  private filterChannelsByPreferences(
    channels: DeliveryChannel[],
    prefs: any,
    type: NotificationType
  ): DeliveryChannel[] {
    const filtered: DeliveryChannel[] = [];

    // Check if notification type is enabled
    const typeEnabled = this.isNotificationTypeEnabled(type, prefs);
    if (!typeEnabled) {
      return [];
    }

    for (const channel of channels) {
      if (channel === 'email' && prefs.emailEnabled) {
        filtered.push(channel);
      }
      if (channel === 'in_app' && prefs.inAppEnabled) {
        filtered.push(channel);
      }
    }

    return filtered;
  }

  /**
   * Check if notification type is enabled in preferences
   */
  private isNotificationTypeEnabled(type: NotificationType, prefs: any): boolean {
    switch (type) {
      case 'flight_delay':
      case 'gate_change':
      case 'flight_cancellation':
      case 'pre_flight':
        return prefs.flightUpdates;
      case 'light_therapy':
        return prefs.lightTherapyAlerts;
      case 'sleep_reminder':
        return prefs.sleepReminders;
      case 'jetlag_recovery':
        return prefs.jetlagReminders;
      default:
        return true;
    }
  }

  /**
   * Check if user is premium
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.ownerId, userId))
      .limit(1);

    return subscription?.status === 'active';
  }

  /**
   * Serialize notification for JSON response
   */
  private serializeNotification(notification: any) {
    return {
      ...notification,
      id: notification.id.toString(),
      flightId: notification.flightId ? notification.flightId.toString() : null,
      deliveryChannels: JSON.parse(notification.deliveryChannels),
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
