// Simple cache helpers for Kiwi
import { getRedisClient } from '@/lib/redis';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl: number): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}
