const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let cacheEnabled = false;

// Initialize Redis connection
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
      cacheEnabled = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
      cacheEnabled = true;
    });

    redisClient.on('error', (err) => {
      logger.logError(err, { service: 'redis' });
      cacheEnabled = false;
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
      cacheEnabled = false;
    });

    // Connect to Redis
    redisClient.connect().catch(err => {
      logger.warn('Redis connection failed, caching disabled', { error: err.message });
      cacheEnabled = false;
    });
  } catch (error) {
    logger.warn('Redis initialization failed, caching disabled', { error: error.message });
    cacheEnabled = false;
  }
} else {
  logger.info('Redis URL not configured, caching disabled');
}

class CacheService {
  /**
   * Get value from cache
   */
  async get(key) {
    if (!cacheEnabled || !redisClient) {
      return null;
    }

    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.logError(error, { operation: 'cache.get', key });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttlSeconds = 300) {
    if (!cacheEnabled || !redisClient) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await redisClient.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache.set', key });
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key) {
    if (!cacheEnabled || !redisClient) {
      return false;
    }

    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache.delete', key });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern) {
    if (!cacheEnabled || !redisClient) {
      return false;
    }

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache.deletePattern', pattern });
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, ttlSeconds = 3600) {
    if (!cacheEnabled || !redisClient) {
      return null;
    }

    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        // Set TTL on first increment
        await redisClient.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      logger.logError(error, { operation: 'cache.increment', key });
      return null;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();
    
    // Store in cache
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttlSeconds);
    }

    return value;
  }

  /**
   * Cache transaction stats
   */
  async getTransactionStats(fetchFn) {
    const key = 'stats:transactions';
    return await this.getOrSet(key, fetchFn, 30); // 30 second TTL
  }

  /**
   * Cache user data
   */
  async getUser(userId, fetchFn) {
    const key = `user:${userId}`;
    return await this.getOrSet(key, fetchFn, 300); // 5 minute TTL
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId) {
    await this.delete(`user:${userId}`);
    await this.deletePattern(`user:${userId}:*`);
  }

  /**
   * Invalidate stats cache
   */
  async invalidateStats() {
    await this.delete('stats:transactions');
    await this.delete('stats:volume');
    await this.deletePattern('stats:*');
  }

  /**
   * Cache volume per minute
   */
  async getVolumePerMinute(fetchFn) {
    const key = 'stats:volume:per:minute';
    return await this.getOrSet(key, fetchFn, 60); // 1 minute TTL
  }

  /**
   * Check if cache is enabled
   */
  isEnabled() {
    return cacheEnabled;
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!cacheEnabled || !redisClient) {
      return { enabled: false };
    }

    try {
      const info = await redisClient.info('stats');
      const keyspace = await redisClient.info('keyspace');
      
      return {
        enabled: true,
        connected: redisClient.status === 'ready',
        info: {
          totalKeys: await redisClient.dbsize(),
          memory: info.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown'
        }
      };
    } catch (error) {
      logger.logError(error, { operation: 'cache.getStats' });
      return { enabled: true, error: error.message };
    }
  }
}

module.exports = new CacheService();

