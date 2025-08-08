// Vercel serverless function for Pacific Sands Analytics with Prisma
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client once (connection pooling for serverless)
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

    const { method, url } = req;
    
    try {
        // Main API info endpoint
        if (method === 'GET' && (url === '/' || url === '/api')) {
            return res.json({
                message: 'Pacific Sands Analytics API with Prisma',
                version: '2.0.0',
                status: 'operational',
                database: 'prisma-postgres',
                custom_gpt_ready: true,
                endpoints: {
                    analytics: {
                        insights: '/api/analytics?endpoint=insights',
                        competitors: '/api/analytics?endpoint=competitors', 
                        sentiment: '/api/analytics?endpoint=sentiment'
                    },
                    data: {
                        upload: '/api/upload',
                        rates: '/api/data/rates',
                        occupancy: '/api/data/occupancy'
                    },
                    forecasting: {
                        rates: '/api/forecasting'
                    },
                    knowledge: {
                        store: '/api/knowledge?action=store',
                        retrieve: '/api/knowledge?action=retrieve',
                        synthesis: '/api/knowledge?action=synthesis'
                    }
                },
                authentication: 'Bearer ps_me2w0k3e_x81fsv0yz3k',
                timestamp: new Date().toISOString()
            });
        }

        // Health check with database status
        if (method === 'GET' && url === '/health') {
            try {
                // Test database connection
                await prisma.$queryRaw`SELECT 1`;
                
                const [rateCount, occupancyCount, insightCount] = await Promise.all([
                    prisma.rateRecord.count(),
                    prisma.occupancyRecord.count(),
                    prisma.insight.count()
                ]);

                return res.json({
                    status: 'healthy',
                    database: 'connected',
                    custom_gpt_ready: true,
                    timestamp: new Date().toISOString(),
                    records: {
                        rates: rateCount,
                        occupancy: occupancyCount,
                        insights: insightCount,
                        total: rateCount + occupancyCount + insightCount
                    }
                });
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    database: 'disconnected',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // For other endpoints, provide helpful routing info
        return res.status(404).json({ 
            error: 'Endpoint not found',
            available_endpoints: [
                '/api/',
                '/health',
                '/api/analytics',
                '/api/upload',
                '/api/forecasting', 
                '/api/knowledge'
            ],
            message: 'This is the main API router. Use specific endpoint URLs for functionality.'
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}