const { Kafka } = require('kafkajs');
const { db } = require('../db/db');
const fraudDetection = require('../services/fraudDetection');
const paymentGateway = require('../services/paymentGateway');
const logger = require('../utils/logger');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'payment-consumer',
  brokers: [process.env.KAFKA_BROKER],
  ssl: process.env.NODE_ENV === 'production',
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  } : undefined
});

const consumer = kafka.consumer({ groupId: 'payment-processing-group' });

class TransactionConsumer {
  constructor(websocketServer = null) {
    this.websocketServer = websocketServer;
    this.isRunning = false;
    this.processedCount = 0;
    this.startTime = Date.now();
  }

  async connect() {
    try {
      await consumer.connect();
      await consumer.subscribe({ 
        topic: process.env.KAFKA_TOPIC || 'transactions',
        fromBeginning: false 
      });
      console.log('Kafka consumer connected and subscribed');
    } catch (error) {
      console.error('Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await consumer.disconnect();
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Failed to disconnect Kafka consumer:', error);
    }
  }

  // Enhanced fraud detection using fraud detection service
  async detectFraud(transaction) {
    try {
      const analysis = await fraudDetection.analyzeTransaction(transaction);
      return analysis;
    } catch (error) {
      logger.logError(error, { transactionId: transaction.transactionId });
      // On error, default to low risk
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
            // Gateway error - decline transaction
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
      
      // Still try to save the error transaction
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

  // Start consuming messages
  async startConsuming() {
    if (this.isRunning) {
      console.log('Consumer is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    console.log('Starting transaction consumer...');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const transaction = JSON.parse(message.value.toString());
          console.log(`Processing transaction: ${transaction.transactionId}`);
          
          await this.processTransaction(transaction);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    });
  }

  // Stop consuming messages
  stopConsuming() {
    if (!this.isRunning) {
      console.log('Consumer is not running');
      return;
    }

    this.isRunning = false;
    console.log('Transaction consumer stopped');
  }

  // Get consumer statistics
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

module.exports = TransactionConsumer;
