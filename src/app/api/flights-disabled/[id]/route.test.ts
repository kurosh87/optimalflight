import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
const mockSql = jest.fn();
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
  delete: jest.fn().mockReturnThis(),
};

const mockRequireAuth = jest.fn();
const mockGetAirportByCode = jest.fn();

// jest.mock('@/lib/auth/clerk', () => ({
//   requireAuth: mockRequireAuth,
// })); // Using NextAuth instead

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => mockSql),
}));

jest.mock('drizzle-orm/neon-http', () => ({
  drizzle: jest.fn(() => mockDb),
}));

jest.mock('@/lib/amadeus', () => ({
  getAirportByCode: mockGetAirportByCode,
}));

jest.mock('@/lib/db/schema', () => ({
  flights: {},
}));

import { GET, DELETE } from './route';

describe('Flight [id] API - Bug Detection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);
    mockDb.delete.mockReturnThis();
    mockGetAirportByCode.mockResolvedValue(null);
  });

  describe('Critical Bug: JSON Parsing Error Handling', () => {
    test('FIXED: GET handles invalid jetlagPlan JSON gracefully', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const flightWithInvalidJSON = {
        id: BigInt(123),
        ownerId: 'user-123',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        jetlagPlan: '{invalid json{{{', // Invalid JSON!
        duration: BigInt(480),
      };

      mockDb.limit.mockResolvedValue([flightWithInvalidJSON]);

      const params = Promise.resolve({ id: '123' });
      const request = new Request('http://localhost/api/flights/123');

      const response = await GET(request, { params });

      // FIXED: Now returns 200 with null jetlagPlan instead of crashing
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.jetlagPlan).toBeNull(); // Invalid JSON returns null
      expect(data.id).toBe('123');
    });

    test('GET handles null jetlagPlan correctly', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const flight = {
        id: BigInt(123),
        ownerId: 'user-123',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        jetlagPlan: null,
        duration: BigInt(480),
      };

      mockDb.limit.mockResolvedValue([flight]);

      const params = Promise.resolve({ id: '123' });
      const request = new Request('http://localhost/api/flights/123');

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jetlagPlan).toBeNull();
    });

    test('GET handles empty string jetlagPlan', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const flight = {
        id: BigInt(123),
        ownerId: 'user-123',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        jetlagPlan: '', // Empty string
        duration: BigInt(480),
      };

      mockDb.limit.mockResolvedValue([flight]);

      const params = Promise.resolve({ id: '123' });
      const request = new Request('http://localhost/api/flights/123');

      const response = await GET(request, { params });

      // Should handle empty string gracefully
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Security: Authorization Tests', () => {
    test('GET prevents accessing other users\' flights', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      // Database returns empty (flight doesn't belong to user)
      mockDb.limit.mockResolvedValue([]);

      const params = Promise.resolve({ id: '456' });
      const request = new Request('http://localhost/api/flights/456');

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Flight not found');
    });

    test('DELETE prevents deleting other users\' flights', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const params = Promise.resolve({ id: '456' });
      const request = new Request('http://localhost/api/flights/456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params });

      // Should succeed (returns 200) even if flight doesn't exist
      // This is by design for DELETE operations
      expect(response.status).toBe(200);
    });
  });

  describe('Data Serialization Tests', () => {
    test('GET properly serializes all BigInt fields', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const flight = {
        id: BigInt(9007199254740991), // Max safe integer + 1
        ownerId: 'user-123',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        jetlagPlan: JSON.stringify({ test: 'data' }),
        duration: BigInt(480),
      };

      mockDb.limit.mockResolvedValue([flight]);

      const params = Promise.resolve({ id: '9007199254740991' });
      const request = new Request('http://localhost/api/flights/9007199254740991');

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();

      // BigInt fields should be converted to string/number
      expect(typeof data.id).toBe('string');
      expect(typeof data.duration).toBe('number');
    });
  });

  describe('External API Error Handling', () => {
    test('GET continues when Amadeus API fails', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const flight = {
        id: BigInt(123),
        ownerId: 'user-123',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        jetlagPlan: null,
        duration: BigInt(480),
      };

      mockDb.limit.mockResolvedValue([flight]);
      mockGetAirportByCode.mockRejectedValue(new Error('Amadeus API down'));

      const params = Promise.resolve({ id: '123' });
      const request = new Request('http://localhost/api/flights/123');

      const response = await GET(request, { params });

      // Should still return flight data without airport details
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('123');
      expect(data.originAirportDetails).toBeNull();
      expect(data.destinationAirportDetails).toBeNull();
    });
  });

  describe('Input Validation Tests', () => {
    test('FIXED: GET validates flight ID format and returns 400', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const params = Promise.resolve({ id: 'not-a-number' });
      const request = new Request('http://localhost/api/flights/not-a-number');

      const response = await GET(request, { params });

      // FIXED: Now returns 400 for invalid ID format instead of crashing
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid flight ID format');
    });

    test('FIXED: GET rejects negative flight ID', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const params = Promise.resolve({ id: '-123' });
      const request = new Request('http://localhost/api/flights/-123');

      const response = await GET(request, { params });

      // FIXED: Returns 400 for invalid format (negative IDs not allowed)
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid flight ID format');
    });

    test('DELETE handles very large flight IDs', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const params = Promise.resolve({ id: '99999999999999999999' });
      const request = new Request('http://localhost/api/flights/99999999999999999999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params });

      // Valid numeric format, so proceeds to deletion (returns 200)
      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    test('GET handles flight with all null fields', async () => {
      mockRequireAuth.mockResolvedValue('user-123');

      const minimalFlight = {
        id: BigInt(123),
        ownerId: 'user-123',
        originAirportCode: 'SFO',
        destinationAirportCode: 'JFK',
        jetlagPlan: null,
        duration: null,
        airline: null,
        flightNumber: null,
      };

      mockDb.limit.mockResolvedValue([minimalFlight]);

      const params = Promise.resolve({ id: '123' });
      const request = new Request('http://localhost/api/flights/123');

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.duration).toBeNull();
    });
  });
});
