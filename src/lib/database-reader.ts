/**
 * Database Reader - Read ALL existing aviation data
 *
 * Queries existing database tables to get ALL entities that need jetlag rankings.
 * No hardcoded lists - everything is database-driven.
 */

import { getDb } from './db';
import { airlines, airports, aircraftTypes, routes } from '../app/schema/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';

export interface AirlineRow {
  id: string;
  airlineName: string;
  iataCode: string | null;
  icaoCode: string | null;
  countryName: string | null;
  countryIso2: string | null;
  isActive: boolean | null;
}

export interface AirportRow {
  id: string;
  name: string;
  iataCode: string | null;
  icaoCode: string | null;
  cityName: string | null;
  countryName: string | null;
  countryIso2: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean | null;
}

export interface AircraftTypeRow {
  id: string;
  aircraftName: string;
  iataCode: string | null;
}

export interface RouteRow {
  departureIata: string;
  arrivalIata: string;
  departureTimezone: string;
  arrivalTimezone: string;
  avgDurationMinutes: number;
  flightCount: number;
}

export class DatabaseReader {
  private db;

  constructor() {
    this.db = getDb();
  }

  /**
   * Read ALL active airlines from database
   */
  async readAllAirlines(): Promise<AirlineRow[]> {
    console.log('📖 Reading airlines from database...');

    const results = await this.db
      .select({
        id: airlines.id,
        airlineName: airlines.airlineName,
        iataCode: airlines.iataCode,
        icaoCode: airlines.icaoCode,
        countryName: airlines.countryName,
        countryIso2: airlines.countryIso2,
        isActive: airlines.isActive,
      })
      .from(airlines)
      .where(eq(airlines.isActive, true))
      .orderBy(airlines.airlineName);

    console.log(`   Found ${results.length} active airlines`);
    return results;
  }

  /**
   * Read ALL active airports from database
   */
  async readAllAirports(): Promise<AirportRow[]> {
    console.log('📖 Reading airports from database...');

    const results = await this.db
      .select({
        id: airports.id,
        name: airports.name,
        iataCode: airports.iataCode,
        icaoCode: airports.icaoCode,
        cityName: airports.cityName,
        countryName: airports.countryName,
        countryIso2: airports.countryIso2,
        timezone: airports.timezone,
        latitude: airports.latitude,
        longitude: airports.longitude,
        isActive: airports.isActive,
      })
      .from(airports)
      .where(eq(airports.isActive, true))
      .orderBy(airports.countryName, airports.cityName);

    console.log(`   Found ${results.length} active airports`);
    return results;
  }

  /**
   * Read ALL aircraft types from database
   */
  async readAllAircraftTypes(): Promise<AircraftTypeRow[]> {
    console.log('📖 Reading aircraft types from database...');

    const results = await this.db
      .select({
        id: aircraftTypes.id,
        aircraftName: aircraftTypes.aircraftName,
        iataCode: aircraftTypes.iataCode,
      })
      .from(aircraftTypes)
      .orderBy(aircraftTypes.aircraftName);

    console.log(`   Found ${results.length} aircraft types`);
    return results;
  }

