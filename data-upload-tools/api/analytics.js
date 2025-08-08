// Analytics endpoint for Pacific Sands GPT
const { PrismaClient } = require('@prisma/client');

let prisma;
if (!global.prisma) {
    global.prisma = new PrismaClient();
}
prisma = global.prisma;

// API Key authentication
const authenticateAPI = (req) => {
    const authHeader = req.headers.authorization;
    const validKey = 'Bearer ps_me2w0k3e_x81fsv0yz3k';
    return authHeader === validKey;
};

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!authenticateAPI(req)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    const { method, query } = req;
    const { endpoint } = query;

    try {
        if (method === 'GET') {
            if (endpoint === 'insights') {
                return await getInsights(req, res);
            } else if (endpoint === 'competitors') {
                return await getCompetitorAnalysis(req, res);
            } else if (endpoint === 'sentiment') {
                return await getSentimentAnalysis(req, res);
            }
        }

        return res.status(404).json({ error: 'Endpoint not found' });

    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({
            error: 'Analytics failed',
            details: error.message
        });
    }
};

async function getInsights(req, res) {
    const { date_from, date_to, room_type } = req.query;

    try {
        // Build date filter
        const dateFilter = {};
        if (date_from && date_to) {
            dateFilter.date = {
                gte: new Date(date_from),
                lte: new Date(date_to)
            };
        }

        // Build room type filter
        const roomFilter = room_type ? { roomType: room_type } : {};

        // Get comprehensive analytics data
        const [
            rateRecords,
            occupancyRecords,
            insights,
            rateStats,
            occupancyStats
        ] = await Promise.all([
            prisma.rateRecord.findMany({
                where: { ...dateFilter, ...roomFilter },
                orderBy: { date: 'desc' },
                take: 100
            }),
            prisma.occupancyRecord.findMany({
                where: { ...dateFilter, ...roomFilter },
                orderBy: { date: 'desc' },
                take: 100
            }),
            prisma.insight.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.rateRecord.aggregate({
                where: { ...dateFilter, ...roomFilter },
                _avg: { rate: true },
                _min: { rate: true },
                _max: { rate: true },
                _count: true
            }),
            prisma.occupancyRecord.aggregate({
                where: { ...dateFilter, ...roomFilter },
                _avg: { occupancyRate: true },
                _count: true
            })
        ]);

        // Calculate insights
        const avgRate = rateStats._avg.rate || 0;
        const avgOccupancy = occupancyStats._avg.occupancyRate || 0;
        const dataPoints = rateStats._count + occupancyStats._count;

        // Determine trends (simplified analysis)
        const rateTrend = rateRecords.length > 10 ? 
            (rateRecords.slice(0, 5).reduce((sum, r) => sum + r.rate, 0) / 5) > 
            (rateRecords.slice(-5).reduce((sum, r) => sum + r.rate, 0) / 5) ? 'increasing' : 'decreasing'
            : 'stable';

        // Generate recommendations based on data
        const recommendations = [];
        
        if (avgRate > 0) {
            recommendations.push({
                title: "Rate Performance Analysis",
                description: `Current average rate is $${avgRate.toFixed(2)}. ${rateTrend === 'increasing' ? 'Rates are trending upward.' : 'Consider optimizing pricing strategy.'}`,
                impact: avgRate > 300 ? "high" : "medium",
                confidence: Math.min(0.9, 0.3 + (dataPoints * 0.01))
            });
        }

        if (avgOccupancy > 0) {
            recommendations.push({
                title: "Occupancy Optimization",
                description: `Average occupancy rate is ${avgOccupancy.toFixed(1)}%. ${avgOccupancy > 80 ? 'Strong performance - consider rate increases.' : 'Room for improvement in bookings.'}`,
                impact: avgOccupancy > 80 ? "high" : "medium", 
                confidence: 0.8
            });
        }

        // Add stored insights
        insights.forEach(insight => {
            recommendations.push({
                title: insight.text.substring(0, 50) + '...',
                description: insight.text,
                impact: insight.impact,
                confidence: insight.confidence
            });
        });

        const response = {
            data_summary: {
                total_rate_records: rateStats._count,
                total_occupancy_records: occupancyStats._count,
                date_range: date_from && date_to ? { from: date_from, to: date_to } : 'all_time',
                room_type_filter: room_type || 'all_types'
            },
            pricing_insights: {
                average_rate: avgRate,
                min_rate: rateStats._min.rate || 0,
                max_rate: rateStats._max.rate || 0,
                rate_trend: rateTrend,
                seasonal_patterns: [
                    { period: "summer", avg_rate: avgRate * 1.15, occupancy: Math.min(95, avgOccupancy * 1.2) },
                    { period: "winter", avg_rate: avgRate * 0.85, occupancy: Math.max(50, avgOccupancy * 0.8) }
                ],
                data_points: rateStats._count
            },
            occupancy_insights: {
                average_occupancy: avgOccupancy,
                peak_periods: avgOccupancy > 80 ? ["Current period showing strong performance"] : ["Opportunities for improvement"],
                low_periods: avgOccupancy < 60 ? ["Current period needs attention"] : ["Maintaining good performance"]
            },
            recommendations,
            recent_data: {
                latest_rates: rateRecords.slice(0, 10),
                latest_occupancy: occupancyRecords.slice(0, 10)
            },
            timestamp: new Date().toISOString()
        };

        return res.json(response);

    } catch (error) {
        console.error('Get insights error:', error);
        return res.status(500).json({ error: 'Failed to get insights', details: error.message });
    }
}

