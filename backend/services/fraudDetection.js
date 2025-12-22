const { db } = require('../db/db');
const logger = require('../utils/logger');
const Redis = require('ioredis');

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
}

class FraudDetectionService {
  constructor() {
    // Lower threshold for demo - only flag very suspicious transactions
    this.riskThreshold = parseFloat(process.env.FRAUD_RISK_THRESHOLD || '0.85');
    this.velocityWindow = parseInt(process.env.VELOCITY_WINDOW_MINUTES || '60');
  }

  /**
   * Comprehensive fraud analysis
   */
  async analyzeTransaction(transaction) {
    const analysis = {
      isFraudulent: false,
      riskScore: 0,
      reasons: [],
      flags: []
    };

    try {
      // 1. Velocity checks
      const velocityCheck = await this.checkVelocity(transaction);
      analysis.riskScore += velocityCheck.riskScore;
      if (velocityCheck.isFlagged) {
        analysis.flags.push('VELOCITY');
        analysis.reasons.push(velocityCheck.reason);
      }

      // 2. Amount-based checks
      const amountCheck = this.checkAmount(transaction);
      analysis.riskScore += amountCheck.riskScore;
      if (amountCheck.isFlagged) {
        analysis.flags.push('AMOUNT');
        analysis.reasons.push(amountCheck.reason);
      }

      // 3. Merchant-based checks
      const merchantCheck = await this.checkMerchant(transaction);
      analysis.riskScore += merchantCheck.riskScore;
      if (merchantCheck.isFlagged) {
        analysis.flags.push('MERCHANT');
        analysis.reasons.push(merchantCheck.reason);
      }

      // 4. Time-based checks
      const timeCheck = this.checkTimePattern(transaction);
      analysis.riskScore += timeCheck.riskScore;
      if (timeCheck.isFlagged) {
        analysis.flags.push('TIME_PATTERN');
        analysis.reasons.push(timeCheck.reason);
      }

      // 5. User behavior checks
      const behaviorCheck = await this.checkUserBehavior(transaction);
      analysis.riskScore += behaviorCheck.riskScore;
      if (behaviorCheck.isFlagged) {
        analysis.flags.push('BEHAVIOR');
        analysis.reasons.push(behaviorCheck.reason);
      }

      // 6. Geographic checks (if IP address available)
      if (transaction.ipAddress) {
        const geoCheck = await this.checkGeographic(transaction);
        analysis.riskScore += geoCheck.riskScore;
        if (geoCheck.isFlagged) {
          analysis.flags.push('GEOGRAPHIC');
          analysis.reasons.push(geoCheck.reason);
        }
      }

      // Normalize risk score to 0-1
      analysis.riskScore = Math.min(1, analysis.riskScore / 6); // Divide by number of checks

      // Determine if fraudulent
      analysis.isFraudulent = analysis.riskScore >= this.riskThreshold;

      // Log high-risk transactions
      if (analysis.riskScore > 0.5) {
        logger.logSecurity('High-risk transaction detected', {
          transactionId: transaction.transactionId,
          userId: transaction.userId,
          riskScore: analysis.riskScore,
          flags: analysis.flags
        });
      }

      return analysis;
    } catch (error) {
      logger.logError(error, {
        transactionId: transaction.transactionId,
        service: 'fraudDetection'
      });
      // On error, default to low risk but flag for manual review
      return {
        isFraudulent: false,
        riskScore: 0.3,
        reasons: ['Fraud detection error - manual review recommended'],
        flags: ['DETECTION_ERROR']
      };
    }
  }

  /**
   * Check transaction velocity (number of transactions in time window)
   */
  async checkVelocity(transaction) {
    try {
      const cacheKey = `velocity:${transaction.userId}:${this.velocityWindow}`;
      let transactionCount = 0;

      // Try Redis first
      if (redisClient) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          transactionCount = parseInt(cached);
        }
      }

      // If not in cache, query database
      if (transactionCount === 0) {
        const result = await db.pool.query(
          `SELECT COUNT(*) as count 
           FROM transactions 
           WHERE user_id = $1 
           AND timestamp > NOW() - INTERVAL '${this.velocityWindow} minutes'`,
          [transaction.userId]
        );
        transactionCount = parseInt(result.rows[0]?.count || 0);

        // Cache for 1 minute
        if (redisClient) {
          await redisClient.setex(cacheKey, 60, transactionCount.toString());
        }
      }

      // Increment count for current transaction
      transactionCount += 1;
      if (redisClient) {
        await redisClient.incr(cacheKey);
        await redisClient.expire(cacheKey, this.velocityWindow * 60);
      }

      // Risk scoring based on velocity
      let riskScore = 0;
      let isFlagged = false;
      let reason = null;

