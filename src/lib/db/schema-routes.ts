/**
 * FlightConnections-Style Route Database Schema
 * For route visualization and exploration
 */

import { pgTable, serial, text, varchar, integer, boolean, timestamp, decimal, time, date, index, primaryKey } from 'drizzle-orm/pg-core';

// ============================================================================
// ALLIANCES TABLE
// ============================================================================

export const alliances = pgTable("alliances", {
  allianceId: serial("alliance_id").primaryKey(),
  allianceName: varchar("alliance_name", { length: 100 }).notNull(), // 'Star Alliance', 'Oneworld', 'SkyTeam'
  allianceCode: varchar("alliance_code", { length: 20 }).unique(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// ENHANCED AIRPORTS TABLE (FlightConnections style)
// ============================================================================

export const airportsEnhanced = pgTable("airports_enhanced", {
  airportId: serial("airport_id").primaryKey(),
  iataCode: varchar("iata_code", { length: 3 }).unique().notNull(),
  icaoCode: varchar("icao_code", { length: 4 }),
  airportName: varchar("airport_name", { length: 255 }).notNull(),
  cityName: varchar("city_name", { length: 255 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  countryName: varchar("country_name", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  timezone: varchar("timezone", { length: 50 }),
  airportSizeCategory: varchar("airport_size_category", { length: 20 }), // 'large', 'medium', 'small'
  totalDestinationsCount: integer("total_destinations_count").default(0),
}, (table) => ({
  iataIdx: index("airports_enhanced_iata_idx").on(table.iataCode),
  countryIdx: index("airports_enhanced_country_idx").on(table.countryCode),
  sizeIdx: index("airports_enhanced_size_idx").on(table.airportSizeCategory),
}));

// ============================================================================
// ENHANCED AIRLINES TABLE (FlightConnections style)
// ============================================================================

export const airlinesEnhanced = pgTable("airlines_enhanced", {
  airlineId: serial("airline_id").primaryKey(),
  airlineName: varchar("airline_name", { length: 255 }).notNull(),
  iataCode: varchar("iata_code", { length: 2 }).unique().notNull(),
  icaoCode: varchar("icao_code", { length: 3 }),
  allianceId: integer("alliance_id").references(() => alliances.allianceId),
  country: varchar("country", { length: 255 }),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  iataIdx: index("airlines_enhanced_iata_idx").on(table.iataCode),
  allianceIdx: index("airlines_enhanced_alliance_idx").on(table.allianceId),
  activeIdx: index("airlines_enhanced_active_idx").on(table.isActive),
}));

// ============================================================================
// ROUTES TABLE (FlightConnections core)
// ============================================================================

export const routesEnhanced = pgTable("routes_enhanced", {
  routeId: serial("route_id").primaryKey(),
  originAirportId: integer("origin_airport_id").notNull().references(() => airportsEnhanced.airportId),
  destinationAirportId: integer("destination_airport_id").notNull().references(() => airportsEnhanced.airportId),
  airlineId: integer("airline_id").notNull().references(() => airlinesEnhanced.airlineId),
  distanceMiles: integer("distance_miles"),
  distanceKm: integer("distance_km"),
  flightDurationMinutes: integer("flight_duration_minutes"),

  // Seasonal data
  isSeasonal: boolean("is_seasonal").default(false),
  seasonalStartMonth: integer("seasonal_start_month"), // 1-12
  seasonalEndMonth: integer("seasonal_end_month"), // 1-12

  // Frequency
  frequencyPerWeek: integer("frequency_per_week"),
  frequencyPerMonth: integer("frequency_per_month"),

  // Status
  status: varchar("status", { length: 50 }).default('operational'), // 'operational', 'announced', 'seasonal_inactive'
  isAnnouncedFuture: boolean("is_announced_future").default(false),

  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  originIdx: index("routes_enhanced_origin_idx").on(table.originAirportId),
  destIdx: index("routes_enhanced_dest_idx").on(table.destinationAirportId),
  airlineIdx: index("routes_enhanced_airline_idx").on(table.airlineId),
  originDestIdx: index("routes_enhanced_origin_dest_idx").on(table.originAirportId, table.destinationAirportId),
  statusIdx: index("routes_enhanced_status_idx").on(table.status),
  seasonalIdx: index("routes_enhanced_seasonal_idx").on(table.isSeasonal),
}));

// ============================================================================
// FLIGHT SCHEDULES TABLE
// ============================================================================

export const flightSchedules = pgTable("flight_schedules", {
  scheduleId: serial("schedule_id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routesEnhanced.routeId),
  departureTime: time("departure_time"),
  arrivalTime: time("arrival_time"),
  flightNumber: varchar("flight_number", { length: 10 }),
  operatingDays: varchar("operating_days", { length: 7 }), // SMTWTFS bitmap: '1010101' = Mon/Wed/Fri
  validFromDate: date("valid_from_date").notNull(),
  validToDate: date("valid_to_date").notNull(),
  aircraftType: varchar("aircraft_type", { length: 100 }),
}, (table) => ({
  routeIdx: index("schedules_route_idx").on(table.routeId),
  validDatesIdx: index("schedules_valid_dates_idx").on(table.validFromDate, table.validToDate),
  flightNumIdx: index("schedules_flight_num_idx").on(table.flightNumber),
}));

// ============================================================================
// ROUTE AIRCRAFT TYPES (Many-to-Many Junction)
// ============================================================================

export const routeAircraftTypes = pgTable("route_aircraft_types", {
  routeId: integer("route_id").notNull().references(() => routesEnhanced.routeId),
  aircraftType: varchar("aircraft_type", { length: 100 }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.routeId, table.aircraftType] }),
  routeIdx: index("route_aircraft_route_idx").on(table.routeId),
  aircraftIdx: index("route_aircraft_type_idx").on(table.aircraftType),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Alliance = typeof alliances.$inferSelect;
export type NewAlliance = typeof alliances.$inferInsert;

export type AirportEnhanced = typeof airportsEnhanced.$inferSelect;
export type NewAirportEnhanced = typeof airportsEnhanced.$inferInsert;

export type AirlineEnhanced = typeof airlinesEnhanced.$inferSelect;
export type NewAirlineEnhanced = typeof airlinesEnhanced.$inferInsert;

export type RouteEnhanced = typeof routesEnhanced.$inferSelect;
export type NewRouteEnhanced = typeof routesEnhanced.$inferInsert;

export type FlightSchedule = typeof flightSchedules.$inferSelect;
export type NewFlightSchedule = typeof flightSchedules.$inferInsert;

export type RouteAircraftType = typeof routeAircraftTypes.$inferSelect;
export type NewRouteAircraftType = typeof routeAircraftTypes.$inferInsert;
