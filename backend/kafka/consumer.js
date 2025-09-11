const { Kafka } = require('kafkajs');
const { db } = require('../db/db');
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

  // Simulate fraud detection
  isFraudulent(transaction) {
    // Random fraud flag for transactions > $5000
    if (transaction.amount > 5000) {
      return Math.random() < 0.1; // 10% chance of fraud for high-value transactions
    }
    return Math.random() < 0.01; // 1% chance of fraud for regular transactions
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
      // Fraud check
      if (this.isFraudulent(transaction)) {
        transaction.status = 'DECLINED';
        transaction.declineReason = 'FRAUD_DETECTED';
        console.log(`Transaction ${transaction.transactionId} declined: Fraud detected`);
      } else {
        // Balance check
        const hasBalance = await this.hasSufficientBalance(transaction.userId, transaction.amount);
        
        if (hasBalance) {
          // Update user balance
          const user = await db.getUserById(transaction.userId);
          const newBalance = user.balance - transaction.amount;
          await db.updateUserBalance(transaction.userId, newBalance);
          
          transaction.status = 'APPROVED';
          console.log(`Transaction ${transaction.transactionId} approved: $${transaction.amount} at ${transaction.merchant}`);
        } else {
          transaction.status = 'DECLINED';
          transaction.declineReason = 'INSUFFICIENT_FUNDS';
          console.log(`Transaction ${transaction.transactionId} declined: Insufficient funds`);
        }
      }

      // Store transaction in database
      const savedTransaction = await db.insertTransaction(transaction);
      
      // Calculate processing latency
      const latency = Date.now() - startTime;
      transaction.processingLatency = latency;
      
      // Broadcast to WebSocket clients
      if (this.websocketServer) {
        this.broadcastTransaction(savedTransaction);
      }

      this.processedCount++;
      
      return savedTransaction;
    } catch (error) {
      console.error('Error processing transaction:', error);
      transaction.status = 'ERROR';
      transaction.error = error.message;
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
