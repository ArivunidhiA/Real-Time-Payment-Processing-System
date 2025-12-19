/**
 * Keep-Alive Service
 * Prevents Render free tier from spinning down by pinging the service
 * Runs every 5 minutes to keep the service active
 */

const axios = require('axios');
const logger = require('./logger');

class KeepAliveService {
  constructor(serviceUrl, intervalMinutes = 5) {
    this.serviceUrl = serviceUrl;
    this.intervalMinutes = intervalMinutes;
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Ping the service to keep it alive
   */
  async ping() {
    try {
      const response = await axios.get(`${this.serviceUrl}/api/health`, {
        timeout: 5000
      });
      
      logger.info('Keep-alive ping successful', {
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      logger.logError(error, {
        service: 'keepAlive',
        url: this.serviceUrl
      });
      return false;
    }
  }

  /**
   * Start the keep-alive service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Keep-alive service is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = this.intervalMinutes * 60 * 1000;

    // Ping immediately
    this.ping();

    // Then ping at intervals
    this.intervalId = setInterval(() => {
      this.ping();
    }, intervalMs);

    logger.info('Keep-alive service started', {
      intervalMinutes: this.intervalMinutes,
      serviceUrl: this.serviceUrl
    });
  }

  /**
   * Stop the keep-alive service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('Keep-alive service stopped');
  }
}

module.exports = KeepAliveService;

