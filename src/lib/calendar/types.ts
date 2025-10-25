export interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  reminders?: { minutes: number }[];
  colorHex?: string; // Hex color code like "#F4C542"
  location?: string; // Location/address for the event
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface CalendarServiceInterface {
  getAuthorizationUrl(): string;
  getTokensFromCode(code: string): Promise<TokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
  createEvent(accessToken: string, event: CalendarEvent): Promise<string>;
  deleteEvent(accessToken: string, eventId: string): Promise<void>;
}

export type CalendarProvider = 'google' | 'microsoft' | 'yahoo' | 'caldav';

export interface CalendarConnection {
  id: bigint;
  ownerId: string;
  provider: CalendarProvider;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
