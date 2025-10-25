/**
 * FlightOptima Complete Database Schema
 * Integrated from jetlag-revweb + NextAuth + FlightOptima features
 */

import {
  pgTable,
  serial,
  text,
  varchar,
  real,
  integer,
  bigint,
  boolean,
  json,
  timestamp,
  index,
  primaryKey,
  doublePrecision
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// ============================================================================
// NEXTAUTH TABLES
// ============================================================================

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  stripeIdx: index('users_stripe_idx').on(table.stripeCustomerId),
}));

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

// ============================================================================
// AVIATION DATA TABLES (from jetlag-revweb)
// ============================================================================

export const airports = pgTable("airports", {
  id: text("id").primaryKey(),
  airportName: text("airport_name").notNull(),
  iataCode: text("iata_code"),
  icaoCode: text("icao_code"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  timezone: text("timezone"),
  gmtOffset: text("gmt_offset"),
  countryName: text("country_name"),
  countryIso2: text("country_iso2"),
  cityId: text("city_id"),
  isActive: boolean("is_active").default(true),
  // Airport images
  imageUrl: text("image_url"),
  imageMetadata: text("image_metadata"), // JSON
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const airportIntelligence = pgTable("airport_intelligence", {
  id: text("id").primaryKey(),
  airportId: text("airport_id").references(() => airports.id),
  iataCode: text("iata_code"),
  airportSummary: text("airport_summary"),
  ownerOperator: text("owner_operator"),
  locationDetails: text("location_details"),
  hubAirlines: text("hub_airlines"),
  focusCities: text("focus_cities"),
  operatingBases: text("operating_bases"),
  runwayInformation: text("runway_information"),
  terminalInformation: text("terminal_information"),
  airportFacts: text("airport_facts"),
  operatingStatistics: text("operating_statistics"),
  completenessScore: doublePrecision("completeness_score"),
  processingStatus: text("processing_status"),
  // Jetlag Recovery Intelligence
  jetlagRecoveryData: text("jetlag_recovery_data"), // JSON
  lightExposureData: text("light_exposure_data"), // JSON
  diningData: text("dining_data"), // JSON
  loungesData: text("lounges_data"), // JSON
  transportationData: text("transportation_data"), // JSON
  servicesData: text("services_data"), // JSON
  navigationData: text("navigation_data"), // JSON
  dataSources: text("data_sources"), // JSON
  tierPriority: text("tier_priority"), // tier_1, tier_2, tier_3, tier_4
  dataQuality: text("data_quality").default("minimal"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const airportData = pgTable("airport_data", {
  id: text("id").primaryKey(),
  iataCode: text("iata_code").unique().notNull(),
  airportId: text("airport_id").references(() => airports.id),
  tier: text("tier").notNull(), // tier_1, tier_2, tier_3
  connectionComplexityScore: integer("connection_complexity_score"),
  minimumConnectionTimeMinutes: integer("minimum_connection_time_minutes"),
  connectionChallenges: text("connection_challenges"),
  connectionTips: text("connection_tips"),
  loungesData: text("lounges_data"),
  loungeQualityScore: integer("lounge_quality_score"),
  bestLoungeForJetlag: text("best_lounge_for_jetlag"),
  jetlagRecoveryData: text("jetlag_recovery_data"),
  showerQualityScore: integer("shower_quality_score"),
  sleepPodQualityScore: integer("sleep_pod_quality_score"),
  lightExposureData: text("light_exposure_data"),
  diningData: text("dining_data"),
  transportationData: text("transportation_data"),
  servicesData: text("services_data"),
  navigationData: text("navigation_data"),
  airportSummary: text("airport_summary"),
  ownerOperator: text("owner_operator"),
  locationDetails: text("location_details"),
  hubAirlines: text("hub_airlines"),
  focusCities: text("focus_cities"),
  operatingBases: text("operating_bases"),
  runwayInformation: text("runway_information"),
  terminalInformation: text("terminal_information"),
  airportFacts: text("airport_facts"),
  operatingStatistics: text("operating_statistics"),
  dataSources: text("data_sources"),
  dataQuality: text("data_quality"),
  completenessScore: doublePrecision("completeness_score"),
  processingStatus: text("processing_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const airlines = pgTable("airlines", {
  id: text("id").primaryKey(),
  airlineName: text("airline_name").notNull(),
  iataCode: text("iata_code"),
  icaoCode: text("icao_code"),
  callsign: text("callsign"),
  countryName: text("country_name"),
  countryIso2: text("country_iso2"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aircraftTypes = pgTable("aircraft_types", {
  id: text("id").primaryKey(),
  aircraftName: text("aircraft_name").notNull(),
  iataCode: text("iata_code"),
  generation: text("generation"), // 'nextgen', 'modern', 'legacy', 'old', 'exclude'
  isWidebody: boolean("is_widebody").default(false),
  jetlagScore: doublePrecision("jetlag_score"), // 10, 7, 6.5, 4.5, 4, 2, 1
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const airplanes = pgTable("airplanes", {
  id: text("id").primaryKey(),
  registrationNumber: text("registration_number"),
  iataType: text("iata_type"),
  modelName: text("model_name"),
  modelCode: text("model_code"),
  airlineIataCode: text("airline_iata_code"),
  planeAge: text("plane_age"),
  planeStatus: text("plane_status"),
  aircraftTypeId: text("aircraft_type_id").references(() => aircraftTypes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  countryName: text("country_name"),
  countryIso2: text("country_iso2"),
  population: bigint("population", { mode: "number" }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  timezone: text("timezone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const countries = pgTable("countries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  iso2: text("iso2").notNull().unique(),
  iso3: text("iso3"),
  continent: text("continent"),
  airportCount: integer("airport_count").default(0),
  cityCount: integer("city_count").default(0),
  airlineCount: integer("airline_count").default(0),
  totalPopulation: bigint("total_population", { mode: "number" }),
  minLatitude: doublePrecision("min_latitude"),
  maxLatitude: doublePrecision("max_latitude"),
  minLongitude: doublePrecision("min_longitude"),
  maxLongitude: doublePrecision("max_longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const routes = pgTable("routes", {
  id: text("id").primaryKey(),
  flightNumber: text("flight_number"),
  airlineName: text("airline_name"),
  airlineIata: text("airline_iata"),
  departureAirportName: text("departure_airport_name"),
  departureIata: text("departure_iata"),
  departureIcao: text("departure_icao"),
  departureTimezone: text("departure_timezone"),
  departureTime: text("departure_time"),
  arrivalAirportName: text("arrival_airport_name"),
  arrivalIata: text("arrival_iata"),
  arrivalIcao: text("arrival_icao"),
  arrivalTimezone: text("arrival_timezone"),
  arrivalTime: text("arrival_time"),
  estimatedDurationMinutes: text("estimated_duration_minutes"),
  isDomestic: boolean("is_domestic"),
  departureAirportId: text("departure_airport_id").references(() => airports.id),
  arrivalAirportId: text("arrival_airport_id").references(() => airports.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// FLIGHTOPTIMA FEATURE TABLES
// ============================================================================

export const savedRoutes = pgTable('saved_routes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  origin: varchar('origin', { length: 3 }).notNull(),
  destination: varchar('destination', { length: 3 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('saved_user_idx').on(table.userId),
}));

export const priceAlerts = pgTable('price_alerts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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

export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
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

// ============================================================================
// MONETIZATION TABLES
// ============================================================================

export const subscriptionTiers = pgTable('subscription_tiers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 'free', 'pro', 'expert', 'enterprise'
  stripePriceId: varchar('stripe_price_id', { length: 100 }),
  stripeProductId: varchar('stripe_product_id', { length: 100 }),
  price: real('price').notNull(), // Monthly price in USD
  interval: varchar('interval', { length: 20 }).notNull(), // 'month', 'year'
  features: json('features').$type<string[]>().notNull(), // ["unlimited_search", "alliance_filter", etc.]
  limits: json('limits').$type<{
    searchesPerDay?: number;
    alertsPerMonth?: number;
    savedRoutes?: number;
    apiCallsPerMonth?: number;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  tierId: integer('tier_id').notNull().references(() => subscriptionTiers.id),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }).unique(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('free'), // 'free', 'active', 'trialing', 'past_due', 'canceled', 'expired'
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('subscription_user_idx').on(table.userId),
  stripeIdx: index('subscription_stripe_idx').on(table.stripeSubscriptionId),
  statusIdx: index('subscription_status_idx').on(table.status),
}));

export const usageRecords = pgTable('usage_records', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // 'search', 'alert', 'api_call', etc.
  quantity: integer('quantity').notNull().default(1),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  periodStart: timestamp('period_start'), // For billing period tracking
  periodEnd: timestamp('period_end'),
}, (table) => ({
  userResourceIdx: index('usage_user_resource_idx').on(table.userId, table.resourceType),
  timestampIdx: index('usage_timestamp_idx').on(table.timestamp),
  periodIdx: index('usage_period_idx').on(table.periodStart, table.periodEnd),
}));

export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  alertId: integer('alert_id').notNull().references(() => priceAlerts.id, { onDelete: 'cascade' }),
  price: real('price').notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
  flightDetails: json('flight_details').$type<{
    airline?: string;
    flightNumber?: string;
    departureTime?: string;
    arrivalTime?: string;
    stops?: number;
  }>(),
}, (table) => ({
  alertIdx: index('price_history_alert_idx').on(table.alertId),
  checkedAtIdx: index('price_history_checked_idx').on(table.checkedAt),
}));

export const affiliateClicks = pgTable('affiliate_clicks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  affiliate: varchar('affiliate', { length: 50 }).notNull(), // 'kiwi', 'booking', 'skyscanner', etc.
  flightId: varchar('flight_id', { length: 100 }),
  clickId: text('click_id').notNull().unique().$defaultFn(() => crypto.randomUUID()),
  origin: varchar('origin', { length: 3 }).notNull(),
  destination: varchar('destination', { length: 3 }).notNull(),
  price: real('price'),
  currency: varchar('currency', { length: 3 }),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
  convertedAt: timestamp('converted_at'),
  commission: real('commission'),
  metadata: json('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdx: index('affiliate_user_idx').on(table.userId),
  clickIdIdx: index('affiliate_click_id_idx').on(table.clickId),
  clickedAtIdx: index('affiliate_clicked_at_idx').on(table.clickedAt),
  affiliateIdx: index('affiliate_partner_idx').on(table.affiliate),
  // Partial index for unconverted clicks
  unconvertedIdx: index('affiliate_unconverted_idx').on(table.clickedAt).where(sql`converted_at IS NULL`),
}));

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  notificationSettings: json('notification_settings').$type<{
    email?: boolean;
    push?: boolean;
    priceAlerts?: boolean;
    newRoutes?: boolean;
    marketing?: boolean;
  }>().default({
    email: true,
    priceAlerts: true,
    newRoutes: false,
    marketing: false,
  }),
  searchPreferences: json('search_preferences').$type<{
    defaultCabinClass?: string;
    defaultPassengers?: number;
    preferredAlliances?: string[];
    maxStops?: number;
  }>(),
  uiPreferences: json('ui_preferences').$type<{
    theme?: 'light' | 'dark' | 'system';
    compactMode?: boolean;
    showJetlagScores?: boolean;
    currency?: string;
    distanceUnit?: 'km' | 'miles';
  }>().default({
    theme: 'light',
    showJetlagScores: true,
    currency: 'USD',
    distanceUnit: 'miles',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('preferences_user_idx').on(table.userId),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Auth types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Aviation types
export type Airport = typeof airports.$inferSelect;
export type NewAirport = typeof airports.$inferInsert;
export type AirportIntelligence = typeof airportIntelligence.$inferSelect;
export type AirportData = typeof airportData.$inferSelect;
export type Airline = typeof airlines.$inferSelect;
export type NewAirline = typeof airlines.$inferInsert;
export type AircraftType = typeof aircraftTypes.$inferSelect;
export type Airplane = typeof airplanes.$inferSelect;
export type City = typeof cities.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type Route = typeof routes.$inferSelect;

// Feature types
export type SavedRoute = typeof savedRoutes.$inferSelect;
export type NewSavedRoute = typeof savedRoutes.$inferInsert;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type NewPriceAlert = typeof priceAlerts.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;

// Monetization types
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type NewSubscriptionTier = typeof subscriptionTiers.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type NewAffiliateClick = typeof affiliateClicks.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
