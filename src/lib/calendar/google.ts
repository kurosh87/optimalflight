import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { hexToGoogleColorId } from './color-schemes';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  reminders?: { minutes: number }[];
  colorHex?: string;
  location?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Google Calendar configuration missing');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<TokenResponse> {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Calculate expiry date
    const expiresAt = new Date();
    if (tokens.expiry_date) {
      expiresAt.setTime(tokens.expiry_date);
    } else {
      // Default to 1 hour if not provided
      expiresAt.setHours(expiresAt.getHours() + 1);
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const expiresAt = new Date();
    if (credentials.expiry_date) {
      expiresAt.setTime(credentials.expiry_date);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 1);
    }

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken, // Use new or keep old
      expiresAt,
    };
  }

  /**
   * Create a calendar event
   */
  async createEvent(accessToken: string, event: CalendarEvent): Promise<string> {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        colorId: event.colorHex ? hexToGoogleColorId(event.colorHex) : undefined,
        reminders: event.reminders
          ? {
              useDefault: false,
              overrides: event.reminders.map((r) => ({
                method: 'popup',
                minutes: r.minutes,
              })),
            }
          : undefined,
      },
    });

    if (!response.data.id) {
      throw new Error('Failed to create calendar event');
    }

    return response.data.id;
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    const oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }
}
