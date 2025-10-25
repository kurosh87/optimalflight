/**
 * FlightOptima Database Schema
 * Using Drizzle ORM with PostgreSQL + NextAuth
 */

import { pgTable, serial, text, varchar, real, integer, boolean, json, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

/**
 * NextAuth Tables
 * Required for authentication with Drizzle adapter
 */
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

/**
 * Airports Table
 * Core reference data for all airports worldwide
 */
export const airports = pgTable('airports', {
  id: serial('id').primaryKey(),
  iata: varchar('iata', { length: 3 }).notNull().unique(), // SFO, JFK, etc.
  icao: varchar('icao', { length: 4 }).notNull().unique(), // KSFO, KJFK, etc.
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: varchar('country', { length: 2 }).notNull(), // ISO 2-letter country code
  timezone: text('timezone').notNull(), // IANA timezone
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  altitude: real('altitude').notNull(), // meters above sea level
  // Metadata
  connectivity: integer('connectivity').default(0), // number of routes
  jetlagFacilities: json('jetlag_facilities').$type<{
    sleepPods: boolean;
    quietZones: boolean;
    showers: boolean;
    spas: boolean;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  iataIdx: index('airport_iata_idx').on(table.iata),
  countryIdx: index('airport_country_idx').on(table.country),
  // PostGIS will be used for geospatial queries in production
}));

/**
 * Airlines Table
 * Reference data for all airlines
 */
export const airlines = pgTable('airlines', {
  id: serial('id').primaryKey(),
  iata: varchar('iata', { length: 2 }).notNull().unique(), // UA, AA, etc.
  icao: varchar('icao', { length: 3 }).notNull().unique(), // UAL, AAL, etc.
  name: text('name').notNull(),
  country: varchar('country', { length: 2 }).notNull(),
  alliance: varchar('alliance', { length: 20 }), // Star Alliance, OneWorld, SkyTeam
  fleetSize: integer('fleet_size'),
  // Service metrics
  serviceRating: real('service_rating'), // 1-10
  onTimePerformance: real('on_time_performance'), // 0-100
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  iataIdx: index('airline_iata_idx').on(table.iata),
  allianceIdx: index('airline_alliance_idx').on(table.alliance),
}));

/**
 * Aircraft Table
 * Aircraft types with comfort metrics
 */
export const aircraft = pgTable('aircraft', {
  id: serial('id').primaryKey(),
  icao: varchar('icao', { length: 4 }).notNull().unique(), // B77W, A388, etc.
  name: text('name').notNull(),
  manufacturer: text('manufacturer').notNull(),
  // Comfort metrics for jetlag
  cabinPressure: integer('cabin_pressure'), // altitude equivalent in feet
  humidity: real('humidity'), // percentage
  seatPitch: json('seat_pitch').$type<{
    economy: number;
    premiumEconomy: number;
    business: number;
    first: number;
  }>(),
  jetlagComfortScore: real('jetlag_comfort_score'), // 1-10
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  icaoIdx: index('aircraft_icao_idx').on(table.icao),
}));

/**
 * Routes Table
 * Pre-calculated routes between airports
 */
export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  originIata: varchar('origin_iata', { length: 3 }).notNull(),
  destinationIata: varchar('destination_iata', { length: 3 }).notNull(),
  airlineIata: varchar('airline_iata', { length: 2 }).notNull(),
  // Route metrics
  distance: integer('distance').notNull(), // in km
  duration: integer('duration').notNull(), // in minutes
  frequency: integer('frequency'), // flights per week
  aircraftTypes: json('aircraft_types').$type<string[]>(), // array of aircraft ICAO codes
  // Jetlag data
  timeZonesCrossed: real('time_zones_crossed'),
  direction: varchar('direction', { length: 20 }), // eastbound, westbound, etc.
  jetlagScore: real('jetlag_score'), // 1-10
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  originIdx: index('route_origin_idx').on(table.originIata),
  destinationIdx: index('route_destination_idx').on(table.destinationIata),
  airlineIdx: index('route_airline_idx').on(table.airlineIata),
  // Composite index for quick route lookups
  routeIdx: index('route_lookup_idx').on(table.originIata, table.destinationIata),
}));

/**
 * User Search History
 * Track searches for analytics and personalization
 */
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id'), // nullable for anonymous users
  searchId: text('search_id').notNull().unique(),
  origin: varchar('origin', { length: 3 }).notNull(),
  destination: varchar('destination', { length: 3 }).notNull(),
  departureDate: text('departure_date').notNull(),
  returnDate: text('return_date'),
  passengers: json('passengers').$type<{
    adults: number;
    children: number;
    infants: number;
  }>().notNull(),
  cabinClass: varchar('cabin_class', { length: 20 }).notNull(),
  filters: json('filters'),
  resultsCount: integer('results_count'),
  searchTime: integer('search_time'), // ms
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('search_user_idx').on(table.userId),
  routeIdx: index('search_route_idx').on(table.origin, table.destination),
  createdAtIdx: index('search_created_at_idx').on(table.createdAt),
}));

/**
 * Saved Routes
 * User's favorite/bookmarked routes
 */
export const savedRoutes = pgTable('saved_routes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name'),
  origin: varchar('origin', { length: 3 }).notNull(),
  destination: varchar('destination', { length: 3 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('saved_user_idx').on(table.userId),
}));

/**
 * Price Alerts
 * User-configured price monitoring
 */
export const priceAlerts = pgTable('price_alerts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  origin: varchar('origin', { length: 3 }).notNull(),
  destination: varchar('destination', { length: 3 }).notNull(),
  targetPrice: real('target_price').notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  active: boolean('active').default(true),
  lastChecked: timestamp('last_checked'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('alert_user_idx').on(table.userId),
  activeIdx: index('alert_active_idx').on(table.active),
}));

// Type exports for use in application code

// Auth types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

// Aviation types
export type Airport = typeof airports.$inferSelect;
export type NewAirport = typeof airports.$inferInsert;

export type Airline = typeof airlines.$inferSelect;
export type NewAirline = typeof airlines.$inferInsert;

export type Aircraft = typeof aircraft.$inferSelect;
export type NewAircraft = typeof aircraft.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;

export type SavedRoute = typeof savedRoutes.$inferSelect;
export type NewSavedRoute = typeof savedRoutes.$inferInsert;

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type NewPriceAlert = typeof priceAlerts.$inferInsert;
