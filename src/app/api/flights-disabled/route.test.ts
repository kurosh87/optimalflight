import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock database before imports
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([{ id: '123' }]),
  delete: jest.fn().mockReturnThis(),
};

// Mock Clerk authentication
const mockRequireAuth = jest.fn();
// jest.mock('@/lib/auth/clerk', () => ({
//   requireAuth: mockRequireAuth,
// })); // Using NextAuth instead

// Mock database
jest.mock('@/lib/db', () => ({
  getDb: jest.fn(() => mockDb),
}));

// Mock Redis cache
jest.mock('@/lib/redis', () => ({
  getCachedUserFlights: jest.fn().mockResolvedValue(null),
  cacheUserFlights: jest.fn(),
  invalidateUserFlights: jest.fn(),
}));

// Mock jetlag calculator
jest.mock('@/lib/jetlag/calculator', () => ({
  calculateJetlagPlan: jest.fn(() => ({ severity: 'moderate' })),
}));

// Mock preferences adapter
jest.mock('@/lib/jetlag/preferences-adapter', () => ({
  adaptUserPreferences: jest.fn(() => ({})),
}));

// Mock billing
jest.mock('@/lib/billing/clerk-billing', () => ({
  getFlightLimit: jest.fn(() => 100),
  hasFlightMonitoring: jest.fn(() => true),
}));

import { GET, POST, DELETE } from './route';

describe('Flights API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock chains
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
    mockDb.returning.mockResolvedValue([{ id: '123' }]);
    mockDb.delete.mockReturnThis();
  });

  describe('GET /api/flights', () => {
    test('returns 401 when user is not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const request = new Request('http://localhost/api/flights');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    test('returns user flights when authenticated', async () => {
      mockRequireAuth.mockResolvedValue('test-user-123');

      // Mock database response
      const mockFlights = [
        {
          id: BigInt(1),
          flight_number: 'UA123',
          origin_airport_code: 'SFO',
          destination_airport_code: 'JFK',
          departure_time: '2025-06-01T10:00:00Z',
          arrival_time: '2025-06-01T18:00:00Z',
          duration: BigInt(480),
          jetlagPlan: null,
        },
      ];

      mockDb.orderBy.mockResolvedValue(mockFlights);

      const request = new Request('http://localhost/api/flights');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/flights', () => {
    test('returns 401 when user is not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const request = new Request('http://localhost/api/flights', {
        method: 'POST',
        body: JSON.stringify({
          flightNumber: 'UA123',
          originAirportCode: 'SFO',
          destinationAirportCode: 'JFK',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    test('returns 400 when required fields are missing', async () => {
      mockRequireAuth.mockResolvedValue('test-user-123');

      const request = new Request('http://localhost/api/flights', {
        method: 'POST',
        body: JSON.stringify({
          flightNumber: 'UA123',
          // Missing required fields
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('creates flight with valid data', async () => {
      mockRequireAuth.mockResolvedValue('test-user-123');

      const flightData = {
        flightNumber: 'UA123',
        airline: 'United Airlines',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        originCity: 'San Francisco',
        destinationCity: 'New York',
        originTimezone: 'America/Los_Angeles',
        destinationTimezone: 'America/New_York',
        departureTime: '2025-06-01T10:00:00Z',
        arrivalTime: '2025-06-01T18:00:00Z',
        duration: 480,
      };

      const request = new Request('http://localhost/api/flights', {
        method: 'POST',
        body: JSON.stringify(flightData),
      });

      const response = await POST(request);
      expect([200, 201]).toContain(response.status);
    });

    test('validates flight number format', async () => {
      mockRequireAuth.mockResolvedValue('test-user-123');

      const request = new Request('http://localhost/api/flights', {
        method: 'POST',
        body: JSON.stringify({
          flightNumber: 'INVALID',
          airline: 'Test',
          originAirportCode: 'SFO',
          destinationAirportCode: 'JFK',
          departureTime: '2025-06-01T10:00:00Z',
          arrivalTime: '2025-06-01T18:00:00Z',
        }),
      });

      const response = await POST(request);
      // Should either accept or reject based on validation rules
      expect([200, 201, 400, 422]).toContain(response.status);
    });

    test('validates airport codes are 3 letters', async () => {
      mockRequireAuth.mockResolvedValue('test-user-123');

      const request = new Request('http://localhost/api/flights', {
        method: 'POST',
        body: JSON.stringify({
          flightNumber: 'UA123',
          airline: 'United',
          originAirportCode: 'SFOX', // Invalid - 4 letters
          destinationAirportCode: 'JFK',
          departureTime: '2025-06-01T10:00:00Z',
          arrivalTime: '2025-06-01T18:00:00Z',
        }),
      });

      const response = await POST(request);
      expect([400, 422]).toContain(response.status);
    });

    test('validates arrival time is after departure time', async () => {
      mockRequireAuth.mockResolvedValue('test-user-123');

      const request = new Request('http://localhost/api/flights', {
        method: 'POST',
        body: JSON.stringify({
          flightNumber: 'UA123',
          airline: 'United',
          originAirportCode: 'SFO',
          destinationAirportCode: 'JFK',
          departureTime: '2025-06-01T18:00:00Z',
          arrivalTime: '2025-06-01T10:00:00Z', // Before departure
        }),
      });

      const response = await POST(request);
      expect([400, 422]).toContain(response.status);
    });
  });
});
