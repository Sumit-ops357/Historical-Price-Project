const Redis = require('ioredis');

// In-memory cache fallback when Redis is not available
const memoryCache = new Map();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  retryDelayOnFailover: 1000,
  enableReadyCheck: false,
  maxLoadingTimeout: 10000,
  lazyConnect: true, // Don't connect immediately
  retryDelayOnClusterDown: 300,
  connectTimeout: 5000,
  commandTimeout: 5000,
};

let redis;
let useMemoryCache = false;

try {
  redis = new Redis(redisConfig);
  
  redis.on('error', (error) => {
    if (!useMemoryCache) {
      console.log('Redis connection failed, switching to memory cache');
      useMemoryCache = true;
    }
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
    useMemoryCache = false;
  });
} catch (error) {
  console.log('Redis initialization failed, using memory cache');
  useMemoryCache = true;
}

// Memory cache functions
const memoryCacheGet = async (key) => {
  const value = memoryCache.get(key);
  if (value && value.expiry > Date.now()) {
    return value.data;
  }
  memoryCache.delete(key);
  return null;
};

const memoryCacheSet = async (key, data, ttl = 300) => {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + (ttl * 1000)
  });
};

// Export functions that work with both Redis and memory cache
const getCachedPrice = async (key) => {
  if (useMemoryCache) {
    return await memoryCacheGet(key);
  }
  
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.log('Redis error, falling back to memory cache');
    return await memoryCacheGet(key);
  }
};

const setCachedPrice = async (key, data, ttl = 300) => {
  if (useMemoryCache) {
    return await memoryCacheSet(key, data, ttl);
  }
  
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.log('Redis error, falling back to memory cache');
    await memoryCacheSet(key, data, ttl);
  }
};

module.exports = {
  redis,
  getCachedPrice,
  setCachedPrice,
  useMemoryCache
}; 