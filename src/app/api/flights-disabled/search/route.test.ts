import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { POST } from './route';
import { NextResponse } from 'next/server';

// TODO: Replace Clerk auth mock with NextAuth or custom auth mock
// Mock Clerk authentication
// jest.mock('@clerk/nextjs/server', () => ({
//   auth: jest.fn(),
// }));

// const { auth } = require('@clerk/nextjs/server');

// Temporary mock auth for testing
const auth = jest.fn();

describe('Flight Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/flights/search', () => {
    test('returns 401 when user is not authenticated', async () => {
      auth.mockResolvedValue({ userId: null });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'JFK',
          destination: 'LHR',
          departureDate: '2025-06-01',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 400 when origin is missing', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          destination: 'LHR',
          departureDate: '2025-06-01',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns 400 when destination is missing', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'JFK',
          departureDate: '2025-06-01',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns 400 when departureDate is missing', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'JFK',
          destination: 'LHR',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns flight results when all parameters are valid', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'JFK',
          destination: 'LHR',
          departureDate: '2025-06-01',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flights).toBeDefined();
      expect(Array.isArray(data.flights)).toBe(true);
      expect(data.searchParams).toEqual({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2025-06-01',
      });
    });

    test('returns multiple flight options', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'JFK',
          destination: 'LHR',
          departureDate: '2025-06-01',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.flights.length).toBeGreaterThan(0);
      expect(data.flights.length).toBeLessThanOrEqual(10);
    });

    test('flight objects have required properties', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'LAX',
          destination: 'NRT',
          departureDate: '2025-07-15',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const flight = data.flights[0];

      expect(flight).toHaveProperty('id');
      expect(flight).toHaveProperty('airline');
      expect(flight).toHaveProperty('flightNumber');
      expect(flight).toHaveProperty('aircraftType');
      expect(flight).toHaveProperty('departureTime');
      expect(flight).toHaveProperty('arrivalTime');
      expect(flight).toHaveProperty('duration');
      expect(flight).toHaveProperty('price');
      expect(flight).toHaveProperty('cabinClass');
      expect(flight).toHaveProperty('stops');
      expect(flight).toHaveProperty('available');
    });

    test('price object has correct structure', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'SFO',
          destination: 'JFK',
          departureDate: '2025-08-20',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const flight = data.flights[0];

      expect(flight.price).toHaveProperty('amount');
      expect(flight.price).toHaveProperty('currency');
      expect(typeof flight.price.amount).toBe('number');
      expect(flight.price.amount).toBeGreaterThan(0);
      expect(flight.price.currency).toBe('USD');
    });

    test('flights are sorted by price (cheapest first)', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'ORD',
          destination: 'LAX',
          departureDate: '2025-09-10',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const prices = data.flights.map((f: any) => f.price.amount);

      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    test('departure times are within the requested date range', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const departureDate = '2025-10-15';

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'BOS',
          destination: 'MIA',
          departureDate,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Check that departure times are reasonable (within 48 hours of requested date)
      const requestedDate = new Date(departureDate);
      const dayBefore = new Date(requestedDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayAfter = new Date(requestedDate);
      dayAfter.setDate(dayAfter.getDate() + 1);

      data.flights.forEach((flight: any) => {
        const flightTime = new Date(flight.departureTime);
        expect(flightTime.getTime()).toBeGreaterThanOrEqual(dayBefore.getTime());
        expect(flightTime.getTime()).toBeLessThanOrEqual(dayAfter.getTime());
      });
    });

    test('arrival time is after departure time', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'DFW',
          destination: 'SEA',
          departureDate: '2025-11-20',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      data.flights.forEach((flight: any) => {
        const departure = new Date(flight.departureTime);
        const arrival = new Date(flight.arrivalTime);
        expect(arrival.getTime()).toBeGreaterThan(departure.getTime());
      });
    });

    test('duration matches time difference between departure and arrival', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'ATL',
          destination: 'DEN',
          departureDate: '2025-12-05',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      data.flights.forEach((flight: any) => {
        const departure = new Date(flight.departureTime);
        const arrival = new Date(flight.arrivalTime);
        const actualDuration = (arrival.getTime() - departure.getTime()) / (1000 * 60);
        expect(actualDuration).toBe(flight.duration);
      });
    });

    test('cabin classes are valid values', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'PHX',
          destination: 'PDX',
          departureDate: '2026-01-15',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const validCabinClasses = ['economy', 'premium_economy', 'business', 'first'];

      data.flights.forEach((flight: any) => {
        expect(validCabinClasses).toContain(flight.cabinClass);
      });
    });

    test('stops are reasonable (0-2)', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'MSP',
          destination: 'MCO',
          departureDate: '2026-02-20',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      data.flights.forEach((flight: any) => {
        expect(flight.stops).toBeGreaterThanOrEqual(0);
        expect(flight.stops).toBeLessThanOrEqual(2);
      });
    });

    test('flight numbers have correct airline prefix', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'IAH',
          destination: 'SAN',
          departureDate: '2026-03-10',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const airlinePrefixes = ['UA', 'DL', 'AA', 'WN', 'B6', 'AS'];

      data.flights.forEach((flight: any) => {
        const prefix = flight.flightNumber.substring(0, 2);
        expect(airlinePrefixes).toContain(prefix);
      });
    });

    test('handles malformed JSON request body', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search flights');
    });

    test('different searches return different results (randomization)', async () => {
      auth.mockResolvedValue({ userId: 'test-user-123' });

      const request1 = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'LAS',
          destination: 'ORD',
          departureDate: '2026-04-01',
        }),
      });

      const request2 = new Request('http://localhost/api/flights/search', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'LAS',
          destination: 'ORD',
          departureDate: '2026-04-01',
        }),
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();

      // Small delay to ensure different randomization
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await POST(request2);
      const data2 = await response2.json();

      // Should have different flight counts or prices due to randomization
      const isDifferent =
        data1.flights.length !== data2.flights.length ||
        data1.flights[0].price.amount !== data2.flights[0].price.amount;

      expect(isDifferent).toBe(true);
    });
  });
});
