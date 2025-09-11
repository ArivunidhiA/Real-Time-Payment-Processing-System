const express = require('express');
const { db } = require('./db/db');
const TransactionProducer = require('./kafka/producer');

const router = express.Router();
const producer = new TransactionProducer();

// Initialize producer connection
producer.connect().catch(console.error);

// GET /transactions - Get latest 50 transactions
router.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await db.getLatestTransactions(limit);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// GET /stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getTransactionStats();
    const volumePerMinute = await db.getVolumePerMinute();
    const consumerStats = global.consumer ? global.consumer.getStats() : null;
    
    // Calculate approval rate
    const approvalRate = stats.total_transactions > 0 
      ? (stats.approved_transactions / stats.total_transactions * 100).toFixed(2)
      : 0;

    // Simulate latency and uptime metrics
    const simulatedLatency = Math.random() * 50 + 150; // 150-200ms
    const simulatedUptime = 99.99; // 99.99% uptime

    const response = {
      success: true,
      data: {
        approvalRate: parseFloat(approvalRate),
        totalTransactions: parseInt(stats.total_transactions),
        approvedTransactions: parseInt(stats.approved_transactions),
        declinedTransactions: parseInt(stats.declined_transactions),
        averageApprovedAmount: parseFloat(stats.avg_approved_amount || 0),
        totalVolume: parseFloat(stats.total_volume || 0),
        transactionsLastMinute: parseInt(stats.transactions_last_minute),
        volumePerMinute: volumePerMinute.map(item => ({
          minute: item.minute,
          count: parseInt(item.transaction_count),
          volume: parseFloat(item.volume)
        })),
        systemMetrics: {
          averageLatency: Math.round(simulatedLatency),
          uptime: simulatedUptime,
          processedTransactions: consumerStats ? consumerStats.processedCount : 0,
          transactionsPerSecond: consumerStats ? consumerStats.transactionsPerSecond.toFixed(2) : 0
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// POST /transactions/generate - Manually generate a single transaction
router.post('/transactions/generate', async (req, res) => {
  try {
    const transaction = await producer.sendSingleTransaction();
    res.json({
      success: true,
      message: 'Transaction generated successfully',
      transaction: transaction
    });
  } catch (error) {
    console.error('Error generating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate transaction'
    });
  }
});

// POST /transactions/producer/start - Start transaction producer
router.post('/transactions/producer/start', async (req, res) => {
  try {
    const interval = parseInt(req.body.interval) || 2000;
    producer.startProducing(interval);
    
    res.json({
      success: true,
      message: `Transaction producer started with ${interval}ms interval`
    });
  } catch (error) {
    console.error('Error starting producer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start producer'
    });
  }
});

// POST /transactions/producer/stop - Stop transaction producer
router.post('/transactions/producer/stop', (req, res) => {
  try {
    producer.stopProducing();
    
    res.json({
      success: true,
      message: 'Transaction producer stopped'
    });
  } catch (error) {
    console.error('Error stopping producer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop producer'
    });
  }
});

// GET /health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /users - Get all users (for debugging)
router.get('/users', async (req, res) => {
  try {
    const query = 'SELECT * FROM users ORDER BY id';
    const result = await db.pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

module.exports = router;
