const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data storage
let transactions = [];
let users = [
  { id: 1, balance: 10000.00 },
  { id: 2, balance: 5000.00 },
  { id: 3, balance: 15000.00 },
  { id: 4, balance: 2500.00 },
  { id: 5, balance: 8000.00 }
];

const merchants = [
  'Amazon', 'Starbucks', 'Uber', 'Netflix', 'Spotify', 'Apple Store',
  'Google Play', 'Target', 'Walmart', 'McDonald\'s', 'Subway',
  'Best Buy', 'Home Depot', 'Costco', 'Whole Foods', 'CVS Pharmacy',
  'Shell', 'Exxon', 'Chevron', 'Delta Airlines', 'American Airlines'
];

// Mock transaction processing
function generateTransaction() {
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = users[Math.floor(Math.random() * users.length)].id;
  const amount = parseFloat((Math.random() * 10000).toFixed(2));
  const merchant = merchants[Math.floor(Math.random() * merchants.length)];
  const timestamp = new Date().toISOString();
  
  // Simulate processing
  let status = 'PENDING';
  let declineReason = null;
  
  // Fraud check (10% chance for >$5000)
  if (amount > 5000 && Math.random() < 0.1) {
    status = 'DECLINED';
    declineReason = 'FRAUD_DETECTED';
  } else {
    // Balance check
    const user = users.find(u => u.id === userId);
    if (user && user.balance >= amount) {
      user.balance -= amount;
      status = 'APPROVED';
    } else {
      status = 'DECLINED';
      declineReason = 'INSUFFICIENT_FUNDS';
    }
  }
  
  const transaction = {
    id: transactions.length + 1,
    transaction_id: transactionId,
    user_id: userId,
    amount: amount,
    merchant: merchant,
    status: status,
    timestamp: timestamp,
    decline_reason: declineReason,
    processing_latency: Math.floor(Math.random() * 50) + 150 // 150-200ms
  };
  
  transactions.unshift(transaction);
  if (transactions.length > 100) {
    transactions = transactions.slice(0, 100);
  }
  
  return transaction;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to real-time payment stream',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast transaction to all connected clients
function broadcastTransaction(transaction) {
  const message = JSON.stringify({
    type: 'transaction',
    data: transaction
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// API Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const latestTransactions = transactions.slice(0, limit).map(t => ({
    ...t,
    user_balance: users.find(u => u.id === t.user_id)?.balance || 0
  }));
  
  res.json({
    success: true,
    data: latestTransactions,
    count: latestTransactions.length
  });
});

app.get('/stats', (req, res) => {
  const totalTransactions = transactions.length;
  const approvedTransactions = transactions.filter(t => t.status === 'APPROVED').length;
  const declinedTransactions = transactions.filter(t => t.status === 'DECLINED').length;
  const approvalRate = totalTransactions > 0 ? (approvedTransactions / totalTransactions * 100).toFixed(2) : 0;
  
  const transactionsLastMinute = transactions.filter(t => {
    const transactionTime = new Date(t.timestamp);
    const oneMinuteAgo = new Date(Date.now() - 60000);
    return transactionTime > oneMinuteAgo;
  }).length;
  
  const totalVolume = transactions
    .filter(t => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const avgApprovedAmount = approvedTransactions > 0 
    ? transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) / approvedTransactions
    : 0;
  
  // Generate volume per minute data for the last hour
  const volumePerMinute = [];
  for (let i = 59; i >= 0; i--) {
    const minute = new Date(Date.now() - i * 60000);
    const minuteTransactions = transactions.filter(t => {
      const transactionTime = new Date(t.timestamp);
      return transactionTime >= minute && transactionTime < new Date(minute.getTime() + 60000);
    });
    
    volumePerMinute.push({
      minute: minute.toISOString(),
      transaction_count: minuteTransactions.length,
      volume: minuteTransactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
    });
  }
  
  res.json({
    success: true,
    data: {
      approvalRate: parseFloat(approvalRate),
      totalTransactions: totalTransactions,
      approvedTransactions: approvedTransactions,
      declinedTransactions: declinedTransactions,
      averageApprovedAmount: parseFloat(avgApprovedAmount.toFixed(2)),
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      transactionsLastMinute: transactionsLastMinute,
      volumePerMinute: volumePerMinute,
      systemMetrics: {
        averageLatency: Math.floor(Math.random() * 50) + 150, // 150-200ms
        uptime: 99.99,
        processedTransactions: totalTransactions,
        transactionsPerSecond: (totalTransactions / (process.uptime() || 1)).toFixed(2)
      }
    }
  });
});

app.post('/transactions/generate', (req, res) => {
  const transaction = generateTransaction();
  broadcastTransaction(transaction);
  
  res.json({
    success: true,
    message: 'Transaction generated successfully',
    transaction: transaction
  });
});

app.get('/users', (req, res) => {
  res.json({
    success: true,
    data: users
  });
});

// Start generating transactions automatically
let producerInterval;
let isProducing = false;

function startProducer(intervalMs = 2000) {
  if (isProducing) return;
  
  isProducing = true;
  producerInterval = setInterval(() => {
    const transaction = generateTransaction();
    broadcastTransaction(transaction);
    console.log(`Generated transaction: ${transaction.transaction_id} - $${transaction.amount} at ${transaction.merchant} - ${transaction.status}`);
  }, intervalMs);
  
  console.log(`Started transaction producer (every ${intervalMs}ms)`);
}

function stopProducer() {
  if (!isProducing) return;
  
  isProducing = false;
  clearInterval(producerInterval);
  console.log('Transaction producer stopped');
}

app.post('/transactions/producer/start', (req, res) => {
  const interval = parseInt(req.body.interval) || 2000;
  startProducer(interval);
  
  res.json({
    success: true,
    message: `Transaction producer started with ${interval}ms interval`
  });
});

app.post('/transactions/producer/stop', (req, res) => {
  stopProducer();
  
  res.json({
    success: true,
    message: 'Transaction producer stopped'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  stopProducer();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints: http://localhost:${PORT}/transactions, /stats, /users`);
  
  // Start producing transactions automatically
  startProducer(3000); // Every 3 seconds
});

module.exports = { app, server, wss };
