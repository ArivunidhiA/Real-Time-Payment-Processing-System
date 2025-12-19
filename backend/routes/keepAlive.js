const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /keep-alive - Simple endpoint for keep-alive pings
 * This endpoint is lightweight and responds quickly
 */
router.get('/keep-alive', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}));

module.exports = router;

