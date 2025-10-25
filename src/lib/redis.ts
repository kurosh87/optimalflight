import { Redis } from '@upstash/redis';

// Use Upstash Redis (serverless, optimized for Vercel)
let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<Redis | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis not configured (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required)');
    console.warn('App will work without Redis but with reduced performance');
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

// Flight caching functions
export async function cacheUserFlights(userId: string, flights: any[], ttl = 3600) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `user:${userId}:flights`;
  await client.set(key, JSON.stringify(flights), { ex: ttl });
}

export async function getCachedUserFlights(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `user:${userId}:flights`;
  const cached = await client.get(key);
  return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
}

export async function invalidateUserFlights(userId: string) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `user:${userId}:flights`;
  await client.del(key);
}

// User preferences caching
export async function cacheUserPreferences(userId: string, preferences: any, ttl = 3600) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `user:${userId}:preferences`;
  await client.set(key, JSON.stringify(preferences), { ex: ttl });
}

export async function getCachedUserPreferences(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `user:${userId}:preferences`;
  const cached = await client.get(key);
  return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
}

export async function invalidateUserPreferences(userId: string) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `user:${userId}:preferences`;
  await client.del(key);
}

// Recovery plan caching
export async function cacheRecoveryPlan(flightId: string, plan: any, ttl = 7200) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `flight:${flightId}:recovery_plan`;
  await client.set(key, JSON.stringify(plan), { ex: ttl });
}

export async function getCachedRecoveryPlan(flightId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `flight:${flightId}:recovery_plan`;
  const cached = await client.get(key);
  return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
}

export async function invalidateRecoveryPlan(flightId: string) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `flight:${flightId}:recovery_plan`;
  await client.del(key);
}

// Session data for AI personalization
export async function storeAIPersonalization(userId: string, data: any, ttl = 86400) {
  const client = await getRedisClient();
  if (!client) return;

  const key = `user:${userId}:ai_personalization`;
  await client.set(key, JSON.stringify(data), { ex: ttl });
}

export async function getAIPersonalization(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  const key = `user:${userId}:ai_personalization`;
  const cached = await client.get(key);
  return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
}

// Cleanup function (Upstash Redis is serverless, no need to disconnect)
export async function disconnectRedis() {
  // Upstash Redis is HTTP-based, no persistent connection to close
  redisClient = null;
}
