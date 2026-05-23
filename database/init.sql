-- Create database (run this first in PostgreSQL)
CREATE DATABASE service_yatra;

-- Connect to database
\c service_yatra;

-- Enable PostGIS for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Categories table (will be dynamic)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    name_hindi VARCHAR(100),
    icon_name VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial categories
INSERT INTO categories (name, icon_name, display_order) VALUES
('Electrician', 'Zap', 1),
('Plumber', 'Droplets', 2),
('Carpenter', 'Wrench', 3),
('AC Repair', 'Wind', 4),
('Home Cleaning', 'Sparkles', 5),
('RO Repair', 'Droplets', 6),
('Painter', 'Brush', 7),
('Bike Mechanic', 'Bike', 8),
('Tuition Teacher', 'BookOpen', 9);

-- Providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    phone_number VARCHAR(13) NOT NULL,
    whatsapp_number VARCHAR(13) NOT NULL,
    experience_years DECIMAL(3,1) DEFAULT 0,
    location GEOMETRY(POINT, 4326),
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(6),
    profile_photo_url TEXT,
    base_price DECIMAL(10,2),
    is_verified BOOLEAN DEFAULT FALSE,
    is_emergency BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(13) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP table for authentication
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(13) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample provider data
INSERT INTO providers (business_name, owner_name, category_id, phone_number, whatsapp_number, experience_years, location, city, pincode, base_price, is_verified, is_emergency) VALUES
('Rajesh Electricals', 'Rajesh Kumar', 1, '+919876543210', '+919876543210', 8, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 'Bangalore', '560001', 399, true, true),
('Quick Plumbing Solutions', 'Suresh Yadav', 2, '+919876543211', '+919876543211', 12, ST_SetSRID(ST_MakePoint(77.5947, 12.9717), 4326), 'Bangalore', '560001', 499, true, true);