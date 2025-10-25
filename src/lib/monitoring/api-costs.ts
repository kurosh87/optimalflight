/**
 * API Cost Optimization Tracking
 * Monitor Kiwi, Amadeus, and other API usage & costs
 */

import { db } from '@/lib/db';
import { getCacheStats } from '@/lib/kiwi/cache';
import { getCircuitBreakerStatus } from '@/lib/kiwi/api-client';

// API Cost per call (in USD)
const API_COSTS = {
  kiwi: 0.01, // Estimated $0.01 per search
  amadeus: 0.024, // $0.024 per complete search workflow
  aviation_edge: 0.001, // Estimated based on monthly plan
};

export interface ApiCallRecord {
  api: 'kiwi' | 'amadeus' | 'aviation_edge';
  endpoint: string;
  cached: boolean;
  cost: number;
  timestamp: Date;
  userId?: string;
  route?: string;
}

// In-memory tracking (could move to Redis for distributed systems)
const apiCalls: ApiCallRecord[] = [];

/**
 * Record an API call
 */
export function recordApiCall(
  api: 'kiwi' | 'amadeus' | 'aviation_edge',
  endpoint: string,
  cached: boolean,
  userId?: string,
  route?: string
) {
  const cost = cached ? 0 : API_COSTS[api];

  apiCalls.push({
    api,
    endpoint,
    cached,
    cost,
    timestamp: new Date(),
    userId,
    route,
  });

  // Keep only last 10,000 calls in memory
  if (apiCalls.length > 10000) {
    apiCalls.shift();
  }
}

/**
 * Get API cost statistics
 */
export function getApiCostStats(
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
) {
  const now = new Date();
  const ranges = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = new Date(now.getTime() - ranges[timeRange]);

  const recentCalls = apiCalls.filter(call => call.timestamp >= cutoff);

  const totalCalls = recentCalls.length;
  const cachedCalls = recentCalls.filter(c => c.cached).length;
  const apiCalls_actual = totalCalls - cachedCalls;

  const totalCost = recentCalls.reduce((sum, call) => sum + call.cost, 0);

  const cacheHitRate = totalCalls > 0 ? cachedCalls / totalCalls : 0;

  // Cost savings from caching
  const wouldHaveCost = recentCalls.reduce((sum, call) => {
    const baseCost = API_COSTS[call.api];
    return sum + baseCost;
  }, 0);

  const savedCost = wouldHaveCost - totalCost;

  return {
    totalCalls,
    cachedCalls,
    apiCalls: apiCalls_actual,
    cacheHitRate: Math.round(cacheHitRate * 100),
    totalCost: Math.round(totalCost * 100) / 100,
    savedCost: Math.round(savedCost * 100) / 100,
    wouldHaveCost: Math.round(wouldHaveCost * 100) / 100,
  };
}

/**
 * Get cost breakdown by API
 */
export function getCostByApi(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
  const now = new Date();
  const ranges = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = new Date(now.getTime() - ranges[timeRange]);
  const recentCalls = apiCalls.filter(call => call.timestamp >= cutoff);

  const byApi: Record<string, { calls: number; cost: number; cached: number }> = {};

  for (const call of recentCalls) {
    if (!byApi[call.api]) {
      byApi[call.api] = { calls: 0, cost: 0, cached: 0 };
    }

    byApi[call.api].calls++;
    byApi[call.api].cost += call.cost;
    if (call.cached) {
      byApi[call.api].cached++;
    }
  }

  return byApi;
}

/**
 * Get most expensive routes (by API costs)
 */
export function getMostExpensiveRoutes(limit: number = 10) {
  const routeCosts: Record<string, { calls: number; cost: number }> = {};

  for (const call of apiCalls) {
    if (!call.route) continue;

    if (!routeCosts[call.route]) {
      routeCosts[call.route] = { calls: 0, cost: 0 };
    }

    routeCosts[call.route].calls++;
    routeCosts[call.route].cost += call.cost;
  }

  return Object.entries(routeCosts)
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
}

/**
 * Check if approaching monthly API budget
 */
export function checkBudgetAlert(monthlyBudget: number = 100): {
  alert: boolean;
  spent: number;
  remaining: number;
  percentUsed: number;
} {
  const monthStats = getApiCostStats('month');

  const spent = monthStats.totalCost;
  const remaining = monthlyBudget - spent;
  const percentUsed = (spent / monthlyBudget) * 100;

  return {
    alert: percentUsed > 80, // Alert at 80% of budget
    spent,
    remaining,
    percentUsed: Math.round(percentUsed),
  };
}

/**
 * Get comprehensive monitoring dashboard data
 */
export function getMonitoringDashboard() {
  const dayStats = getApiCostStats('day');
  const weekStats = getApiCostStats('week');
  const monthStats = getApiCostStats('month');
  const costByApi = getCostByApi('day');
  const expensiveRoutes = getMostExpensiveRoutes(10);
  const budget = checkBudgetAlert();
  const cacheStats = getCacheStats();
  const circuitBreaker = getCircuitBreakerStatus();

  return {
    period: {
      day: dayStats,
      week: weekStats,
      month: monthStats,
    },
    byApi: costByApi,
    expensiveRoutes,
    budget,
    caching: cacheStats,
    health: {
      circuitBreaker,
    },
  };
}
