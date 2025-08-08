const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Data storage (in production, use a proper database)
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

// Analytics endpoints
app.get('/api/analytics/insights', authenticateAPI, async (req, res) => {
    const { date_from, date_to, room_type } = req.query;
    
    // Mock insights based on stored data
    const insights = {
        pricing_insights: {
            average_rate: 285.50,
            rate_trend: "increasing",
            seasonal_patterns: [
                { period: "summer", avg_rate: 325.00, occupancy: 92 },
                { period: "winter", avg_rate: 245.00, occupancy: 68 }
            ]
        },
        occupancy_insights: {
            average_occupancy: 78.5,
            peak_periods: ["July", "August", "Memorial Day"],
            low_periods: ["January", "February"]
        },
        recommendations: [
            {
                title: "Increase summer rates",
                description: "Current summer rates are 12% below market average",
                impact: "high",
                confidence: 0.87
            }
        ]
    };
    
    res.json(insights);
});

app.get('/api/analytics/competitors', authenticateAPI, async (req, res) => {
    const { metric = 'pricing', period = '30days' } = req.query;
    
    const competitorAnalysis = {
        pacific_sands: {
            value: 285.50,
            rank: 2,
            trend: "stable"
        },
        competitors: [
            { name: "Coastal Inn", value: 265.00, rank: 3, difference_from_us: -20.50 },
            { name: "Seaside Resort", value: 310.00, rank: 1, difference_from_us: 24.50 },
            { name: "Ocean View Lodge", value: 275.00, rank: 4, difference_from_us: -10.50 }
        ],
        market_position: {
            percentile: 75,
            opportunities: ["Weekend premium pricing", "Package deals"]
        }
    };
    
    res.json(competitorAnalysis);
});

app.get('/api/analytics/sentiment', authenticateAPI, async (req, res) => {
    const { source = 'all', period = '90days' } = req.query;
    
    const sentimentData = {
        overall_sentiment: {
            positive: 0.72,
            negative: 0.15,
            neutral: 0.13
        },
        trending_topics: [
            { topic: "Ocean view rooms", sentiment: "positive", mentions: 24 },
            { topic: "Check-in process", sentiment: "negative", mentions: 12 },
            { topic: "Restaurant quality", sentiment: "positive", mentions: 18 }
        ],
        improvement_areas: ["Faster check-in", "WiFi reliability"],
        strengths: ["Ocean views", "Staff friendliness", "Location"]
    };
    
    res.json(sentimentData);
});

// Data upload endpoint
app.post('/api/data/upload', authenticateAPI, async (req, res) => {
    try {
        const { data_type, data, source, scraped_at } = req.body;
        
        if (!data_type || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Store data based on type
        if (analyticsData[data_type]) {
            analyticsData[data_type].push(...data);
        } else {
            analyticsData[data_type] = data;
        }
        
        // Save to file backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `/Users/simeong/data-upload-tools/uploaded_${data_type}_${timestamp}.json`;
        
        await fs.writeFile(filename, JSON.stringify({
            data_type,
            data,
            source,
            scraped_at,
            uploaded_at: new Date().toISOString()
        }, null, 2));
        
        const insights = [];
        if (data_type === 'competitors') {
            insights.push('Competitor pricing data updated - consider rate adjustments');
        }
        if (data_type === 'reviews') {
            insights.push('New reviews analyzed - check sentiment trends');
        }
        
        res.json({
            success: true,
            records_processed: data.length,
            message: `Successfully uploaded ${data.length} ${data_type} records`,
            insights_generated: insights
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Forecasting endpoint
app.get('/api/forecasting/rates', authenticateAPI, async (req, res) => {
    const { room_type, forecast_days = 30, include_events = true } = req.query;
    
    // Generate mock forecast data
    const forecast = [];
    const baseRate = 285.50;
    
    for (let i = 1; i <= forecast_days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Add some variation and seasonality
        const seasonalFactor = 1 + (Math.sin(i / 7) * 0.1); // Weekly pattern
        const randomFactor = 0.95 + (Math.random() * 0.1);
        const suggestedRate = Math.round(baseRate * seasonalFactor * randomFactor * 100) / 100;
        
        forecast.push({
            date: date.toISOString().split('T')[0],
            suggested_rate: suggestedRate,
            confidence: 0.75 + (Math.random() * 0.2),
            factors: ["historical_data", "competitor_rates", "seasonal_trends"]
        });
    }
    
    res.json({
        current_rate: baseRate,
        forecast: forecast,
        revenue_impact: {
            current_trajectory: baseRate * forecast_days * 0.8,
            optimized_trajectory: forecast.reduce((sum, day) => sum + day.suggested_rate, 0) * 0.8,
            potential_uplift: 0.15
        }
    });
});

// Knowledge base endpoints
app.post('/api/knowledge/store', authenticateAPI, async (req, res) => {
    try {
        const insight = {
            id: Date.now().toString(),
            ...req.body,
            created_at: new Date().toISOString()
        };
        
        analyticsData.insights.push(insight);
        
        res.json({
            success: true,
            insight_id: insight.id,
            message: 'Insight stored successfully'
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to store insight' });
    }
});

app.get('/api/knowledge/retrieve', authenticateAPI, async (req, res) => {
    const { search_query, insight_type, tags } = req.query;
    
    let insights = analyticsData.insights;
    
    // Filter by type
    if (insight_type) {
        insights = insights.filter(i => i.insight_type === insight_type);
    }
    
    // Filter by search query
    if (search_query) {
        insights = insights.filter(i => 
            i.title?.toLowerCase().includes(search_query.toLowerCase()) ||
            i.content?.toLowerCase().includes(search_query.toLowerCase())
        );
    }
    
    // Filter by tags
    if (tags) {
        const tagList = tags.split(',').map(t => t.trim().toLowerCase());
        insights = insights.filter(i => 
            i.tags?.some(tag => tagList.includes(tag.toLowerCase()))
        );
    }
    
    res.json({ insights });
});

app.get('/api/knowledge/synthesis', authenticateAPI, async (req, res) => {
    const { focus_area, time_period } = req.query;
    
    const synthesis = {
        executive_summary: `Based on ${analyticsData.insights.length} qualitative insights and quantitative data analysis, key opportunities in ${focus_area} have been identified.`,
        key_findings: [
            {
                finding: "Customer service response time impacts satisfaction scores by 23%",
                confidence: 0.87,
                supporting_data: ["review_analysis", "operational_data"]
            },
            {
                finding: "Weekend premium pricing opportunity of 15-20%",
                confidence: 0.92,
                supporting_data: ["competitor_rates", "occupancy_data"]
            }
        ],
        recommendations: [
            {
                action: "Implement dynamic weekend pricing",
                impact: "high",
                timeline: "30 days",
                expected_revenue_impact: "$12,500/month"
            }
        ]
    };
    
    res.json(synthesis);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Pacific Sands Analytics API running on port ${PORT}`);
    console.log(`API accessible at: http://localhost:${PORT}`);
});

module.exports = app;