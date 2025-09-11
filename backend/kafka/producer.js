const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'payment-producer',
  brokers: [process.env.KAFKA_BROKER],
  ssl: process.env.NODE_ENV === 'production',
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  } : undefined
});

const producer = kafka.producer();

// Sample merchants for realistic transaction data
const merchants = [
  'Amazon', 'Starbucks', 'Uber', 'Netflix', 'Spotify', 'Apple Store',
  'Google Play', 'Target', 'Walmart', 'McDonald\'s', 'Subway',
  'Best Buy', 'Home Depot', 'Costco', 'Whole Foods', 'CVS Pharmacy',
  'Shell', 'Exxon', 'Chevron', 'Delta Airlines', 'American Airlines'
];

// Sample user IDs (1-5 as per schema)
const userIds = [1, 2, 3, 4, 5];

class TransactionProducer {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  async connect() {
    try {
      await producer.connect();
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await producer.disconnect();
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Failed to disconnect Kafka producer:', error);
    }
  }

  generateRandomTransaction() {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const amount = parseFloat((Math.random() * 10000).toFixed(2)); // $0 - $10,000
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const timestamp = new Date().toISOString();
    const status = 'PENDING'; // Will be processed by consumer

    return {
      transactionId,
      userId,
      amount,
      merchant,
      timestamp,
      status
    };
  }

  async sendTransaction(transaction) {
    try {
      await producer.send({
        topic: process.env.KAFKA_TOPIC || 'transactions',
        messages: [{
          key: transaction.transactionId,
          value: JSON.stringify(transaction),
          timestamp: Date.now().toString()
        }]
      });
      console.log(`Sent transaction: ${transaction.transactionId} - $${transaction.amount} at ${transaction.merchant}`);
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  }

  startProducing(intervalMs = 2000) {
    if (this.isRunning) {
      console.log('Producer is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting transaction producer (every ${intervalMs}ms)`);

    this.intervalId = setInterval(async () => {
      const transaction = this.generateRandomTransaction();
      await this.sendTransaction(transaction);
    }, intervalMs);
  }

  stopProducing() {
    if (!this.isRunning) {
      console.log('Producer is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Transaction producer stopped');
  }

  // Method to send a single transaction (useful for testing)
  async sendSingleTransaction() {
    const transaction = this.generateRandomTransaction();
    await this.sendTransaction(transaction);
    return transaction;
  }
}

module.exports = TransactionProducer;
