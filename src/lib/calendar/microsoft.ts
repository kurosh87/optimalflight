import { Client } from '@microsoft/microsoft-graph-client';
import { hexToOutlookColor } from './color-schemes';

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

export class MicrosoftCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.MICROSOFT_CLIENT_ID || '';
    this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Microsoft Calendar configuration missing');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const scopes = [
      'Calendars.ReadWrite',
      'offline_access',
    ];

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append('prompt', 'consent'); // Force consent to get refresh token

    return authUrl.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<TokenResponse> {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('code', code);
    params.append('redirect_uri', this.redirectUri);
    params.append('grant_type', 'authorization_code');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get tokens: ${error}`);
    }

    const data = await response.json();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Use new or keep old
      expiresAt,
    };
  }

  /**
   * Create a calendar event
   */
  async createEvent(accessToken: string, event: CalendarEvent): Promise<string> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    const graphEvent: any = {
      subject: event.summary,
      body: {
        contentType: 'Text',
        content: event.description || '',
      },
      location: event.location ? { displayName: event.location } : undefined,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'UTC',
      },
      isReminderOn: event.reminders && event.reminders.length > 0,
      reminderMinutesBeforeStart: event.reminders?.[0]?.minutes || 15,
    };

    // Add color if provided (Outlook uses categories)
    if (event.colorHex) {
      const colorName = this.hexToMicrosoftColor(event.colorHex);
      graphEvent.categories = [colorName];
    }

    const response = await client
      .api('/me/calendar/events')
      .post(graphEvent);

    if (!response.id) {
      throw new Error('Failed to create calendar event');
    }

    return response.id;
  }

  /**
   * Convert hex color to Microsoft Outlook category color name
   */
  private hexToMicrosoftColor(hex: string): string {
    // Map hex colors to Outlook color categories
    const colorMap: Record<string, string> = {
      '#FFB84D': 'Orange category',
      '#9333EA': 'Purple category',
      '#1E40AF': 'Blue category',
      '#059669': 'Green category',
      '#DC2626': 'Red category',
      '#78350F': 'Yellow category',
    };

    return colorMap[hex] || 'Blue category'; // Default to blue
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    await client
      .api(`/me/calendar/events/${eventId}`)
      .delete();
  }
}
