-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create ENUM types
-- Assuming some default values for the style enum. Modify as needed.
CREATE TYPE style_enum AS ENUM ('default', 'detailed', 'concise');

-- Create Tables

-- Note: "USER" is a reserved keyword in PostgreSQL, so it must be quoted.
CREATE TABLE "USER" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    google_sub VARCHAR(255) UNIQUE,
    setting_mbti VARCHAR(10),
    setting_intensity INTEGER,
    style style_enum
);

CREATE TABLE "CONVERSATION" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE "MESSAGE" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES "CONVERSATION"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- e.g., 'user', 'assistant' or 'system'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    content_len INTEGER,
    language VARCHAR(50),
    model_name VARCHAR(100),
    temperature DOUBLE PRECISION,
    embedding vector(1024)
);

CREATE TABLE "POST" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    msgs UUID[],
    hearts INTEGER DEFAULT 0
);

CREATE TABLE "COMMENT" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES "POST"(id) ON DELETE CASCADE,
    anonymous BOOLEAN DEFAULT FALSE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
