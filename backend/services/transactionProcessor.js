const { db } = require('../db/db');
const fraudDetection = require('./fraudDetection');
const paymentGateway = require('./paymentGateway');
const logger = require('../utils/logger');

// Sample merchants for realistic transaction data
const merchants = [
  'Amazon', 'Starbucks', 'Uber', 'Netflix', 'Spotify', 'Apple Store',
  'Google Play', 'Target', 'Walmart', 'McDonald\'s', 'Subway',
  'Best Buy', 'Home Depot', 'Costco', 'Whole Foods', 'CVS Pharmacy',
  'Shell', 'Exxon', 'Chevron', 'Delta Airlines', 'American Airlines'
];

// Sample user IDs
const userIds = [1, 2, 3, 4, 5];

class TransactionProcessor {
  constructor(websocketServer = null) {
    this.websocketServer = websocketServer;
    this.isRunning = false;
    this.intervalId = null;
    this.processedCount = 0;
    this.startTime = Date.now();
  }

  generateRandomTransaction() {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    // Generate more realistic amounts: 70% small ($1-$100), 25% medium ($100-$500), 5% large ($500-$1000)
    const rand = Math.random();
    let amount;
    if (rand < 0.7) {
      amount = parseFloat((1 + Math.random() * 99).toFixed(2)); // $1 - $100
    } else if (rand < 0.95) {
      amount = parseFloat((100 + Math.random() * 400).toFixed(2)); // $100 - $500
    } else {
      amount = parseFloat((500 + Math.random() * 500).toFixed(2)); // $500 - $1000
    }
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const timestamp = new Date().toISOString();
    const status = 'PENDING';

    return {
      transactionId,
      userId,
      amount,
      merchant,
      timestamp,
      status
    };
  }

  // Enhanced fraud detection using fraud detection service
  async detectFraud(transaction) {
    try {
      const analysis = await fraudDetection.analyzeTransaction(transaction);
      return analysis;
    } catch (error) {
      logger.logError(error, { transactionId: transaction.transactionId });
      return {
        isFraudulent: false,
        riskScore: 0.1,
        reasons: ['Fraud detection error'],
        flags: []
      };
    }
  }

  // Check if user has sufficient balance
  async hasSufficientBalance(userId, amount) {
    try {
      const user = await db.getUserById(userId);
      return user && user.balance >= amount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  // Process a single transaction
  async processTransaction(transaction) {
    const startTime = Date.now();
    
    try {
      // Step 1: Fraud detection
      const fraudAnalysis = await this.detectFraud(transaction);
      transaction.riskScore = fraudAnalysis.riskScore;
      transaction.fraudFlags = fraudAnalysis.flags;

      if (fraudAnalysis.isFraudulent) {
        transaction.status = 'DECLINED';
        transaction.declineReason = 'FRAUD_DETECTED';
        transaction.metadata = {
          fraudReasons: fraudAnalysis.reasons,
          flags: fraudAnalysis.flags
        };
        logger.logSecurity('Transaction declined due to fraud', {
          transactionId: transaction.transactionId,
          riskScore: fraudAnalysis.riskScore,
          reasons: fraudAnalysis.reasons
        });
      } else {
        // Step 2: Balance check
        const hasBalance = await this.hasSufficientBalance(transaction.userId, transaction.amount);
        
        if (!hasBalance) {
          transaction.status = 'DECLINED';
          transaction.declineReason = 'INSUFFICIENT_FUNDS';
          logger.info(`Transaction ${transaction.transactionId} declined: Insufficient funds`);
        } else {
          // Step 3: Process payment through gateway
          try {
            const gatewayResult = await paymentGateway.processPayment(transaction);
            
            transaction.gateway = gatewayResult.gateway;
            transaction.gatewayPaymentId = gatewayResult.paymentId;
            
            if (gatewayResult.status === 'APPROVED') {
              // Update user balance
              const user = await db.getUserById(transaction.userId);
              const newBalance = user.balance - transaction.amount;
              await db.updateUserBalance(transaction.userId, newBalance);
              
              transaction.status = 'APPROVED';
              logger.logTransaction(transaction, 'APPROVED', {
                gateway: gatewayResult.gateway,
                riskScore: fraudAnalysis.riskScore
              });
            } else {
              transaction.status = 'DECLINED';
              transaction.declineReason = gatewayResult.declineReason || 'GATEWAY_DECLINED';
              transaction.metadata = {
                ...transaction.metadata,
                gatewayError: gatewayResult.gatewayError
              };
              logger.info(`Transaction ${transaction.transactionId} declined by gateway: ${transaction.declineReason}`);
            }
          } catch (gatewayError) {
            transaction.status = 'DECLINED';
            transaction.declineReason = 'GATEWAY_ERROR';
            transaction.metadata = {
              ...transaction.metadata,
              gatewayError: gatewayError.message
            };
            logger.logError(gatewayError, {
              transactionId: transaction.transactionId,
              step: 'payment_gateway'
            });
          }
        }
      }

      // Calculate processing latency
      const latency = Date.now() - startTime;
      transaction.processingLatency = latency;

      // Store transaction in database
      const savedTransaction = await db.insertTransaction(transaction);
      
      // Broadcast to WebSocket clients
      if (this.websocketServer) {
        this.broadcastTransaction(savedTransaction);
      }

      this.processedCount++;
      
      return savedTransaction;
    } catch (error) {
      logger.logError(error, {
        transactionId: transaction.transactionId,
        step: 'process_transaction'
      });
      transaction.status = 'ERROR';
      transaction.declineReason = 'PROCESSING_ERROR';
      transaction.metadata = {
        error: error.message,
        stack: error.stack
      };
      
      try {
        await db.insertTransaction(transaction);
      } catch (saveError) {
        logger.logError(saveError, { transactionId: transaction.transactionId });
      }
      
      return transaction;
    }
  }

  // Broadcast transaction to all connected WebSocket clients
  broadcastTransaction(transaction) {
    if (this.websocketServer) {
      const message = JSON.stringify({
        type: 'transaction',
        data: transaction
      });
      
      this.websocketServer.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  // Start generating and processing transactions
  startProducing(intervalMs = 2000) {
    if (this.isRunning) {
      console.log('Transaction processor is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    console.log(`Starting transaction processor (every ${intervalMs}ms)`);

    this.intervalId = setInterval(async () => {
      const transaction = this.generateRandomTransaction();
      await this.processTransaction(transaction);
    }, intervalMs);
  }

  // Stop generating transactions
  stopProducing() {
    if (!this.isRunning) {
      console.log('Transaction processor is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Transaction processor stopped');
  }

  // Send a single transaction (useful for testing)
  async sendSingleTransaction() {
    const transaction = this.generateRandomTransaction();
    await this.processTransaction(transaction);
    return transaction;
  }

  // Get processor statistics
  getStats() {
    const uptime = Date.now() - this.startTime;
    const transactionsPerSecond = this.processedCount / (uptime / 1000);
    
    return {
      processedCount: this.processedCount,
      uptime: uptime,
      transactionsPerSecond: transactionsPerSecond,
      isRunning: this.isRunning
    };
  }
}

module.exports = TransactionProcessor;

