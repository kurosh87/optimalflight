/**
 * Jetlag Data Enrichment Service
 *
 * Enriches Kiwi API flight search results with our database jetlag rankings:
 * - Aircraft rankings (cabin pressure, humidity, comfort scores)
 * - Airline service rankings (sleep kits, meal timing, jetlag programs)
 * - Airport jetlag facilities (sleep pods, quiet zones, recovery amenities)
 * - Route optimization data (optimal timing, difficulty scores)
 */

import { db } from '@/lib/db';
import {
  aircraftRankings,
  airlineServiceRankings,
  airportJetlagFacilities,
  routeOptimization,
  airports,
  airlines,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface EnrichedAircraftData {
  code: string;
  name: string | null;
  manufacturer: string | null;
  model: string | null;
  jetlagBaseScore: number | null;
  comfortScore: number | null;
  overallScore: number | null;
  cabinPressureAltitudeFeet: number | null;
  humidityPercent: number | null;
  noiseLevelDb: number | null;
  typicalSeatPitchInches: number | null;
}

export interface EnrichedAirlineData {
  code: string;
  name: string | null;
  serviceScore: number | null;
  reliabilityScore: number | null;
  jetlagAwarenessScore: number | null;
  overallScore: number | null;
  providesSleepKits: boolean | null;
  offersJetlagMenu: boolean | null;
  sleepOptimizationPrograms: boolean | null;
  mealTimingFlexibility: boolean | null;
  onTimePerformancePercent: number | null;
}

export interface EnrichedAirportData {
  code: string;
  name: string | null;
  comfortScore: number | null;
  stressScore: number | null;
  jetlagSupportScore: number | null;
  overallScore: number | null;
  hasSleepPods: boolean | null;
  hasQuietZones: boolean | null;
  hasShowerFacilities: boolean | null;
  hasHealthyFoodOptions: boolean | null;
  hasExerciseFacilities: boolean | null;
  hasMeditationRooms: boolean | null;
  averageSecurityWaitMinutes: number | null;
  noiseLevel: string | null;
}

export interface EnrichedRouteData {
  origin: string;
  destination: string;
  inherentJetlagDifficulty: number | null;
  optimalDepartureTimes: string | null;
  recommendedPreAdjustmentDays: number | null;
  direction: string | null;
  timezoneChange: number | null;
}

export interface EnrichedSegmentData {
  aircraft: EnrichedAircraftData | null;
  airline: EnrichedAirlineData | null;
  originAirport: EnrichedAirportData | null;
  destinationAirport: EnrichedAirportData | null;
  route: EnrichedRouteData | null;
}

export class JetlagEnrichmentService {
  private aircraftCache = new Map<string, EnrichedAircraftData | null>();
  private airlineCache = new Map<string, EnrichedAirlineData | null>();
  private airportCache = new Map<string, EnrichedAirportData | null>();
  private routeCache = new Map<string, EnrichedRouteData | null>();

  /**
   * Enrich flight segment with jetlag data from database
   */
  async enrichSegment(segment: {
    equipment?: string;
    airline: string;
    flyFrom: string;
    flyTo: string;
  }): Promise<EnrichedSegmentData> {
    const [aircraft, airline, originAirport, destinationAirport, route] = await Promise.all([
      segment.equipment ? this.getAircraftData(segment.equipment) : Promise.resolve(null),
      this.getAirlineData(segment.airline),
      this.getAirportData(segment.flyFrom),
      this.getAirportData(segment.flyTo),
      this.getRouteData(segment.flyFrom, segment.flyTo),
    ]);

    return {
      aircraft,
      airline,
      originAirport,
      destinationAirport,
      route,
    };
  }

  /**
   * Get aircraft ranking data by IATA code
   */
  private async getAircraftData(iataCode: string): Promise<EnrichedAircraftData | null> {
    if (this.aircraftCache.has(iataCode)) {
      return this.aircraftCache.get(iataCode)!;
    }

    try {
      const result = await db
        .select()
        .from(aircraftRankings)
        .where(eq(aircraftRankings.iataCode, iataCode))
        .limit(1);

      const data: EnrichedAircraftData | null = result[0]
        ? {
            code: iataCode,
            name: result[0].name,
            manufacturer: result[0].manufacturer,
            model: result[0].model,
            jetlagBaseScore: result[0].jetlagBaseScore,
            comfortScore: result[0].comfortScore,
            overallScore: result[0].overallScore,
            cabinPressureAltitudeFeet: result[0].cabinPressureAltitudeFeet,
            humidityPercent: result[0].humidityPercent,
            noiseLevelDb: result[0].noiseLevelDb,
            typicalSeatPitchInches: result[0].typicalSeatPitchInches,
          }
        : null;

      this.aircraftCache.set(iataCode, data);
      return data;
    } catch (error) {
      console.error(`[Enrichment] Error fetching aircraft data for ${iataCode}:`, error);
      this.aircraftCache.set(iataCode, null);
      return null;
    }
  }

  /**
   * Get airline service ranking by IATA code
   */
  private async getAirlineData(iataCode: string): Promise<EnrichedAirlineData | null> {
    if (this.airlineCache.has(iataCode)) {
      return this.airlineCache.get(iataCode)!;
    }

    try {
      const result = await db
        .select()
        .from(airlineServiceRankings)
        .where(eq(airlineServiceRankings.iataCode, iataCode))
        .limit(1);

      const data: EnrichedAirlineData | null = result[0]
        ? {
            code: iataCode,
            name: result[0].airlineName,
            serviceScore: result[0].serviceScore,
            reliabilityScore: result[0].reliabilityScore,
            jetlagAwarenessScore: result[0].jetlagAwarenessScore,
            overallScore: result[0].overallScore,
            providesSleepKits: result[0].providesSleepKits,
            offersJetlagMenu: result[0].offersJetlagMenu,
            sleepOptimizationPrograms: result[0].sleepOptimizationPrograms,
            mealTimingFlexibility: result[0].mealTimingFlexibility,
            onTimePerformancePercent: result[0].onTimePerformancePercent,
          }
        : null;

      this.airlineCache.set(iataCode, data);
      return data;
    } catch (error) {
      console.error(`[Enrichment] Error fetching airline data for ${iataCode}:`, error);
      this.airlineCache.set(iataCode, null);
      return null;
    }
  }

  /**
   * Get airport jetlag facilities by IATA code
   */
  private async getAirportData(iataCode: string): Promise<EnrichedAirportData | null> {
    if (this.airportCache.has(iataCode)) {
      return this.airportCache.get(iataCode)!;
    }

    try {
      // Get airport name first
      const airportResult = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, iataCode))
        .limit(1);

      // Get facilities data
      const facilityResult = await db
        .select()
        .from(airportJetlagFacilities)
        .where(eq(airportJetlagFacilities.iataCode, iataCode))
        .limit(1);

      const data: EnrichedAirportData | null = facilityResult[0]
        ? {
            code: iataCode,
            name: airportResult[0]?.airportName || null,
            comfortScore: facilityResult[0].comfortScore,
            stressScore: facilityResult[0].stressScore,
            jetlagSupportScore: facilityResult[0].jetlagSupportScore,
            overallScore: facilityResult[0].overallScore,
            hasSleepPods: facilityResult[0].hasSleepPods,
            hasQuietZones: facilityResult[0].hasQuietZones,
            hasShowerFacilities: facilityResult[0].hasShowerFacilities,
            hasHealthyFoodOptions: facilityResult[0].hasHealthyFoodOptions,
            hasExerciseFacilities: facilityResult[0].hasExerciseFacilities,
            hasMeditationRooms: facilityResult[0].hasMeditationRooms,
            averageSecurityWaitMinutes: facilityResult[0].averageSecurityWaitMinutes,
            noiseLevel: facilityResult[0].noiseLevel,
          }
        : null;

      this.airportCache.set(iataCode, data);
      return data;
    } catch (error) {
      console.error(`[Enrichment] Error fetching airport data for ${iataCode}:`, error);
      this.airportCache.set(iataCode, null);
      return null;
    }
  }

  /**
   * Get route optimization data by origin/destination pair
   */
  private async getRouteData(
    originCode: string,
    destinationCode: string
  ): Promise<EnrichedRouteData | null> {
    const routeKey = `${originCode}-${destinationCode}`;
    if (this.routeCache.has(routeKey)) {
      return this.routeCache.get(routeKey)!;
    }

    try {
      const result = await db
        .select()
        .from(routeOptimization)
        .where(
          and(
            eq(routeOptimization.originIataCode, originCode),
            eq(routeOptimization.destinationIataCode, destinationCode)
          )
        )
        .limit(1);

      const data: EnrichedRouteData | null = result[0]
        ? {
            origin: originCode,
            destination: destinationCode,
            inherentJetlagDifficulty: result[0].inherentJetlagDifficulty,
            optimalDepartureTimes: result[0].optimalDepartureTimes,
            recommendedPreAdjustmentDays: result[0].recommendedPreAdjustmentDays,
            direction: result[0].direction,
            timezoneChange: result[0].timeZoneDifferenceHours,
          }
        : null;

      this.routeCache.set(routeKey, data);
      return data;
    } catch (error) {
      console.error(
        `[Enrichment] Error fetching route data for ${originCode}-${destinationCode}:`,
        error
      );
      this.routeCache.set(routeKey, null);
      return null;
    }
  }

  /**
   * Generate recommendations based on enriched data
   */
  generateRecommendations(enrichedData: EnrichedSegmentData[]): string[] {
    const recommendations: string[] = [];

    // Aircraft recommendations
    const aircraftScores = enrichedData
      .map((s) => s.aircraft?.overallScore)
      .filter((s) => s !== null) as number[];
    if (aircraftScores.length > 0) {
      const avgAircraftScore = aircraftScores.reduce((a, b) => a + b, 0) / aircraftScores.length;
      if (avgAircraftScore < 6) {
        recommendations.push('⚠️ Some aircraft on this route have below-average jetlag performance');
      } else if (avgAircraftScore > 8) {
        recommendations.push('✅ Excellent aircraft choices - modern fleet with low cabin pressure');
      }
    }

    // Airline recommendations
    const airlineWithSleepKits = enrichedData.find(
      (s) => s.airline?.providesSleepKits === true
    );
    if (airlineWithSleepKits) {
      recommendations.push('✅ Airline provides sleep kits to help with rest');
    }

    const airlineWithJetlagMenu = enrichedData.find(
      (s) => s.airline?.offersJetlagMenu === true
    );
    if (airlineWithJetlagMenu) {
      recommendations.push('✅ Airline offers jetlag-optimized meal timing');
    }

    // Airport recommendations
    const airportWithSleepPods = enrichedData.find(
      (s) => s.originAirport?.hasSleepPods === true || s.destinationAirport?.hasSleepPods === true
    );
    if (airportWithSleepPods) {
      recommendations.push('✅ Airports have sleep pods available for rest during layovers');
    }

    const airportWithShowers = enrichedData.find(
      (s) =>
        s.originAirport?.hasShowerFacilities === true ||
        s.destinationAirport?.hasShowerFacilities === true
    );
    if (airportWithShowers) {
      recommendations.push('💧 Shower facilities available at airports for refreshing');
    }

    // Route recommendations
    const difficultRoutes = enrichedData.filter(
      (s) => s.route?.inherentJetlagDifficulty && s.route.inherentJetlagDifficulty > 7
    );
    if (difficultRoutes.length > 0) {
      recommendations.push(
        `⚠️ ${difficultRoutes.length} segment(s) have high inherent jetlag difficulty`
      );
    }

    return recommendations;
  }

  /**
   * Calculate overall enriched jetlag score
   */
  calculateEnrichedScore(enrichedData: EnrichedSegmentData[]): number {
    let totalScore = 0;
    let scoreCount = 0;

    enrichedData.forEach((segment) => {
      // Aircraft score (weight: 30%)
      if (segment.aircraft?.overallScore) {
        totalScore += segment.aircraft.overallScore * 0.3;
        scoreCount += 0.3;
      }

      // Airline score (weight: 25%)
      if (segment.airline?.overallScore) {
        totalScore += segment.airline.overallScore * 0.25;
        scoreCount += 0.25;
      }

      // Airport scores (weight: 20% each for origin/dest)
      if (segment.originAirport?.overallScore) {
        totalScore += segment.originAirport.overallScore * 0.1;
        scoreCount += 0.1;
      }
      if (segment.destinationAirport?.overallScore) {
        totalScore += segment.destinationAirport.overallScore * 0.1;
        scoreCount += 0.1;
      }

      // Route difficulty (weight: 25%, inverted - lower difficulty = higher score)
      if (segment.route?.inherentJetlagDifficulty) {
        const routeScore = 10 - segment.route.inherentJetlagDifficulty;
        totalScore += routeScore * 0.25;
        scoreCount += 0.25;
      }
    });

    return scoreCount > 0 ? totalScore / scoreCount : 0;
  }
}

// Singleton instance
export const jetlagEnrichment = new JetlagEnrichmentService();