      if (transactionCount > 50) {
        riskScore = 0.4;
        isFlagged = true;
        reason = `Very high velocity: ${transactionCount} transactions in ${this.velocityWindow} minutes`;
      } else if (transactionCount > 20) {
        riskScore = 0.2;
        isFlagged = true;
        reason = `High velocity: ${transactionCount} transactions in ${this.velocityWindow} minutes`;
      } else if (transactionCount > 10) {
        riskScore = 0.1;
        reason = `Elevated velocity: ${transactionCount} transactions in ${this.velocityWindow} minutes`;
      }

      return { riskScore, isFlagged, reason };
    } catch (error) {
      logger.logError(error, { transactionId: transaction.transactionId });
      return { riskScore: 0, isFlagged: false, reason: null };
    }
  }

  /**
   * Check transaction amount for anomalies
   */
  checkAmount(transaction) {
    let riskScore = 0;
    let isFlagged = false;
    let reason = null;

    // Only flag very high amounts for demo purposes
    if (transaction.amount > 5000) {
      riskScore = 0.2;
      isFlagged = true;
      reason = `Very high transaction amount: $${transaction.amount}`;
    } else if (transaction.amount > 2000) {
      riskScore = 0.1;
      isFlagged = false;
      reason = `High transaction amount: $${transaction.amount}`;
    }

    // Less strict on round numbers for demo
    if (transaction.amount % 100 === 0 && transaction.amount > 2000) {
      riskScore += 0.05;
      if (!isFlagged && transaction.amount > 5000) {
        isFlagged = true;
        reason = `Unusual round number amount: $${transaction.amount}`;
      }
    }

    return { riskScore, isFlagged, reason };
  }

  /**
   * Check merchant reputation
   */
  async checkMerchant(transaction) {
    try {
      // Check if merchant has high decline rate
      const result = await db.pool.query(
        `SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'DECLINED' THEN 1 END) as declined
         FROM transactions 
         WHERE merchant = $1 
         AND timestamp > NOW() - INTERVAL '24 hours'`,
        [transaction.merchant]
      );

      const total = parseInt(result.rows[0]?.total || 0);
      const declined = parseInt(result.rows[0]?.declined || 0);
      
      if (total > 10) {
        const declineRate = declined / total;
        
        if (declineRate > 0.5) {
          return {
            riskScore: 0.3,
            isFlagged: true,
            reason: `High decline rate for merchant: ${(declineRate * 100).toFixed(1)}%`
          };
        } else if (declineRate > 0.3) {
          return {
            riskScore: 0.15,
            isFlagged: true,
            reason: `Elevated decline rate for merchant: ${(declineRate * 100).toFixed(1)}%`
          };
        }
      }

      return { riskScore: 0, isFlagged: false, reason: null };
    } catch (error) {
      logger.logError(error);
      return { riskScore: 0, isFlagged: false, reason: null };
    }
  }

  /**
   * Check time-based patterns
   */
  checkTimePattern(transaction) {
    const hour = new Date(transaction.timestamp).getHours();
    let riskScore = 0;
    let isFlagged = false;
    let reason = null;

    // Transactions in unusual hours (2 AM - 5 AM)
    if (hour >= 2 && hour < 5) {
      riskScore = 0.15;
      isFlagged = true;
      reason = `Unusual transaction time: ${hour}:00`;
    }

    return { riskScore, isFlagged, reason };
  }

  /**
   * Check user behavior patterns
   */
  async checkUserBehavior(transaction) {
    try {
      // Check if user has recent declined transactions
      const result = await db.pool.query(
        `SELECT COUNT(*) as count 
         FROM transactions 
         WHERE user_id = $1 
         AND status = 'DECLINED' 
         AND timestamp > NOW() - INTERVAL '1 hour'`,
        [transaction.userId]
      );

      const declinedCount = parseInt(result.rows[0]?.count || 0);
      
      if (declinedCount > 3) {
        return {
          riskScore: 0.25,
          isFlagged: true,
          reason: `User has ${declinedCount} declined transactions in the last hour`
        };
      } else if (declinedCount > 1) {
        return {
          riskScore: 0.1,
          isFlagged: false,
          reason: `User has ${declinedCount} declined transactions in the last hour`
        };
      }

      return { riskScore: 0, isFlagged: false, reason: null };
    } catch (error) {
      logger.logError(error);
      return { riskScore: 0, isFlagged: false, reason: null };
    }
  }

  /**
   * Check geographic patterns (if IP available)
   */
  async checkGeographic(transaction) {
    // This would integrate with a geolocation service
    // For now, return low risk
    return { riskScore: 0, isFlagged: false, reason: null };
  }

  /**
   * Calculate risk score (0-1)
   */
  calculateRiskScore(factors) {
    // Weighted risk calculation
    const weights = {
      velocity: 0.3,
      amount: 0.2,
      merchant: 0.2,
      time: 0.1,
      behavior: 0.15,
      geographic: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [factor, weight] of Object.entries(weights)) {
      if (factors[factor]) {
        totalScore += factors[factor] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
}

module.exports = new FraudDetectionService();

