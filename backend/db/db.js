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
      INSERT INTO transactions (transaction_id, user_id, amount, merchant, status, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      transaction.transactionId,
      transaction.userId,
      transaction.amount,
      transaction.merchant,
      transaction.status,
      transaction.timestamp
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
