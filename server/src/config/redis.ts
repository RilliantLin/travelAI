import Redis from "ioredis";

const redisUrl =
  process.env.REDIS_URL || (process.env.NODE_ENV === "development" ? "redis://localhost:6379" : undefined);

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on("connect", () => {
    if (process.env.TRAVEL_CLI !== "true") {
      console.log("Redis connected successfully");
    }
  });

  redis.on("error", (error) => {
    if (process.env.TRAVEL_CLI !== "true") {
      console.error("Redis connection error:", error);
    }
  });
} else {
  if (process.env.TRAVEL_CLI !== "true") {
    console.warn("REDIS_URL is not set. Cache is disabled for this process.");
  }
}

export default redis;

export const CACHE_KEYS = {
  WEATHER: "weather",
  ATTRACTIONS: "attractions",
  RESTAURANTS: "restaurants",
  HOTELS: "hotels",
  FLIGHTS: "flights",
  USER_PREFERENCES: "user_preferences",
  ITINERARY: "itinerary",
} as const;

export const CACHE_TTL = {
  WEATHER: 3600,
  ATTRACTIONS: 86400,
  RESTAURANTS: 86400,
  HOTELS: 86400,
  FLIGHTS: 1800,
  USER_PREFERENCES: 3600,
  ITINERARY: 1800,
} as const;

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (!redis) return null;
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  try {
    if (!redis) return;
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    if (!redis) return;
    await redis.del(key);
  } catch (error) {
    console.error("Cache delete error:", error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Cache delete pattern error:", error);
  }
}

export async function closeRedis(): Promise<void> {
  if (!redis) return;
  redis.disconnect();
}
