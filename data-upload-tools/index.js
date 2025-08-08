// Vercel serverless function - main entry point
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// API Key authentication
const authenticateAPI = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const validKey = 'Bearer ps_me2w0k3e_x81fsv0yz3k';
    
    if (!authHeader || authHeader !== validKey) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
};

// In-memory storage for Vercel serverless
let dataStorage = {
    rates: [],
    occupancy: [],
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
        endpoints: ['/health', '/api/data/upload', '/api/analytics/insights'],
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        storage: Object.keys(dataStorage).reduce((acc, key) => {
            acc[key] = dataStorage[key].length;
            return acc;
        }, {})
    });
});

// Data upload endpoint
app.post('/api/data/upload', authenticateAPI, async (req, res) => {
    try {
        const { data_type, data, source, filename } = req.body;
        
        if (!data_type || !data) {
            return res.status(400).json({ error: 'Missing required fields: data_type, data' });
        }

        // Validate data_type
        const validTypes = ['rates', 'occupancy', 'bookings', 'reviews', 'competitors', 'mentions', 'insights'];
        if (!validTypes.includes(data_type)) {
            return res.status(400).json({ error: `Invalid data_type. Must be one of: ${validTypes.join(', ')}` });
        }

        // Store data
        const records = Array.isArray(data) ? data : [data];
        
        // Add metadata to each record
        const enrichedRecords = records.map(record => ({
            ...record,
            _uploaded_at: new Date().toISOString(),
            _source: source || 'api',
            _filename: filename || 'unknown'
        }));

        dataStorage[data_type].push(...enrichedRecords);
        
        const insights = [];
        if (data_type === 'rates') {
            insights.push(`${records.length} new rate records processed`);
        } else if (data_type === 'occupancy') {
            insights.push(`${records.length} occupancy records updated`);
        }
        
        res.json({
            success: true,
            records_processed: records.length,
            message: `Successfully uploaded ${records.length} ${data_type} records`,
            total_stored: dataStorage[data_type].length,
            insights_generated: insights,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Upload failed', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Analytics insights
app.get('/api/analytics/insights', authenticateAPI, (req, res) => {
    const totalRates = dataStorage.rates.length;
    const totalOccupancy = dataStorage.occupancy.length;
    
    res.json({
        data_summary: {
            total_rate_records: totalRates,
            total_occupancy_records: totalOccupancy,
            total_records: Object.values(dataStorage).reduce((sum, arr) => sum + arr.length, 0)
        },
        insights: [
            {
                title: "Data Collection Status",
                description: `${totalRates} rate records and ${totalOccupancy} occupancy records available for analysis`,
                impact: "high",
                confidence: 1.0
            }
        ],
        timestamp: new Date().toISOString()
    });
});

// Storage stats
app.get('/api/storage/stats', authenticateAPI, (req, res) => {
    const stats = {};
    Object.keys(dataStorage).forEach(dataType => {
        stats[dataType] = {
            count: dataStorage[dataType].length,
            latest: dataStorage[dataType].length > 0 ? 
                dataStorage[dataType][dataStorage[dataType].length - 1]._uploaded_at : null
        };
    });
    
    res.json({
        storage_stats: stats,
        total_records: Object.values(dataStorage).reduce((sum, arr) => sum + arr.length, 0),
        timestamp: new Date().toISOString()
    });
});

// Export for Vercel
module.exports = app;