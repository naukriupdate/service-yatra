const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
// Database connection using DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to database:', process.env.DB_NAME);
        release();
    }
});

// Test endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW(), current_database() as db_name');
        res.json({ 
            status: 'OK', 
            time: result.rows[0].now,
            database: result.rows[0].db_name
        });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY display_order');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all providers
app.get('/api/providers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM providers p
            JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Providers error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get nearby providers based on user's location
app.post('/api/providers/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 5 } = req.body;
        
        console.log('📍 Nearby search:', { latitude, longitude, radius });
        
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        // Get all providers with their coordinates
        const result = await pool.query(`
            SELECT 
                p.id,
                p.business_name,
                p.owner_name,
                p.category_id,
                p.phone_number,
                p.whatsapp_number,
                p.experience_years,
                p.city,
                p.pincode,
                p.base_price,
                p.is_verified,
                p.is_emergency,
                p.average_rating,
                p.total_reviews,
                p.is_approved,
                p.created_at,
                c.name as category_name,
                ST_X(p.location::geometry) as longitude,
                ST_Y(p.location::geometry) as latitude
            FROM providers p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_approved = true 
            AND p.location IS NOT NULL
        `);
        
        // Calculate distance using haversine formula
        const toRad = (value) => (value * Math.PI) / 180;
        
        const providersWithDistance = result.rows.map(provider => {
            const R = 6371; // Earth's radius in km
            const dLat = toRad(provider.latitude - latitude);
            const dLon = toRad(provider.longitude - longitude);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(latitude)) * Math.cos(toRad(provider.latitude)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            
            return {
                ...provider,
                distance_km: distance.toFixed(1)
            };
        });
        
        // Filter by radius and sort by distance
        const nearbyProviders = providersWithDistance
            .filter(p => parseFloat(p.distance_km) <= radius)
            .sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km))
            .slice(0, 20);
        
        console.log(`✅ Found ${nearbyProviders.length} nearby providers`);
        res.json(nearbyProviders);
        
    } catch (error) {
        console.error('❌ Nearby providers error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Categories API: http://localhost:${PORT}/api/categories`);
    console.log(`📊 Providers API: http://localhost:${PORT}/api/providers`);
    console.log(`📍 Nearby API: POST http://localhost:${PORT}/api/providers/nearby`);
});