async function getCompetitorAnalysis(req, res) {
    const { metric = 'pricing', period = '30days' } = req.query;

    try {
        // This would typically come from competitor data collection
        // For now, we'll use insights and rate data to simulate competitor analysis
        const [rateStats, insights] = await Promise.all([
            prisma.rateRecord.aggregate({
                _avg: { rate: true },
                _count: true
            }),
            prisma.insight.findMany({
                where: {
                    text: {
                        contains: 'competitor',
                        mode: 'insensitive'
                    }
                },
                take: 5
            })
        ]);

        const ourAvgRate = rateStats._avg.rate || 285;
        
        // Simulated competitor data (in production, this would come from web scraping)
        const competitorData = [
            { name: "Seaside Resort", value: ourAvgRate * 1.1, rank: 1, difference_from_us: ourAvgRate * 0.1 },
            { name: "Ocean View Hotel", value: ourAvgRate * 0.95, rank: 3, difference_from_us: -ourAvgRate * 0.05 },
            { name: "Coastal Inn", value: ourAvgRate * 0.8, rank: 4, difference_from_us: -ourAvgRate * 0.2 }
        ];

        const response = {
            metric,
            period,
            pacific_sands: {
                value: ourAvgRate,
                rank: 2,
                trend: "stable"
            },
            competitors: competitorData,
            market_position: {
                percentile: 75,
                opportunities: [
                    "Consider premium pricing during peak season",
                    "Monitor Seaside Resort's pricing strategy",
                    "Leverage cost advantage over higher-priced competitors"
                ]
            },
            data_confidence: Math.min(0.9, 0.5 + (rateStats._count * 0.01)),
            competitive_insights: insights.map(insight => insight.text),
            timestamp: new Date().toISOString()
        };

        return res.json(response);

    } catch (error) {
        console.error('Competitor analysis error:', error);
        return res.status(500).json({ error: 'Failed to get competitor analysis', details: error.message });
    }
}

async function getSentimentAnalysis(req, res) {
    const { source = 'all', period = '90days' } = req.query;

    try {
        // Get insights that might contain sentiment information
        const sentimentInsights = await prisma.insight.findMany({
            where: {
                OR: [
                    { text: { contains: 'review', mode: 'insensitive' } },
                    { text: { contains: 'sentiment', mode: 'insensitive' } },
                    { text: { contains: 'satisfaction', mode: 'insensitive' } },
                    { text: { contains: 'feedback', mode: 'insensitive' } }
                ]
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        // Simulated sentiment analysis (in production, this would come from review scraping/NLP)
        const response = {
            source,
            period,
            overall_sentiment: {
                positive: 73.5,
                negative: 15.2,
                neutral: 11.3
            },
            trending_topics: [
                { topic: "Beach Access", sentiment: "positive", mentions: 45 },
                { topic: "Room Service", sentiment: "positive", mentions: 32 },
                { topic: "Wi-Fi Speed", sentiment: "negative", mentions: 18 },
                { topic: "Pool Area", sentiment: "positive", mentions: 28 }
            ],
            improvement_areas: [
                "Wi-Fi connectivity and speed",
                "Check-in process efficiency",
                "Breakfast variety"
            ],
            strengths: [
                "Beachfront location",
                "Friendly staff",
                "Clean facilities",
                "Ocean views"
            ],
            sentiment_trends: sentimentInsights.map(insight => ({
                insight: insight.text,
                confidence: insight.confidence,
                created_at: insight.createdAt
            })),
            recommendations: [
                "Focus on improving Wi-Fi infrastructure",
                "Leverage positive beach access feedback in marketing",
                "Address check-in process based on guest feedback"
            ],
            timestamp: new Date().toISOString()
        };

        return res.json(response);

    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return res.status(500).json({ error: 'Failed to get sentiment analysis', details: error.message });
    }
}
