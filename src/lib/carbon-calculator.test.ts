import { describe, test, expect } from '@jest/globals';
import {
  calculateFlightCarbon,
  calculateTotalCarbon,
  getOffsetPrice,
  getCarbonReductions,
} from './carbon-calculator';

describe('Carbon Calculator', () => {
  describe('calculateFlightCarbon', () => {
    test('calculates basic economy flight carbon correctly', () => {
      const result = calculateFlightCarbon(1000, 'economy');

      expect(result.totalKg).toBeGreaterThan(0);
      expect(result.totalTons).toBe(result.totalKg / 1000);
      expect(result.distanceKm).toBe(1000);
      expect(result.cabinClass).toBe('economy');
      expect(result.equivalents).toBeDefined();
      expect(result.equivalents.treesNeeded).toBeGreaterThan(0);
    });

    test('business class has higher emissions than economy', () => {
      const economyCarbon = calculateFlightCarbon(1000, 'economy');
      const businessCarbon = calculateFlightCarbon(1000, 'business');

      expect(businessCarbon.totalKg).toBeGreaterThan(economyCarbon.totalKg);
    });

    test('first class has highest emissions', () => {
      const economyCarbon = calculateFlightCarbon(1000, 'economy');
      const businessCarbon = calculateFlightCarbon(1000, 'business');
      const firstCarbon = calculateFlightCarbon(1000, 'first');

      expect(firstCarbon.totalKg).toBeGreaterThan(economyCarbon.totalKg);
      expect(firstCarbon.totalKg).toBeGreaterThan(businessCarbon.totalKg);
    });

    test('premium economy is between economy and business', () => {
      const economyCarbon = calculateFlightCarbon(1000, 'economy');
      const premiumCarbon = calculateFlightCarbon(1000, 'premiumEconomy');
      const businessCarbon = calculateFlightCarbon(1000, 'business');

      expect(premiumCarbon.totalKg).toBeGreaterThan(economyCarbon.totalKg);
      expect(premiumCarbon.totalKg).toBeLessThan(businessCarbon.totalKg);
    });

    test('longer flights have higher emissions', () => {
      const shortFlight = calculateFlightCarbon(500, 'economy');
      const longFlight = calculateFlightCarbon(5000, 'economy');

      expect(longFlight.totalKg).toBeGreaterThan(shortFlight.totalKg);
    });

    test('handles zero distance', () => {
      const result = calculateFlightCarbon(0, 'economy');

      expect(result.totalKg).toBe(0);
      expect(result.totalTons).toBe(0);
    });

    test('applies aircraft type multiplier for efficient aircraft', () => {
      const standard = calculateFlightCarbon(1000, 'economy');
      const dreamliner = calculateFlightCarbon(1000, 'economy', 'Boeing 787');

      // 787 Dreamliner is more efficient (0.85 multiplier)
      expect(dreamliner.totalKg).toBeLessThan(standard.totalKg);
      expect(dreamliner.aircraftType).toBe('Boeing 787');
    });

    test('applies aircraft type multiplier for less efficient aircraft', () => {
      const standard = calculateFlightCarbon(1000, 'economy');
      const a380 = calculateFlightCarbon(1000, 'economy', 'Airbus A380');

      // A380 is less efficient (1.20 multiplier)
      expect(a380.totalKg).toBeGreaterThan(standard.totalKg);
    });

    test('uses different emission factors for short, medium, and long haul', () => {
      const shortHaul = calculateFlightCarbon(500, 'economy'); // < 1500 km
      const mediumHaul = calculateFlightCarbon(2000, 'economy'); // 1500-4000 km
      const longHaul = calculateFlightCarbon(5000, 'economy'); // > 4000 km

      // Per km, short haul is highest, long haul is lowest
      const shortPerKm = shortHaul.totalKg / 500;
      const mediumPerKm = mediumHaul.totalKg / 2000;
      const longPerKm = longHaul.totalKg / 5000;

      expect(shortPerKm).toBeGreaterThan(mediumPerKm);
      expect(mediumPerKm).toBeGreaterThan(longPerKm);
    });

    test('includes all required equivalents', () => {
      const result = calculateFlightCarbon(1000, 'economy');

      expect(result.equivalents.treesNeeded).toBeGreaterThan(0);
      expect(result.equivalents.carsKm).toBeGreaterThan(0);
      expect(result.equivalents.homeEnergyDays).toBeGreaterThan(0);
    });
  });

  describe('calculateTotalCarbon', () => {
    test('calculates total carbon for single flight', () => {
      const flights = [
        {
          distanceKm: 1000,
          cabinClass: 'economy' as const,
        },
      ];

      const result = calculateTotalCarbon(flights);

      expect(result.totalKg).toBeGreaterThan(0);
      expect(result.totalTons).toBe(result.totalKg / 1000);
      expect(result.averagePerFlight).toBe(result.totalKg);
      expect(result.equivalents).toBeDefined();
    });

    test('calculates total carbon for multiple flights', () => {
      const flights = [
        { distanceKm: 1000, cabinClass: 'economy' as const },
        { distanceKm: 2000, cabinClass: 'business' as const },
        { distanceKm: 500, cabinClass: 'economy' as const },
      ];

      const result = calculateTotalCarbon(flights);

      expect(result.totalKg).toBeGreaterThan(0);
      expect(result.averagePerFlight).toBe(result.totalKg / 3);

      // Verify it's greater than just the sum of economy flights
      const flight1 = calculateFlightCarbon(1000, 'economy');
      const flight3 = calculateFlightCarbon(500, 'economy');
      expect(result.totalKg).toBeGreaterThan(flight1.totalKg + flight3.totalKg);
    });

    test('handles empty flight array', () => {
      const result = calculateTotalCarbon([]);

      expect(result.totalKg).toBe(0);
      expect(result.totalTons).toBe(0);
      expect(result.averagePerFlight).toBe(0);
      expect(result.equivalents.treesNeeded).toBe(0);
    });

    test('includes all equivalents in result', () => {
      const flights = [{ distanceKm: 1000, cabinClass: 'economy' as const }];
      const result = calculateTotalCarbon(flights);

      expect(result.equivalents.treesNeeded).toBeGreaterThan(0);
      expect(result.equivalents.carsKm).toBeGreaterThan(0);
      expect(result.equivalents.homeEnergyDays).toBeGreaterThan(0);
    });

    test('defaults to economy when cabin class not specified', () => {
      const withClass = calculateTotalCarbon([
        { distanceKm: 1000, cabinClass: 'economy' },
      ]);

      const withoutClass = calculateTotalCarbon([
        { distanceKm: 1000 },
      ]);

      expect(withClass.totalKg).toBe(withoutClass.totalKg);
    });

    test('includes aircraft type in calculations', () => {
      const withoutAircraft = calculateTotalCarbon([
        { distanceKm: 1000, cabinClass: 'economy' },
      ]);

      const withAircraft = calculateTotalCarbon([
        { distanceKm: 1000, cabinClass: 'economy', aircraftType: 'Boeing 787' },
      ]);

      // 787 is more efficient, so should have lower emissions
      expect(withAircraft.totalKg).toBeLessThan(withoutAircraft.totalKg);
    });
  });

  describe('getOffsetPrice', () => {
    test('calculates offset prices correctly', () => {
      const prices = getOffsetPrice(1.0); // 1 ton

      expect(prices.low).toBeGreaterThan(0);
      expect(prices.average).toBeGreaterThan(prices.low);
      expect(prices.high).toBeGreaterThan(prices.average);
    });

    test('higher emissions cost more to offset', () => {
      const lowPrices = getOffsetPrice(1.0);
      const highPrices = getOffsetPrice(10.0);

      expect(highPrices.low).toBeGreaterThan(lowPrices.low);
      expect(highPrices.average).toBeGreaterThan(lowPrices.average);
      expect(highPrices.high).toBeGreaterThan(lowPrices.high);
    });

    test('price scales linearly with emissions', () => {
      const prices1 = getOffsetPrice(1.0);
      const prices2 = getOffsetPrice(2.0);

      expect(prices2.low).toBeCloseTo(prices1.low * 2, 2);
      expect(prices2.average).toBeCloseTo(prices1.average * 2, 2);
      expect(prices2.high).toBeCloseTo(prices1.high * 2, 2);
    });

    test('handles zero emissions', () => {
      const prices = getOffsetPrice(0);

      expect(prices.low).toBe(0);
      expect(prices.average).toBe(0);
      expect(prices.high).toBe(0);
    });

    test('handles fractional tons', () => {
      const prices = getOffsetPrice(0.5);

      expect(prices.low).toBeGreaterThan(0);
      expect(prices.average).toBeGreaterThan(0);
      expect(prices.high).toBeGreaterThan(0);
    });

    test('prices are within expected range', () => {
      const prices = getOffsetPrice(1.0);

      // Based on code: $10-$50 per ton
      expect(prices.low).toBe(10);
      expect(prices.average).toBe(25);
      expect(prices.high).toBe(50);
    });
  });

  describe('getCarbonReductions', () => {
    test('returns array of reduction tips', () => {
      const tips = getCarbonReductions();

      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    test('all tips are non-empty strings', () => {
      const tips = getCarbonReductions();

      tips.forEach(tip => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-world scenarios', () => {
    test('NYC to London (economy) - ~3470 miles', () => {
      const result = calculateFlightCarbon(5585, 'economy');

      // Long-haul economy: ~0.095 kg/km * 5585 km = ~530 kg
      expect(result.totalKg).toBeGreaterThan(400);
      expect(result.totalKg).toBeLessThan(700);
      expect(result.equivalents.treesNeeded).toBeGreaterThan(20);
    });

    test('Los Angeles to Tokyo (business) - ~5470 miles', () => {
      const result = calculateFlightCarbon(8800, 'business');

      // Long-haul business: ~0.190 kg/km * 8800 km = ~1672 kg
      expect(result.totalKg).toBeGreaterThan(1400);
      expect(result.totalKg).toBeLessThan(2000);
      expect(result.totalTons).toBeGreaterThan(1);
    });

    test('Short domestic flight (NYC to Boston)', () => {
      const result = calculateFlightCarbon(350, 'economy');

      // Short-haul economy: ~0.133 kg/km * 350 km = ~47 kg
      expect(result.totalKg).toBeGreaterThan(40);
      expect(result.totalKg).toBeLessThan(60);
    });

    test('Round-the-world trip (multiple flights)', () => {
      const flights = [
        { distanceKm: 5585, cabinClass: 'business' as const }, // NYC-London
        { distanceKm: 2900, cabinClass: 'business' as const }, // London-Dubai
        { distanceKm: 5950, cabinClass: 'business' as const }, // Dubai-Bangkok
        { distanceKm: 8800, cabinClass: 'business' as const }, // Bangkok-LA
        { distanceKm: 4500, cabinClass: 'business' as const }, // LA-NYC
      ];

      const result = calculateTotalCarbon(flights);

      // Total distance: ~27,735 km in business class
      // Should be several tons of CO2
      expect(result.totalTons).toBeGreaterThan(4);
      expect(result.totalTons).toBeLessThan(8);
      expect(result.equivalents.treesNeeded).toBeGreaterThan(200);
    });

    test('First class long-haul has 4x economy emissions', () => {
      const economy = calculateFlightCarbon(5000, 'economy');
      const first = calculateFlightCarbon(5000, 'first');

      // First class takes up 4x the space, so 4x the emissions
      const ratio = first.totalKg / economy.totalKg;
      expect(ratio).toBeGreaterThan(3.5);
      expect(ratio).toBeLessThan(4.5);
    });

    test('Modern efficient aircraft reduces emissions', () => {
      const oldAircraft = calculateFlightCarbon(5000, 'economy', 'Airbus A340');
      const newAircraft = calculateFlightCarbon(5000, 'economy', 'Airbus A350');

      // A350 is 15% more efficient than baseline
      // A340 is 15% less efficient
      expect(newAircraft.totalKg).toBeLessThan(oldAircraft.totalKg);

      const reduction = (oldAircraft.totalKg - newAircraft.totalKg) / oldAircraft.totalKg;
      expect(reduction).toBeGreaterThan(0.20); // At least 20% reduction
    });

    test('Complete trip with offset prices', () => {
      const outbound = calculateFlightCarbon(5585, 'economy'); // NYC-London
      const return_ = calculateFlightCarbon(5585, 'economy'); // London-NYC

      const totalCarbon = calculateTotalCarbon([
        { distanceKm: 5585, cabinClass: 'economy' },
        { distanceKm: 5585, cabinClass: 'economy' },
      ]);

      const offsetPrices = getOffsetPrice(totalCarbon.totalTons);

      expect(totalCarbon.totalKg).toBe(outbound.totalKg + return_.totalKg);
      expect(offsetPrices.average).toBeGreaterThan(20); // Should be $20+ for round trip
      expect(offsetPrices.average).toBeLessThan(50);
    });
  });

  describe('Edge cases', () => {
    test('very short flight (< 100 km)', () => {
      const result = calculateFlightCarbon(50, 'economy');

      expect(result.totalKg).toBeGreaterThan(0);
      expect(result.equivalents.treesNeeded).toBeGreaterThan(0);
    });

    test('ultra long-haul flight (> 15000 km)', () => {
      const result = calculateFlightCarbon(15000, 'economy');

      expect(result.totalKg).toBeGreaterThan(1000);
      expect(result.totalTons).toBeGreaterThan(1);
    });

    test('unknown aircraft type defaults to 1.0 multiplier', () => {
      const standard = calculateFlightCarbon(1000, 'economy');
      const unknown = calculateFlightCarbon(1000, 'economy', 'Unknown Aircraft XYZ');

      expect(unknown.totalKg).toBe(standard.totalKg);
    });

    test('aircraft type matching is case insensitive', () => {
      const upper = calculateFlightCarbon(1000, 'economy', 'BOEING 787');
      const lower = calculateFlightCarbon(1000, 'economy', 'boeing 787');
      const mixed = calculateFlightCarbon(1000, 'economy', 'Boeing 787');

      expect(upper.totalKg).toBe(lower.totalKg);
      expect(lower.totalKg).toBe(mixed.totalKg);
    });

    test('partial aircraft name matching works', () => {
      const full = calculateFlightCarbon(1000, 'economy', 'Boeing 787');
      const partial = calculateFlightCarbon(1000, 'economy', 'Boeing 787 Dreamliner');

      expect(partial.totalKg).toBe(full.totalKg);
    });
  });
});
