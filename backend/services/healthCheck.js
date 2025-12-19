const { pool } = require('../db/db');
const Redis = require('ioredis');
const axios = require('axios');

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
}

/**
 * Check database connection
 */
async function checkDatabase() {
  try {
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'ok',
      responseTime: `${responseTime}ms`,
      version: result.rows[0]?.version?.split(' ')[0] || 'unknown'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check transaction processor
 */
async function checkTransactionProcessor() {
  try {
    const processor = global.transactionProcessor;
    if (!processor) {
      return {
        status: 'not_initialized',
        message: 'Transaction processor not initialized'
      };
    }

    const stats = processor.getStats();
    return {
      status: 'ok',
      isRunning: stats.isRunning,
      processedCount: stats.processedCount,
      transactionsPerSecond: parseFloat(stats.transactionsPerSecond).toFixed(2)
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check Redis connection
 */
async function checkRedis() {
  if (!redisClient) {
    return {
      status: 'not_configured',
      message: 'Redis not configured'
    };
  }

  try {
    const startTime = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - startTime;
    
    const info = await redisClient.info('server');
    
    return {
      status: 'ok',
      responseTime: `${responseTime}ms`,
      version: info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check payment gateway (if configured)
 */
async function checkPaymentGateway() {
  const gateway = process.env.PAYMENT_GATEWAY || 'stripe';
  
  if (gateway === 'stripe' && process.env.STRIPE_SECRET_KEY) {
    try {
      const startTime = Date.now();
      const response = await axios.get('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        },
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'ok',
        gateway: 'stripe',
        responseTime: `${responseTime}ms`,
        accountId: response.data?.id || 'unknown'
      };
    } catch (error) {
      return {
        status: 'error',
        gateway: 'stripe',
        error: error.message
      };
    }
  }

  return {
    status: 'not_configured',
    message: 'Payment gateway not configured'
  };
}

/**
 * Check external monitoring service (Sentry)
 */
async function checkMonitoring() {
  if (!process.env.SENTRY_DSN) {
    return {
      status: 'not_configured',
      message: 'Monitoring not configured'
    };
  }

  return {
    status: 'ok',
    service: 'sentry',
    dsn: process.env.SENTRY_DSN ? 'configured' : 'not_configured'
  };
}

/**
 * Comprehensive health check
 */
async function comprehensiveHealthCheck() {
  const checks = {
    database: await checkDatabase(),
    transactionProcessor: await checkTransactionProcessor(),
    redis: await checkRedis(),
    paymentGateway: await checkPaymentGateway(),
    monitoring: await checkMonitoring(),
    timestamp: new Date().toISOString()
  };

  // Determine overall health
  const criticalServices = ['database'];
  const isHealthy = criticalServices.every(
    service => checks[service]?.status === 'ok'
  );

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };
}

/**
 * Simple health check (quick)
 */
async function simpleHealthCheck() {
  try {
    await pool.query('SELECT 1');
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  checkDatabase,
  checkTransactionProcessor,
  checkRedis,
  checkPaymentGateway,
  checkMonitoring,
  comprehensiveHealthCheck,
  simpleHealthCheck
};

