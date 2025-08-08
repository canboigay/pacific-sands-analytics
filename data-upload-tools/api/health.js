// Health check endpoint for Vercel
const { PrismaClient } = require('@prisma/client');

let prisma;
if (!global.prisma) {
    global.prisma = new PrismaClient();
}
prisma = global.prisma;

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
};
