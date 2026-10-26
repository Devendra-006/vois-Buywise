import { Redis } from "ioredis";
import { env } from "../config/env.js";

let redisClient: Redis | null = null;
if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000
    });
    console.log("⚡ Connected to Redis Cache");
  } catch (err: any) {
    console.warn("⚠️ Redis connection failed, falling back to in-memory cache:", err.message);
  }
}

interface MemoryCacheEntry {
  data: any;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();
let cacheHits = 0;
let cacheMisses = 0;

export function normalizeCacheKey(prefix: string, key: string): string {
  const sanitized = key.toLowerCase().trim().replace(/\s+/g, "_");
  return `${prefix}:${sanitized}`;
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (raw) {
        cacheHits++;
        return JSON.parse(raw) as T;
      }
    } catch {
      // Fall through to memory cache
    }
  }

  const entry = memoryCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    cacheHits++;
    return entry.data as T;
  }

  if (entry) {
    memoryCache.delete(key);
  }

  cacheMisses++;
  return null;
}

export async function setCache(key: string, data: any, ttlSeconds = 3600): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(data), "EX", ttlSeconds);
      return;
    } catch {
      // Fall through to memory cache
    }
  }

  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    memoryKeys: memoryCache.size,
    isRedisConnected: !!redisClient
  };
}
