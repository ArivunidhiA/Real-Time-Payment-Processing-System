const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

// Try to use Redis store if available, otherwise use memory store
let RedisStore = null;
try {
  RedisStore = require('rate-limit-redis');
} catch (e) {
  // Redis store not available, will use memory store
}

// Initialize Redis client if available
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
      redisClient = null; // Fall back to memory store
    });
  } catch (error) {
    console.warn('Redis not available, using memory store for rate limiting');
  }
}

/**
 * Create rate limiter with Redis store if available, otherwise memory store
 */
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
    ...options
  };

  // Use Redis store if available
  if (redisClient && RedisStore) {
    defaultOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    });
  }

  return rateLimit(defaultOptions);
}

// General API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true // Don't count successful requests
});

// Transaction creation rate limiter
const transactionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 transactions per minute
  message: {
    success: false,
    error: 'Too many transaction requests, please try again later.'
  }
});

// Stats endpoint rate limiter (heavier queries)
const statsLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Too many stats requests, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  transactionLimiter,
  statsLimiter,
  createRateLimiter
};

