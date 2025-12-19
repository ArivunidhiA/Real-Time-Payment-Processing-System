const express = require('express');
const serverless = require('serverless-http');

// Import the Express app from backend
// Note: This is a simplified version for Netlify Functions
// For full functionality, you may need to adapt the server.js

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'netlify'
  });
});

// Import routes (you'll need to adapt routes.js for serverless)
// For now, we'll use a simplified approach
try {
  // Try to load routes if backend is available
  const routes = require('../../backend/routes');
  app.use('/', routes);
} catch (error) {
  console.error('Could not load backend routes:', error.message);
  
  // Fallback routes
  app.get('/transactions', (req, res) => {
    res.json({
      success: true,
      message: 'Backend not available in serverless mode',
      data: []
    });
  });
  
  app.get('/stats', (req, res) => {
    res.json({
      success: true,
      message: 'Backend not available in serverless mode',
      data: {}
    });
  });
}

// Export serverless handler
module.exports.handler = serverless(app);

