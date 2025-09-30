-- Initialize the tourist_rewards database
-- This file runs when the PostgreSQL container starts

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for location-based queries (optional, for future use)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create indexes for better performance on location queries
-- These will be created by Prisma migrations, but we can prepare the database

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Tourist Rewards database initialized successfully';
END $$;