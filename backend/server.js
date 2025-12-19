const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  });
}

const routes = require('./routes');
const TransactionProducer = require('./kafka/producer');
const TransactionConsumer = require('./kafka/consumer');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
});

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Real-Time Payment Processing System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      transactions: '/api/transactions',
      stats: '/api/stats',
      auth: '/api/auth'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  logger.info('New WebSocket client connected', { ip: clientIp });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to real-time payment stream',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    logger.info('WebSocket client disconnected', { ip: clientIp });
  });

  ws.on('error', (error) => {
    logger.logError(error, { service: 'websocket', ip: clientIp });
  });

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000); // Every 30 seconds

  ws.on('close', () => {
    clearInterval(heartbeatInterval);
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
    
    logger.info('Kafka components initialized successfully');
  } catch (error) {
    logger.logError(error, { service: 'kafka_initialization' });
    // Don't exit the process, allow the server to start without Kafka for development
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close WebSocket connections
  wss.clients.forEach(client => {
    client.close();
  });
  
  // Stop Kafka components
  if (producer) {
    producer.stopProducing();
    await producer.disconnect().catch(err => logger.logError(err));
  }
  
  if (consumer) {
    consumer.stopConsuming();
    await consumer.disconnect().catch(err => logger.logError(err));
  }
  
  // Give time for cleanup
  setTimeout(() => {
    logger.info('Shutdown complete');
    process.exit(0);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server running on ws://localhost:${PORT}/stream`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  logger.info(`Keep-alive: http://localhost:${PORT}/api/keep-alive`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize Kafka components after server starts
  initializeKafka();
  
  // Start keep-alive service if enabled (prevents Render spin-down)
  if (process.env.ENABLE_KEEP_ALIVE === 'true' && process.env.SERVICE_URL) {
    const KeepAliveService = require('./utils/keepAlive');
    const keepAlive = new KeepAliveService(
      process.env.SERVICE_URL,
      parseInt(process.env.KEEP_ALIVE_INTERVAL || '5')
    );
    keepAlive.start();
    logger.info('Keep-alive service started', {
      url: process.env.SERVICE_URL,
      interval: process.env.KEEP_ALIVE_INTERVAL || '5 minutes'
    });
  }
});

module.exports = { app, server, wss };
