-- AI Manager Skills Platform - Database Initialization
-- This script runs automatically when the PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database (if not exists, for manual setup)
-- Note: The database is created by docker-compose via POSTGRES_DB env var

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ai_manager_skills TO postgres;

-- Create schema version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Insert initial version
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema creation')
ON CONFLICT (version) DO NOTHING;

-- Note: SQLAlchemy models will create the actual tables on first startup
-- This file is for any PostgreSQL-specific initialization
