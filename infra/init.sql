-- VV Monorepo Database Initialization
-- This file runs when the Postgres container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database if it doesn't exist (though docker-compose should handle this)
-- Note: This might not be necessary since POSTGRES_DB is set in docker-compose