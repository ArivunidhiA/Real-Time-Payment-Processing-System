const Joi = require('joi');

/**
 * Validation schemas
 */
const schemas = {
  // Transaction creation schema
  createTransaction: Joi.object({
    userId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
      }),
    amount: Joi.number().positive().max(100000).precision(2).required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'number.max': 'Amount cannot exceed $100,000',
        'any.required': 'Amount is required'
      }),
    merchant: Joi.string().min(1).max(255).trim().required()
      .messages({
        'string.empty': 'Merchant name cannot be empty',
        'string.max': 'Merchant name cannot exceed 255 characters',
        'any.required': 'Merchant name is required'
      }),
    paymentMethod: Joi.string().valid('card', 'ach', 'wire', 'paypal', 'stripe').optional()
      .default('card'),
    currency: Joi.string().length(3).uppercase().optional()
      .default('USD')
      .messages({
        'string.length': 'Currency must be a 3-letter code (e.g., USD)'
      }),
    description: Joi.string().max(500).trim().optional()
      .allow('', null),
    metadata: Joi.object().optional(),
    idempotencyKey: Joi.string().max(255).optional()
  }),

  // User registration schema
  registerUser: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(8).max(128).required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
      }),
    role: Joi.string().valid('user', 'admin', 'merchant').optional()
      .default('user')
  }),

  // User login schema
  loginUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Update user schema
  updateUser: Joi.object({
    email: Joi.string().email().optional(),
    balance: Joi.number().min(0).precision(2).optional(),
    role: Joi.string().valid('user', 'admin', 'merchant').optional()
  }),

  // Query parameters schema
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional()
      .default(50)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    offset: Joi.number().integer().min(0).optional()
      .default(0),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }),

  // Producer control schema
  producerControl: Joi.object({
    interval: Joi.number().integer().min(100).max(60000).optional()
      .default(2000)
      .messages({
        'number.min': 'Interval must be at least 100ms',
        'number.max': 'Interval cannot exceed 60000ms (1 minute)'
      })
  })
};

/**
 * Validation middleware factory
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                 source === 'query' ? req.query : 
                 source === 'params' ? req.params : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request data with validated and sanitized data
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;

    next();
  };
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? obj.trim() : obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      sanitized[key] = value
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitization middleware
 */
function sanitize(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
}

module.exports = {
  schemas,
  validate,
  sanitize,
  sanitizeInput
};

