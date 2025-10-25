import { CalendarEvent, TokenResponse, CalendarServiceInterface } from './types';

export class YahooCalendarService implements CalendarServiceInterface {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.YAHOO_CLIENT_ID || '';
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET || '';
    this.redirectUri = process.env.YAHOO_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Yahoo Calendar configuration missing');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const authUrl = new URL('https://api.login.yahoo.com/oauth2/request_auth');
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid email profile calendar-read calendar-write');

    return authUrl.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<TokenResponse> {
    const tokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('redirect_uri', this.redirectUri);
    params.append('code', code);
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
    const tokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('redirect_uri', this.redirectUri);
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
      refreshToken: data.refresh_token || refreshToken,
      expiresAt,
    };
  }

  /**
   * Create a calendar event
   * Note: Yahoo Calendar API is limited - this is a simplified implementation
   */
  async createEvent(accessToken: string, event: CalendarEvent): Promise<string> {
    // Yahoo Calendar uses CalDAV protocol for event creation
    // This would require CalDAV implementation
    // For now, throw an error indicating this needs CalDAV
    throw new Error('Yahoo Calendar requires CalDAV implementation for event creation');
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    throw new Error('Yahoo Calendar requires CalDAV implementation for event deletion');
  }
}
