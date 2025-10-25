import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

export interface PushNotification {
  title: string;
  body: string;
  data?: any;
  sound?: 'default' | null;
  badge?: number;
}

/**
 * Send push notifications to multiple devices
 */
export async function sendPushNotification(
  tokens: string[],
  notification: PushNotification
) {
  // Create messages array
  const messages: ExpoPushMessage[] = [];

  for (const token of tokens) {
    // Check that token is valid Expo push token
    if (!Expo.isExpoPushToken(token)) {
      console.error(`Token ${token} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: token,
      sound: notification.sound ?? 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge,
    });
  }

  if (messages.length === 0) {
    throw new Error('No valid Expo push tokens provided');
  }

  // Send notifications in chunks (Expo recommends max 100 per chunk)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  return tickets;
}

/**
 * Send a push notification to a single device
 */
export async function sendSinglePushNotification(
  token: string,
  notification: PushNotification
) {
  return sendPushNotification([token], notification);
}

/**
 * Validate an Expo push token
 */
export function isValidExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}
