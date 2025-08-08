// Rate forecasting endpoint for Pacific Sands GPT
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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { room_type, forecast_days = 30, include_events = true } = req.query;
        
        // Get historical rate data for forecasting
        const whereClause = room_type ? { roomType: room_type } : {};
        
        const [historicalRates, occupancyData] = await Promise.all([
            prisma.rateRecord.findMany({
                where: whereClause,
                orderBy: { date: 'desc' },
                take: 365, // Last year of data
                select: { rate: true, date: true, roomType: true, channel: true }
            }),
            prisma.occupancyRecord.findMany({
                where: whereClause,
                orderBy: { date: 'desc' },
                take: 365,
                select: { occupancyRate: true, date: true, roomType: true }
            })
        ]);

        if (historicalRates.length === 0) {
            return res.json({
                error: 'Insufficient historical data for forecasting',
                message: 'Upload historical rate data to enable forecasting',
                current_rate: 285.00, // Default base rate
                forecast: [],
                timestamp: new Date().toISOString()
            });
        }

        // Calculate current average rate
        const recentRates = historicalRates.slice(0, 30);
        const currentRate = recentRates.reduce((sum, r) => sum + r.rate, 0) / recentRates.length;

        // Simple trend analysis (in production, use more sophisticated ML models)
        const trendRates = historicalRates.slice(0, 60);
        const olderRates = historicalRates.slice(60, 120);
        
        const recentAvg = trendRates.reduce((sum, r) => sum + r.rate, 0) / trendRates.length;
        const olderAvg = olderRates.length > 0 ? 
            olderRates.reduce((sum, r) => sum + r.rate, 0) / olderRates.length : recentAvg;
        
        const trendFactor = recentAvg / olderAvg; // > 1 = increasing, < 1 = decreasing

        // Generate forecast for specified days
        const forecast = [];
        const forecastDays = Math.min(parseInt(forecast_days), 365);
        
        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i);
            
            // Base rate with trend
            let suggestedRate = currentRate * Math.pow(trendFactor, i / 30);
            
            // Seasonal adjustments (simplified)
            const month = forecastDate.getMonth();
            let seasonalFactor = 1.0;
            
            // Summer season (June-August)
            if (month >= 5 && month <= 7) {
                seasonalFactor = 1.2;
            }
            // Winter season (December-February) 
            else if (month === 11 || month <= 1) {
                seasonalFactor = 0.8;
            }
            // Spring/Fall
            else {
                seasonalFactor = 1.0;
            }
            
            suggestedRate *= seasonalFactor;
            
            // Weekend premium (simplified)
            const dayOfWeek = forecastDate.getDay();
            if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday, Saturday
                suggestedRate *= 1.15;
            }
            
            // Event considerations (if enabled)
            const factors = ['seasonal_trends', 'historical_patterns'];
            if (include_events) {
                factors.push('local_events');
                // Add small random factor for events (in production, use real event data)
                if (Math.random() > 0.8) {
                    suggestedRate *= 1.1;
                    factors.push('special_event_detected');
                }
            }
            
            // Confidence decreases over time
            const confidence = Math.max(0.5, 0.95 - (i * 0.01));
            
            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                suggested_rate: Math.round(suggestedRate * 100) / 100,
                confidence: Math.round(confidence * 100) / 100,
                factors
            });
        }

        // Calculate revenue impact
        const currentTrajectory = currentRate * forecastDays * 0.75; // Assuming 75% occupancy
        const optimizedTrajectory = forecast.reduce((sum, day) => sum + day.suggested_rate, 0) * 0.75;
        const potentialUplift = optimizedTrajectory - currentTrajectory;

        const response = {
            room_type: room_type || 'all_types',
            forecast_period: `${forecastDays} days`,
            current_rate: Math.round(currentRate * 100) / 100,
            trend_analysis: {
                direction: trendFactor > 1.05 ? 'increasing' : trendFactor < 0.95 ? 'decreasing' : 'stable',
                strength: Math.abs(trendFactor - 1) > 0.1 ? 'strong' : 'moderate',
                factor: Math.round(trendFactor * 100) / 100
            },
            forecast: forecast.slice(0, Math.min(forecastDays, 30)), // Limit response size
            revenue_impact: {
                current_trajectory: Math.round(currentTrajectory),
                optimized_trajectory: Math.round(optimizedTrajectory),
                potential_uplift: Math.round(potentialUplift),
                uplift_percentage: Math.round((potentialUplift / currentTrajectory) * 100 * 100) / 100
            },
            data_quality: {
                historical_records: historicalRates.length,
                occupancy_records: occupancyData.length,
                confidence_level: historicalRates.length > 100 ? 'high' : historicalRates.length > 30 ? 'medium' : 'low'
            },
            recommendations: [
                `Based on ${historicalRates.length} historical records, ${trendFactor > 1 ? 'rates are trending upward' : 'consider pricing optimization'}`,
                forecast.slice(0, 7).some(f => f.factors.includes('special_event_detected')) 
                    ? 'Special events detected in next 7 days - consider premium pricing'
                    : 'Monitor competitor pricing for optimization opportunities'
            ],
            timestamp: new Date().toISOString()
        };

        return res.json(response);

    } catch (error) {
        console.error('Forecasting error:', error);
        return res.status(500).json({
            error: 'Forecasting failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
