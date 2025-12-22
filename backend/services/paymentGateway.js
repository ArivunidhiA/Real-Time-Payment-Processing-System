const Stripe = require('stripe');
const axios = require('axios');
const logger = require('../utils/logger');

class PaymentGateway {
  constructor() {
    this.gateway = process.env.PAYMENT_GATEWAY || 'stripe';
    this.stripe = null;
    
    // Initialize Stripe if configured
    if (this.gateway === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });
    }
  }

  /**
   * Process payment through configured gateway
   */
  async processPayment(transaction) {
    try {
      switch (this.gateway) {
        case 'stripe':
          return await this.processStripePayment(transaction);
        case 'square':
          return await this.processSquarePayment(transaction);
        case 'paypal':
          return await this.processPayPalPayment(transaction);
        case 'mock':
        default:
          return await this.processMockPayment(transaction);
      }
    } catch (error) {
      logger.logError(error, {
        transactionId: transaction.transactionId,
        gateway: this.gateway
      });
      throw error;
    }
  }

  /**
   * Process payment via Stripe
   */
  async processStripePayment(transaction) {
    if (!this.stripe) {
      throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY.');
    }

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(transaction.amount * 100), // Convert to cents
        currency: transaction.currency || 'usd',
        metadata: {
          transactionId: transaction.transactionId,
          userId: transaction.userId.toString(),
          merchant: transaction.merchant
        },
        description: transaction.description || `Payment to ${transaction.merchant}`
      });

      return {
        gateway: 'stripe',
        paymentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'APPROVED' : 'PENDING',
        gatewayResponse: {
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status
        }
      };
    } catch (error) {
      logger.logError(error, {
        transactionId: transaction.transactionId,
        gateway: 'stripe'
      });
      
      return {
        gateway: 'stripe',
        status: 'DECLINED',
        declineReason: error.type === 'card_error' ? 'CARD_DECLINED' : 'GATEWAY_ERROR',
        gatewayError: error.message
      };
    }
  }

  /**
   * Process payment via Square
   */
  async processSquarePayment(transaction) {
    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
      throw new Error('Square not configured. Please set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID.');
    }

    try {
      const response = await axios.post(
        'https://connect.squareup.com/v2/payments',
        {
          source_id: transaction.paymentMethodId || 'CASH', // In real app, this would be a card token
          amount_money: {
            amount: Math.round(transaction.amount * 100),
            currency: transaction.currency || 'USD'
          },
          idempotency_key: transaction.idempotencyKey || transaction.transactionId
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2023-10-18'
          },
          timeout: 10000
        }
      );

      const payment = response.data.payment;
      return {
        gateway: 'square',
        paymentId: payment.id,
        status: payment.status === 'COMPLETED' ? 'APPROVED' : 'PENDING',
        gatewayResponse: payment
      };
    } catch (error) {
      logger.logError(error, {
        transactionId: transaction.transactionId,
        gateway: 'square'
      });
      
      return {
        gateway: 'square',
        status: 'DECLINED',
        declineReason: 'GATEWAY_ERROR',
        gatewayError: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Process payment via PayPal
   */
  async processPayPalPayment(transaction) {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
    }

    try {
      // First, get access token
      const authResponse = await axios.post(
        process.env.PAYPAL_ENVIRONMENT === 'production' 
          ? 'https://api.paypal.com/v1/oauth2/token'
          : 'https://api.sandbox.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_CLIENT_SECRET
          },
          timeout: 10000
        }
      );

      const accessToken = authResponse.data.access_token;

      // Create payment
      const paymentResponse = await axios.post(
        process.env.PAYPAL_ENVIRONMENT === 'production'
          ? 'https://api.paypal.com/v1/payments/payment'
          : 'https://api.sandbox.paypal.com/v1/payments/payment',
        {
          intent: 'sale',
          payer: {
            payment_method: 'paypal'
          },
          transactions: [{
            amount: {
              total: transaction.amount.toFixed(2),
              currency: transaction.currency || 'USD'
            },
            description: transaction.description || `Payment to ${transaction.merchant}`
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const payment = paymentResponse.data;
      return {
        gateway: 'paypal',
        paymentId: payment.id,
        status: payment.state === 'approved' ? 'APPROVED' : 'PENDING',
        gatewayResponse: payment
      };
    } catch (error) {
      logger.logError(error, {
        transactionId: transaction.transactionId,
        gateway: 'paypal'
      });
      
      return {
        gateway: 'paypal',
        status: 'DECLINED',
        declineReason: 'GATEWAY_ERROR',
        gatewayError: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Mock payment processing (for development/testing)
   */
  async processMockPayment(transaction) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    // Simulate 90% approval rate for demo (more realistic)
    const approved = Math.random() > 0.10;
    
    return {
      gateway: 'mock',
      paymentId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: approved ? 'APPROVED' : 'DECLINED',
      declineReason: approved ? null : 'MOCK_DECLINED',
      gatewayResponse: {
        mock: true,
        processingTime: Math.random() * 100
      }
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId, amount, reason = null) {
    try {
      switch (this.gateway) {
        case 'stripe':
          if (!this.stripe) throw new Error('Stripe not configured');
          const refund = await this.stripe.refunds.create({
            payment_intent: paymentId,
            amount: Math.round(amount * 100),
            reason: reason || 'requested_by_customer'
          });
          return { success: true, refundId: refund.id };
        
        case 'square':
          // Square refund implementation
          return { success: true, message: 'Square refund not implemented' };
        
        case 'paypal':
          // PayPal refund implementation
          return { success: true, message: 'PayPal refund not implemented' };
        
        default:
          return { success: true, message: 'Mock refund' };
      }
    } catch (error) {
      logger.logError(error, { paymentId, gateway: this.gateway });
      throw error;
    }
  }
}

module.exports = new PaymentGateway();

