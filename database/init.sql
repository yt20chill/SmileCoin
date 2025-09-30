-- Database initialization script for Tourist Rewards Blockchain Infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wallets table for mapping user IDs to blockchain addresses
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('tourist', 'restaurant')),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction indexing for fast queries
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    transaction_fee DECIMAL(36, 18),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('daily_issuance', 'restaurant_transfer', 'expiration')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP
);

-- API usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Network monitoring
CREATE TABLE network_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_name VARCHAR(50) NOT NULL,
    block_number BIGINT NOT NULL,
    gas_price DECIMAL(36, 18) NOT NULL,
    is_healthy BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_transactions_addresses ON blockchain_transactions(from_address, to_address);
CREATE INDEX idx_transactions_status ON blockchain_transactions(status);
CREATE INDEX idx_transactions_type ON blockchain_transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON blockchain_transactions(created_at);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(wallet_address);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_network_status_created_at ON network_status(created_at);

-- Insert initial data for development
INSERT INTO network_status (network_name, block_number, gas_price, is_healthy, response_time_ms)
VALUES ('hardhat', 0, 20000000000, true, 50);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for wallets table
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();