  /**
   * Read common flight routes from database
   * Based on actual routes in the routes table
   */
  async readCommonRoutes(options: {
    limit?: number;
    minFlightCount?: number;
  } = {}): Promise<RouteRow[]> {
    const { limit = 1000, minFlightCount = 5 } = options;

    console.log('📖 Reading common routes from database...');

    // Query routes table and count frequency
    const results = await this.db
      .select({
        departureIata: routes.departureIata,
        arrivalIata: routes.arrivalIata,
        departureTimezone: routes.departureTimezone,
        arrivalTimezone: routes.arrivalTimezone,
        // Estimate average duration from the estimatedDurationMinutes field
        avgDurationMinutes: sql<number>`CAST(AVG(CAST(${routes.estimatedDurationMinutes} AS INTEGER)) AS INTEGER)`,
        flightCount: sql<number>`COUNT(*)`,
      })
      .from(routes)
      .where(
        and(
          sql`${routes.departureIata} IS NOT NULL`,
          sql`${routes.arrivalIata} IS NOT NULL`,
          sql`${routes.departureTimezone} IS NOT NULL`,
          sql`${routes.arrivalTimezone} IS NOT NULL`,
          sql`${routes.estimatedDurationMinutes} IS NOT NULL`
        )
      )
      .groupBy(
        routes.departureIata,
        routes.arrivalIata,
        routes.departureTimezone,
        routes.arrivalTimezone
      )
      .having(sql`COUNT(*) >= ${minFlightCount}`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    console.log(`   Found ${results.length} common routes (min ${minFlightCount} flights each)`);
    return results as RouteRow[];
  }

  /**
   * Get database statistics - how many entities need augmentation
   */
  async getStatistics(): Promise<{
    airlines: number;
    airports: number;
    aircraftTypes: number;
    routes: number;
  }> {
    console.log('📊 Gathering database statistics...');

    const [airlinesCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(airlines)
      .where(eq(airlines.isActive, true));

    const [airportsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(airports)
      .where(eq(airports.isActive, true));

    const [aircraftTypesCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(aircraftTypes);

    // Count distinct routes
    const [routesCount] = await this.db
      .select({ count: sql<number>`count(DISTINCT ${routes.departureIata} || '-' || ${routes.arrivalIata})` })
      .from(routes)
      .where(
        and(
          sql`${routes.departureIata} IS NOT NULL`,
          sql`${routes.arrivalIata} IS NOT NULL`
        )
      );

    const stats = {
      airlines: Number(airlinesCount?.count || 0),
      airports: Number(airportsCount?.count || 0),
      aircraftTypes: Number(aircraftTypesCount?.count || 0),
      routes: Number(routesCount?.count || 0),
    };

    console.log('');
    console.log('   Airlines:       ', stats.airlines.toLocaleString());
    console.log('   Airports:       ', stats.airports.toLocaleString());
    console.log('   Aircraft Types: ', stats.aircraftTypes.toLocaleString());
    console.log('   Routes:         ', stats.routes.toLocaleString());
    console.log('');

    return stats;
  }

  /**
   * Filter airlines by criteria
   */
  async filterAirlines(criteria: {
    country?: string | string[];
    hasIataCode?: boolean;
  }): Promise<AirlineRow[]> {
    let query = this.db
      .select({
        id: airlines.id,
        airlineName: airlines.airlineName,
        iataCode: airlines.iataCode,
        icaoCode: airlines.icaoCode,
        countryName: airlines.countryName,
        countryIso2: airlines.countryIso2,
        isActive: airlines.isActive,
      })
      .from(airlines)
      .where(eq(airlines.isActive, true));

    // Apply country filter
    if (criteria.country) {
      const countries = Array.isArray(criteria.country) ? criteria.country : [criteria.country];
      query = query.where(
        sql`${airlines.countryIso2} IN (${sql.join(countries.map(c => sql`${c}`), sql`, `)})`
      );
    }

    // Apply IATA code filter
    if (criteria.hasIataCode) {
      query = query.where(sql`${airlines.iataCode} IS NOT NULL`);
    }

    const results = await query.orderBy(airlines.airlineName);
    return results;
  }

  /**
   * Filter airports by criteria
   */
  async filterAirports(criteria: {
    country?: string | string[];
    hasIataCode?: boolean;
  }): Promise<AirportRow[]> {
    let query = this.db
      .select({
        id: airports.id,
        name: airports.name,
        iataCode: airports.iataCode,
        icaoCode: airports.icaoCode,
        cityName: airports.cityName,
        countryName: airports.countryName,
        countryIso2: airports.countryIso2,
        timezone: airports.timezone,
        latitude: airports.latitude,
        longitude: airports.longitude,
        isActive: airports.isActive,
      })
      .from(airports)
      .where(eq(airports.isActive, true));

    // Apply country filter
    if (criteria.country) {
      const countries = Array.isArray(criteria.country) ? criteria.country : [criteria.country];
      query = query.where(
        sql`${airports.countryIso2} IN (${sql.join(countries.map(c => sql`${c}`), sql`, `)})`
      );
    }

    // Apply IATA code filter
    if (criteria.hasIataCode) {
      query = query.where(sql`${airports.iataCode} IS NOT NULL`);
    }

    const results = await query.orderBy(airports.countryName, airports.cityName);
    return results;
  }
}
