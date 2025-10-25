/**
 * NoJetlag Holistic Flight Ranking System - Main Exports
 *
 * This is the main entry point for the ranking system
 */

// ============================================================================
// LEGACY EXPORTS (Basic Scoring - Deprecated)
// ============================================================================

export {
  scoreFlightForJetlag,
  scoreAndRankFlights,
  getBestFlightForJetlag,
  type FlightOption,
  type FlightScore,
} from './flight-scorer';

export {
  scoreKiwiResults,
  getTopFlightsByJetlagScore,
  filterByMinimumScore,
  groupByRecommendation,
  type KiwiSearchResult,
} from './kiwi-adapter';

// ============================================================================
// NEW HOLISTIC SCORING SYSTEM (Production-Ready)
// ============================================================================

// Core adapter functions
export {
  kiwiRouteToCompleteFlightOption,
  convertKiwiRoutesToCompleteFlights,
  getAircraftCharacteristics,
  getAirlineCharacteristics,
  getAirportFacilities,
  type KiwiRoute,
} from './kiwi-holistic-adapter';

// Fallback strategies
export {
  getDefaultAircraft,
  getDefaultAirline,
  getDefaultAirportFacilities,
  createFallbackResult,
  type FallbackLevel,
  type FallbackResult,
} from './fallback-strategies';

// Batch queries for optimization
export {
  batchGetAircraft,
  batchGetAirlines,
  batchGetAirports,
  batchGetAirportFacilities,
  batchGetAirportsWithFacilities,
  batchGetFlightEnrichmentData,
  type FlightEnrichmentData,
} from './batch-queries';

// Cache management
export {
  getCachedAircraft,
  setCachedAircraft,
  getCachedAirline,
  setCachedAirline,
  getCachedAirport,
  setCachedAirport,
  getCacheStats,
  clearAllCaches,
  clearCache,
  warmCache,
  type CacheStats,
  type AirportData,
} from './cache-manager';

// Scoring with fallbacks
export {
  scoreFlightWithFallbacks,
  scoreFlightBasic,
  scoreFlightPartial,
  hasMinimalEnrichmentData,
  calculateScoreConfidence,
} from './scorer-with-fallback';
