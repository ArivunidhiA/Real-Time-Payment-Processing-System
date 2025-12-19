const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Database helper functions
const db = {
  // Get user by ID
  async getUserById(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  // Update user balance
  async updateUserBalance(userId, newBalance) {
    const query = 'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(query, [newBalance, userId]);
  },

  // Insert transaction
  async insertTransaction(transaction) {
    const query = `
      INSERT INTO transactions (
        transaction_id, user_id, amount, merchant, status, timestamp,
        decline_reason, processing_latency, payment_method, currency,
        description, ip_address, device_fingerprint, risk_score,
        metadata, retry_count, idempotency_key, gateway, gateway_payment_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;
    const values = [
      transaction.transactionId,
      transaction.userId,
      transaction.amount,
      transaction.merchant,
      transaction.status,
      transaction.timestamp || new Date(),
      transaction.declineReason || null,
      transaction.processingLatency || null,
      transaction.paymentMethod || 'card',
      transaction.currency || 'USD',
      transaction.description || null,
      transaction.ipAddress || null,
      transaction.deviceFingerprint || null,
      transaction.riskScore || null,
      transaction.metadata ? JSON.stringify(transaction.metadata) : null,
      transaction.retryCount || 0,
      transaction.idempotencyKey || null,
      transaction.gateway || null,
      transaction.gatewayPaymentId || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get user by email
  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Create user
  async createUser(userData) {
    const query = `
      INSERT INTO users (email, password_hash, balance, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, balance, role, created_at
    `;
    const values = [
      userData.email,
      userData.passwordHash,
      userData.balance || 0,
      userData.role || 'user'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update user
  async updateUser(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(updates.passwordHash);
    }
    if (updates.balance !== undefined) {
      fields.push(`balance = $${paramCount++}`);
      values.push(updates.balance);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      return await this.getUserById(userId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, balance, role, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Insert audit log
  async insertAuditLog(logData) {
    const query = `
      INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      logData.action,
      logData.entityType || null,
      logData.entityId || null,
      logData.userId || null,
      logData.changes ? JSON.stringify(logData.changes) : null,
      logData.ipAddress || null,
      logData.userAgent || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get latest transactions
  async getLatestTransactions(limit = 50) {
    const query = `
      SELECT t.*, u.balance as user_balance
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.timestamp DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },

  // Get transaction statistics
  async getTransactionStats() {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_transactions,
        COUNT(CASE WHEN status = 'DECLINED' THEN 1 END) as declined_transactions,
        AVG(CASE WHEN status = 'APPROVED' THEN amount END) as avg_approved_amount,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as total_volume,
        COUNT(CASE WHEN timestamp > NOW() - INTERVAL '1 minute' THEN 1 END) as transactions_last_minute
      FROM transactions
    `;
    const result = await pool.query(query);
    return result.rows[0];
  },

  // Get volume per minute for the last hour
  async getVolumePerMinute() {
    const query = `
      SELECT 
        DATE_TRUNC('minute', timestamp) as minute,
        COUNT(*) as transaction_count,
        SUM(amount) as volume
      FROM transactions
      WHERE timestamp > NOW() - INTERVAL '1 hour'
      GROUP BY DATE_TRUNC('minute', timestamp)
      ORDER BY minute DESC
      LIMIT 60
    `;
    const result = await pool.query(query);
    return result.rows;
  }
};

module.exports = { pool, db };
