/**
 * Price vs Jetlag Optimization
 *
 * Analyzes flight options to find optimal tradeoffs between:
 * - Price (lower is better)
 * - Jetlag score (higher is better)
 * - Value (best balance of both)
 */

import { HolisticFlightScore } from './holistic-scorer';
import { CompleteFlightOption } from './holistic-scorer';

export interface FlightWithScore {
  flight: CompleteFlightOption;
  score: HolisticFlightScore;
}

export interface PriceJetlagCategory {
  category: 'best-value' | 'best-jetlag' | 'cheapest' | 'balanced';
  reason: string;
  valueScore: number; // Normalized 0-100 (higher is better)
  pricePerJetlagPoint?: number; // USD per jetlag point
}

export interface PriceJetlagAnalysis {
  cheapestOption?: FlightWithScore;
  bestJetlagOption?: FlightWithScore;
  bestValueOption?: FlightWithScore;
  balancedOption?: FlightWithScore;

  // Per-flight categorization
  flightCategories: Map<string, PriceJetlagCategory>;

  // Price statistics
  priceRange: {
    min: number;
    max: number;
    average: number;
  };

  // Jetlag statistics
  jetlagRange: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Calculate value score: combines price and jetlag into single metric
 * Higher score = better value
 */
function calculateValueScore(
  price: number,
  jetlagScore: number,
  minPrice: number,
  maxPrice: number,
  minJetlag: number,
  maxJetlag: number
): number {
  // Normalize price (0-100, lower price = higher score)
  const priceRange = maxPrice - minPrice;
  const normalizedPrice = priceRange > 0
    ? 100 - ((price - minPrice) / priceRange * 100)
    : 50;

  // Normalize jetlag (0-100, already in that range)
  const normalizedJetlag = jetlagScore;

  // Value = 60% jetlag quality + 40% price savings
  // (Users care more about jetlag than price for international travel)
  return (normalizedJetlag * 0.6) + (normalizedPrice * 0.4);
}

/**
 * Analyze flight options to find optimal price vs jetlag tradeoffs
 */
export function analyzePriceJetlagTradeoffs(
  flightsWithScores: FlightWithScore[]
): PriceJetlagAnalysis {
  // Filter out flights without price data
  const pricedFlights = flightsWithScores.filter(
    f => f.flight.price != null && f.flight.price > 0
  );

  if (pricedFlights.length === 0) {
    // No price data available
    return {
      flightCategories: new Map(),
      priceRange: { min: 0, max: 0, average: 0 },
      jetlagRange: { min: 0, max: 0, average: 0 },
    };
  }

  // Calculate statistics
  const prices = pricedFlights.map(f => f.flight.price!);
  const jetlagScores = pricedFlights.map(f => f.score.overallJetlagScore);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  const minJetlag = Math.min(...jetlagScores);
  const maxJetlag = Math.max(...jetlagScores);
  const avgJetlag = jetlagScores.reduce((a, b) => a + b, 0) / jetlagScores.length;

  // Find optimal flights
  let cheapestOption = pricedFlights[0];
  let bestJetlagOption = pricedFlights[0];
  let bestValueOption = pricedFlights[0];
  let bestValueScore = -1;

  const flightCategories = new Map<string, PriceJetlagCategory>();

  pricedFlights.forEach(f => {
    const price = f.flight.price!;
    const jetlag = f.score.overallJetlagScore;

    // Track cheapest
    if (price < cheapestOption.flight.price!) {
      cheapestOption = f;
    }

    // Track best jetlag
    if (jetlag > bestJetlagOption.score.overallJetlagScore) {
      bestJetlagOption = f;
    }

    // Calculate value score
    const valueScore = calculateValueScore(
      price,
      jetlag,
      minPrice,
      maxPrice,
      minJetlag,
      maxJetlag
    );

    // Track best value
    if (valueScore > bestValueScore) {
      bestValueScore = valueScore;
      bestValueOption = f;
    }

    // Categorize flight
    const pricePerJetlagPoint = jetlag > 0 ? price / jetlag : Infinity;

    let category: PriceJetlagCategory['category'] = 'balanced';
    let reason = 'Balanced price and jetlag score';

    // Check if this is an optimal option
    if (f === cheapestOption) {
      category = 'cheapest';
      reason = 'Lowest price option';
    } else if (f === bestJetlagOption) {
      category = 'best-jetlag';
      reason = 'Highest jetlag score';
    } else if (f === bestValueOption) {
      category = 'best-value';
      reason = 'Best price per jetlag point';
    }

    flightCategories.set(f.flight.id, {
      category,
      reason,
      valueScore,
      pricePerJetlagPoint,
    });
  });

  // Find balanced option (closest to average price and jetlag)
  let balancedOption = pricedFlights[0];
  let minDistance = Infinity;

  pricedFlights.forEach(f => {
    const priceNorm = (f.flight.price! - avgPrice) / (maxPrice - minPrice || 1);
    const jetlagNorm = (f.score.overallJetlagScore - avgJetlag) / (maxJetlag - minJetlag || 1);
    const distance = Math.sqrt(priceNorm * priceNorm + jetlagNorm * jetlagNorm);

    if (distance < minDistance) {
      minDistance = distance;
      balancedOption = f;
    }
  });

  return {
    cheapestOption,
    bestJetlagOption,
    bestValueOption,
    balancedOption,
    flightCategories,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      average: avgPrice,
    },
    jetlagRange: {
      min: minJetlag,
      max: maxJetlag,
      average: avgJetlag,
    },
  };
}

/**
 * Get price-aware recommendation text
 */
export function getPriceAwareRecommendation(
  flight: FlightWithScore,
  category: PriceJetlagCategory,
  analysis: PriceJetlagAnalysis
): string {
  const price = flight.flight.price;
  const jetlag = flight.score.overallJetlagScore;

  if (!price) {
    return flight.score.recommendation;
  }

  const avgPrice = analysis.priceRange.average;
  const priceDiff = ((price - avgPrice) / avgPrice * 100).toFixed(0);
  const priceDiffText = price > avgPrice
    ? `${priceDiff}% above average`
    : `${Math.abs(Number(priceDiff))}% below average`;

  switch (category.category) {
    case 'cheapest':
      return `Cheapest option (${priceDiffText}), but ${jetlag < 60 ? 'lower' : 'decent'} jetlag score`;

    case 'best-jetlag':
      return `Best jetlag mitigation (score ${jetlag}), ${price > avgPrice ? 'premium' : 'good'} price`;

    case 'best-value':
      return `Best value (${category.valueScore.toFixed(0)}/100) - optimal price vs jetlag tradeoff`;

    case 'balanced':
    default:
      return `${priceDiffText} price, ${jetlag} jetlag score`;
  }
}
