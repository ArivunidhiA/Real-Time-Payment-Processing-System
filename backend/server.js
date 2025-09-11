const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const TransactionProducer = require('./kafka/producer');
const TransactionConsumer = require('./kafka/consumer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send welcome message
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

// Initialize Kafka components
let producer, consumer;

async function initializeKafka() {
  try {
    // Initialize producer
    producer = new TransactionProducer();
    await producer.connect();
    
    // Initialize consumer with WebSocket server
    consumer = new TransactionConsumer(wss);
    await consumer.connect();
    
    // Make consumer globally accessible for stats
    global.consumer = consumer;
    
    // Start consuming messages
    await consumer.startConsuming();
    
    // Start producing transactions (every 2 seconds)
    producer.startProducing(2000);
    
    console.log('Kafka components initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kafka components:', error);
    // Don't exit the process, allow the server to start without Kafka for development
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  if (producer) {
    producer.stopProducing();
    await producer.disconnect();
  }
  
  if (consumer) {
    consumer.stopConsuming();
    await consumer.disconnect();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  if (producer) {
    producer.stopProducing();
    await producer.disconnect();
  }
  
  if (consumer) {
    consumer.stopConsuming();
    await consumer.disconnect();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Initialize Kafka components after server starts
  initializeKafka();
});

module.exports = { app, server, wss };
