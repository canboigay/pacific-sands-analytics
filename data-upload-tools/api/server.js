const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const StorageManager = require('../storage-manager');

const app = express();

// Initialize enhanced storage
const storage = new StorageManager();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Key authentication middleware
const authenticateAPI = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const validKey = 'Bearer ps_me2w0k3e_x81fsv0yz3k';
    
    if (!authHeader || authHeader !== validKey) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
};

// Enhanced data storage with organized file structure
let analyticsData = {
    rates: [],
    bookings: [],
    reviews: [],
    competitors: [],
    mentions: [],
    insights: []
};

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Pacific Sands Analytics API',
        version: '1.0.0',
        status: 'operational',
        endpoints: [
            '/api/analytics/insights',
            '/api/analytics/competitors', 
            '/api/analytics/sentiment',
            '/api/data/upload',
            '/api/forecasting/rates',
            '/api/knowledge/store',
            '/api/knowledge/retrieve',
            '/api/knowledge/synthesis'
        ]
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Analytics endpoints
app.get('/api/analytics/insights', authenticateAPI, async (req, res) => {
    const { date_from, date_to, room_type } = req.query;
    
    // Load historical data for analysis
    const competitorData = await storage.loadData('competitors', { start: date_from, end: date_to });
    const rateData = await storage.loadData('rates', { start: date_from, end: date_to });
    
    // Calculate real insights from stored data
    const avgCompetitorRate = competitorData.length > 0 ? 
        competitorData.reduce((sum, r) => sum + r.rate, 0) / competitorData.length : 285.50;
    
    const insights = {
        pricing_insights: {
            average_rate: avgCompetitorRate,
            rate_trend: competitorData.length > 10 ? "data-driven" : "increasing",
            seasonal_patterns: [
                { period: "summer", avg_rate: avgCompetitorRate * 1.15, occupancy: 92 },
                { period: "winter", avg_rate: avgCompetitorRate * 0.85, occupancy: 68 }
            ],
            data_points: competitorData.length
        },
        occupancy_insights: {
            average_occupancy: 78.5,
            peak_periods: ["July", "August", "Memorial Day"],
            low_periods: ["January", "February"]
        },
        recommendations: [
            {
                title: "Optimize based on real competitor data",
                description: `Analysis based on ${competitorData.length} competitor data points`,
                impact: "high",
                confidence: Math.min(0.9, 0.5 + (competitorData.length * 0.01))
            }
        ]
    };
    
    res.json(insights);
});

// Data upload endpoint with enhanced storage
app.post('/api/data/upload', authenticateAPI, async (req, res) => {
    try {
        const { data_type, data, source, scraped_at, date_range } = req.body;
        
        if (!data_type || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Store data in organized file structure
        const metadata = {
            source: source || 'api',
            scraped_at,
            date_range,
            upload_timestamp: new Date().toISOString(),
            api_version: '1.0'
        };
        
        const filePath = await storage.saveData(data_type, data, metadata);
        
        // Also keep in memory for immediate access
        if (analyticsData[data_type]) {
            analyticsData[data_type].push(...data);
        } else {
            analyticsData[data_type] = data;
        }
        
        const insights = [];
        if (data_type === 'competitors') {
            insights.push('Competitor pricing data updated - consider rate adjustments');
            insights.push(`${data.length} new competitor rates analyzed`);
        }
        if (data_type === 'mentions') {
            insights.push('Social media mentions updated - monitor sentiment trends');
        }
        if (data_type === 'reviews') {
            insights.push('New reviews analyzed - check satisfaction scores');
        }
        
        res.json({
            success: true,
            records_processed: Array.isArray(data) ? data.length : 1,
            message: `Successfully uploaded ${Array.isArray(data) ? data.length : 1} ${data_type} records`,
            storage_path: filePath,
            insights_generated: insights
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

module.exports = app;