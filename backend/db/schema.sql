-- Create database (run this manually if needed)
-- CREATE DATABASE real_time_payments;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    decline_reason VARCHAR(255),
    processing_latency INTEGER,
    payment_method VARCHAR(50) DEFAULT 'card',
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    risk_score DECIMAL(5,2),
    metadata JSONB,
    retry_count INTEGER DEFAULT 0,
    idempotency_key VARCHAR(255) UNIQUE,
    gateway VARCHAR(50),
    gateway_payment_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    user_id INTEGER REFERENCES users(id),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_score ON transactions(risk_score);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_payment_id ON transactions(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert some sample users with balances
INSERT INTO users (id, email, balance, role) VALUES 
(1, 'user1@example.com', 10000.00, 'user'),
(2, 'user2@example.com', 5000.00, 'user'),
(3, 'user3@example.com', 15000.00, 'user'),
(4, 'user4@example.com', 2500.00, 'user'),
(5, 'admin@example.com', 8000.00, 'admin')
ON CONFLICT (id) DO NOTHING;
