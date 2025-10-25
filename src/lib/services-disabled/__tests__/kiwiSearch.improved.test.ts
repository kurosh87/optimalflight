/**
 * IMPROVED Kiwi API Service Tests
 *
 * Properly mocked external dependencies
 * Handles missing API keys gracefully
 * Tests core functionality without external API calls
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { KiwiTequilaService } from '../kiwiSearch';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockFlightResponse = {
  data: [
    {
      id: 'flight1',
      flyFrom: 'JFK',
      flyTo: 'LAX',
      cityFrom: 'New York',
      cityTo: 'Los Angeles',
      price: 350,
      currency: 'USD',
      deep_link: 'https://www.kiwi.com/deep?booking_token=test123',
      booking_token: 'test_booking_token_123456',
      route: [
        {
          flyFrom: 'JFK',
          flyTo: 'LAX',
          airline: 'AA',
          flight_no: 100,
          operating_flight_no: '100',
          local_departure: '2025-11-01T10:00:00.000Z',
          utc_departure: '2025-11-01T14:00:00.000Z',
          local_arrival: '2025-11-01T13:00:00.000Z',
          utc_arrival: '2025-11-01T17:00:00.000Z'
        }
      ],
      quality: 850.5,
      duration: {
        total: 18000,
        departure: 0,
        return: 0
      }
    }
  ],
  search_params: {
    flyFrom: 'JFK',
    flyTo: 'LAX'
  },
  currency: 'USD',
  fx_rate: 1
};

const mockLocationResponse = {
  locations: [
    {
      id: 'JFK',
      code: 'JFK',
      name: 'New York John F. Kennedy',
      type: 'airport',
      city: {
        id: 'NYC',
        name: 'New York',
        code: 'NYC'
      }
    }
  ]
};

// ============================================================================
// MOCKED TESTS
// ============================================================================

describe('Kiwi API Service (Mocked)', () => {
  let kiwiService: KiwiTequilaService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Initialize service with mock API keys
    kiwiService = new KiwiTequilaService({
      standard: 'mock_standard_key',
      multiCity: 'mock_multi_key',
      nomad: 'mock_nomad_key',
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // 1. SERVICE INITIALIZATION
  // ==========================================================================

  describe('1. Service Initialization', () => {
    it('should initialize with API keys', () => {
      expect(kiwiService).toBeDefined();
      expect(kiwiService).toBeInstanceOf(KiwiTequilaService);
    });

    it('should have base URL configured', () => {
      expect(kiwiService).toHaveProperty('baseUrl');
    });
  });

  // ==========================================================================
  // 2. STANDARD FLIGHT SEARCH (MOCKED)
  // ==========================================================================

  describe('2. Standard Flight Search (Mocked)', () => {
    beforeEach(() => {
      // Mock successful API response
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockFlightResponse,
        headers: new Headers({ 'Content-Type': 'application/json' })
      })) as any;
    });

    it('should search for flights and return valid structure', async () => {
      const params = {
        fly_from: 'JFK',
        fly_to: 'LAX',
        date_from: '2025-11-01',
        date_to: '2025-11-01',
        adults: 1,
        limit: 5,
      };

      const result = await kiwiService.searchFlights(params);

      // Verify structure
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should include deep_link in search results', async () => {
      const result = await kiwiService.searchFlights({
        fly_from: 'JFK',
        fly_to: 'LAX',
        date_from: '2025-11-01',
        date_to: '2025-11-01',
      });

      expect(result.data[0].deep_link).toBeDefined();
      expect(result.data[0].deep_link).toContain('kiwi.com');
    });

    it('should include booking_token in search results', async () => {
      const result = await kiwiService.searchFlights({
        fly_from: 'JFK',
        fly_to: 'LAX',
        date_from: '2025-11-01',
        date_to: '2025-11-01',
      });

      expect(result.data[0].booking_token).toBeDefined();
      expect(typeof result.data[0].booking_token).toBe('string');
      expect(result.data[0].booking_token.length).toBeGreaterThan(10);
    });

    it('should include price and currency', async () => {
      const result = await kiwiService.searchFlights({
        fly_from: 'JFK',
        fly_to: 'LAX',
        date_from: '2025-11-01',
        date_to: '2025-11-01',
      });

      expect(result.data[0].price).toBeDefined();
      expect(typeof result.data[0].price).toBe('number');
      expect(result.data[0].currency).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid parameters' })
      })) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'INVALID',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow();
    });

    it('should handle rate limiting (429)', async () => {
      // Mock rate limit response
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '60' }),
        json: async () => ({ error: 'Rate limit exceeded' })
      })) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'JFK',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      // Mock timeout
      global.fetch = jest.fn(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      ) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'JFK',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow('timeout');
    });
  });

  // ==========================================================================
  // 3. LOCATION SEARCH (MOCKED)
  // ==========================================================================

  describe('3. Location Autocomplete (Mocked)', () => {
    beforeEach(() => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockLocationResponse
      })) as any;
    });

    it('should search for locations by name', async () => {
      const results = await kiwiService.searchLocations('New York');

      expect(results).toBeDefined();
      expect(Array.isArray(results.locations)).toBe(true);
      expect(results.locations.length).toBeGreaterThan(0);
    });

    it('should return airport details', async () => {
      const results = await kiwiService.searchLocations('JFK');

      const airport = results.locations[0];
      expect(airport).toHaveProperty('code');
      expect(airport).toHaveProperty('name');
      expect(airport).toHaveProperty('type');
    });

    it('should handle empty results', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ locations: [] })
      })) as any;

      const results = await kiwiService.searchLocations('ZZZZZ');

      expect(results.locations).toEqual([]);
    });
  });

  // ==========================================================================
  // 4. ERROR HANDLING
  // ==========================================================================

  describe('4. Error Handling', () => {
    it('should handle missing API key', async () => {
      const serviceNoKey = new KiwiTequilaService({
        standard: '',
        multiCity: '',
        nomad: '',
      });

      // Should either throw or return graceful error
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })) as any;

      await expect(
        serviceNoKey.searchFlights({
          fly_from: 'JFK',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      })) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'JFK',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'JFK',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow('Network error');
    });
  });

  // ==========================================================================
  // 5. PARAMETER VALIDATION
  // ==========================================================================

  describe('5. Parameter Validation', () => {
    it('should validate required parameters', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => mockFlightResponse
      })) as any;

      // Missing required params
      await expect(
        kiwiService.searchFlights({} as any)
      ).rejects.toThrow();
    });

    it('should validate date format', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => mockFlightResponse
      })) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'JFK',
          fly_to: 'LAX',
          date_from: 'invalid-date',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow();
    });

    it('should validate airport codes', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => mockFlightResponse
      })) as any;

      await expect(
        kiwiService.searchFlights({
          fly_from: 'INVALID',
          fly_to: 'LAX',
          date_from: '2025-11-01',
          date_to: '2025-11-01',
        })
      ).rejects.toThrow();
    });
  });
});

export {};
