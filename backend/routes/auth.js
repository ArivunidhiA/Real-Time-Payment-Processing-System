const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/db');
const { generateToken, authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /auth/register - Register new user
 */
router.post('/register',
  authLimiter,
  validate(schemas.registerUser),
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.createUser({
      email,
      passwordHash,
      balance: 0,
      role: role || 'user'
    });

    // Generate token
    const token = generateToken(user);

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  })
);

/**
 * POST /auth/login - Login user
 */
router.post('/login',
  authLimiter,
  validate(schemas.loginUser),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await db.getUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.logSecurity('Failed login attempt', { email });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          balance: user.balance
        },
        token
      }
    });
  })
);

/**
 * GET /auth/me - Get current user
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await db.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        balance: user.balance,
        created_at: user.created_at
      }
    });
  })
);

module.exports = router;

