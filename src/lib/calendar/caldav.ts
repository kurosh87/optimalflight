import { createDAVClient, DAVCalendar } from 'tsdav';
import { CalendarEvent, TokenResponse, CalendarServiceInterface } from './types';

export interface CalDAVConfig {
  serverUrl: string;
  username: string;
  password: string;
  calendarUrl?: string;
}

/**
 * CalDAV service for Apple Calendar, Fastmail, and other CalDAV-compatible calendars
 * Note: CalDAV uses Basic Auth (username/password) not OAuth
 */
export class CalDAVService implements CalendarServiceInterface {
  private serverUrl: string;
  private username: string;
  private password: string;
  private calendarUrl?: string;

  constructor(config: CalDAVConfig) {
    this.serverUrl = config.serverUrl;
    this.username = config.username;
    this.password = config.password;
    this.calendarUrl = config.calendarUrl;
  }

  /**
   * CalDAV doesn't use OAuth - return empty string
   * Users need to provide credentials directly
   */
  getAuthorizationUrl(): string {
    return '';
  }

  /**
   * CalDAV doesn't use OAuth tokens
   * Store credentials as "token" for consistency
   */
  async getTokensFromCode(code: string): Promise<TokenResponse> {
    // For CalDAV, "code" would be the serialized credentials
    const credentials = JSON.parse(code);

    return {
      accessToken: JSON.stringify(credentials),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  /**
   * CalDAV credentials don't expire - return same credentials
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: refreshToken,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Create a calendar event using CalDAV
   */
  async createEvent(accessToken: string, event: CalendarEvent): Promise<string> {
    const credentials = JSON.parse(accessToken);

    const client = await createDAVClient({
      serverUrl: credentials.serverUrl,
      credentials: {
        username: credentials.username,
        password: credentials.password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    // Get calendars
    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) {
      throw new Error('No calendars found');
    }

    // Use specified calendar or first available
    const calendar = credentials.calendarUrl
      ? calendars.find((cal) => cal.url === credentials.calendarUrl)
      : calendars[0];

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    // Generate iCalendar format event
    const icsEvent = this.generateICS(event);
    const eventId = this.generateUID();

    await client.createCalendarObject({
      calendar: calendar as DAVCalendar,
      filename: `${eventId}.ics`,
      iCalString: icsEvent,
    });

    return eventId;
  }

  /**
   * Delete a calendar event using CalDAV
   */
  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    const credentials = JSON.parse(accessToken);

    const client = await createDAVClient({
      serverUrl: credentials.serverUrl,
      credentials: {
        username: credentials.username,
        password: credentials.password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) {
      throw new Error('No calendars found');
    }

    const calendar = credentials.calendarUrl
      ? calendars.find((cal) => cal.url === credentials.calendarUrl)
      : calendars[0];

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    await client.deleteCalendarObject({
      calendarObject: {
        url: `${calendar.url}/${eventId}.ics`,
        etag: '',
      } as any,
    });
  }

  /**
   * Generate iCalendar (ICS) format string
   */
  private generateICS(event: CalendarEvent): string {
    const uid = this.generateUID();
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const start = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = event.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Jetlag Recovery//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${this.escapeICS(event.summary)}`;

    if (event.description) {
      ics += `\nDESCRIPTION:${this.escapeICS(event.description)}`;
    }

    // Add color for Apple Calendar (iCloud)
    if (event.colorHex) {
      ics += `\nX-APPLE-CALENDAR-COLOR:${event.colorHex}`;
    }

    if (event.reminders && event.reminders.length > 0) {
      event.reminders.forEach((reminder) => {
        ics += `\nBEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT${reminder.minutes}M
DESCRIPTION:Reminder
END:VALARM`;
      });
    }

    ics += `\nEND:VEVENT
END:VCALENDAR`;

    return ics;
  }

  /**
   * Escape special characters for iCalendar format
   */
  private escapeICS(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Generate unique identifier for event
   */
  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@jetlag-recovery`;
  }

  /**
   * Discover CalDAV server URL from email address
   * Common providers with their CalDAV endpoints
   */
  static getServerUrlForProvider(email: string): string | null {
    const domain = email.split('@')[1]?.toLowerCase();

    const providers: Record<string, string> = {
      // Apple iCloud
      'icloud.com': 'https://caldav.icloud.com',
      'me.com': 'https://caldav.icloud.com',
      'mac.com': 'https://caldav.icloud.com',

      // Fastmail
      'fastmail.com': 'https://caldav.fastmail.com',
      'fastmail.fm': 'https://caldav.fastmail.com',

      // Yahoo
      'yahoo.com': 'https://caldav.calendar.yahoo.com',
      'yahoo.co.uk': 'https://caldav.calendar.yahoo.com',
      'yahoo.ca': 'https://caldav.calendar.yahoo.com',
      'yahoo.com.au': 'https://caldav.calendar.yahoo.com',

      // ProtonMail (requires Bridge or paid plan)
      'proton.me': 'https://mail.proton.me/calendar',
      'protonmail.com': 'https://mail.proton.me/calendar',

      // AOL
      'aol.com': 'https://caldav.calendar.aol.com',

      // GMX
      'gmx.com': 'https://caldav.gmx.com',
      'gmx.net': 'https://caldav.gmx.com',

      // Mail.ru
      'mail.ru': 'https://caldav.mail.ru',

      // Zoho
      'zoho.com': 'https://calendar.zoho.com',
    };

    return providers[domain] || null;
  }

  /**
   * Get provider name from email domain
   */
  static getProviderName(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();

    const providerNames: Record<string, string> = {
      'icloud.com': 'Apple iCloud',
      'me.com': 'Apple iCloud',
      'mac.com': 'Apple iCloud',
      'fastmail.com': 'Fastmail',
      'fastmail.fm': 'Fastmail',
      'yahoo.com': 'Yahoo Calendar',
      'yahoo.co.uk': 'Yahoo Calendar',
      'yahoo.ca': 'Yahoo Calendar',
      'yahoo.com.au': 'Yahoo Calendar',
      'proton.me': 'ProtonMail Calendar',
      'protonmail.com': 'ProtonMail Calendar',
      'aol.com': 'AOL Calendar',
      'gmx.com': 'GMX Calendar',
      'gmx.net': 'GMX Calendar',
      'mail.ru': 'Mail.ru Calendar',
      'zoho.com': 'Zoho Calendar',
    };

    return providerNames[domain] || 'CalDAV Server';
  }

  /**
   * Check if provider requires special authentication
   */
  static getProviderInstructions(email: string): string | null {
    const domain = email.split('@')[1]?.toLowerCase();

    const instructions: Record<string, string> = {
      'icloud.com': 'Use an app-specific password from appleid.apple.com',
      'me.com': 'Use an app-specific password from appleid.apple.com',
      'mac.com': 'Use an app-specific password from appleid.apple.com',
      'yahoo.com': 'Use an app-specific password from Yahoo Account Security',
      'proton.me': 'Requires ProtonMail Bridge (paid plan) or app password',
      'protonmail.com': 'Requires ProtonMail Bridge (paid plan) or app password',
    };

    return instructions[domain] || null;
  }
}
