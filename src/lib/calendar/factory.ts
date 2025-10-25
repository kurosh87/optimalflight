import { GoogleCalendarService } from './google';
import { MicrosoftCalendarService } from './microsoft';
import { CalendarServiceInterface, CalendarProvider } from './types';

/**
 * Factory function to get the appropriate calendar service
 */
export function getCalendarService(provider: CalendarProvider): CalendarServiceInterface {
  switch (provider) {
    case 'google':
      return new GoogleCalendarService();
    case 'microsoft':
      return new MicrosoftCalendarService();
    default:
      throw new Error(`Calendar provider "${provider}" not supported`);
  }
}
