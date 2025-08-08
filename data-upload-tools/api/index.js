// Vercel serverless function for Pacific Sands Analytics with Prisma
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client once
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

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, url } = req;
    
    try {
        // Route handling
        if (method === 'GET' && url === '/') {
            return res.json({
                message: 'Pacific Sands Analytics API with Prisma',
                version: '2.0.0',
                status: 'operational',
                database: 'prisma-postgres',
                endpoints: [
                    '/health',
                    '/api/data/upload',
                    '/api/analytics/insights'
                ],
                timestamp: new Date().toISOString()
            });
        }

        if (method === 'GET' && url === '/health') {
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
                timestamp: new Date().toISOString(),
                records: {
                    rates: rateCount,
                    occupancy: occupancyCount,
                    insights: insightCount,
                    total: rateCount + occupancyCount + insightCount
                }
            });
        }

        if (method === 'POST' && url === '/api/data/upload') {
            if (!authenticateAPI(req)) {
                return res.status(401).json({ error: 'Invalid API key' });
            }

            const { data_type, data, source, filename } = req.body;
            
            if (!data_type || !data) {
                return res.status(400).json({ error: 'Missing required fields: data_type, data' });
            }

            const records = Array.isArray(data) ? data : [data];
            let uploadedCount = 0;

            if (data_type === 'rates') {
                const rateRecords = records.map(record => ({
                    date: new Date(record.date || record.Date || new Date()),
                    roomType: record.room_type || record.RoomType || 'Standard',
                    rate: parseFloat(record.rate || record.Rate || record.ADR || 0),
                    channel: record.channel || record.Channel || 'Direct',
                    source: source || 'csv_upload',
                    filename: filename || 'unknown',
                    metadata: { originalRecord: record }
                }));

                await prisma.rateRecord.createMany({
                    data: rateRecords,
                    skipDuplicates: true
                });
                uploadedCount = rateRecords.length;

            } else if (data_type === 'occupancy') {
                const occupancyRecords = records.map(record => ({
                    date: new Date(record.date || record.Date || new Date()),
                    roomType: record.room_type || record.RoomType || 'Standard',
                    occupancyRate: parseFloat(record.occupancy_rate || record.OccupancyRate || 0),
                    roomsSold: parseInt(record.rooms_sold || record.RoomsSold || 0),
                    roomsAvailable: parseInt(record.rooms_available || record.RoomsAvailable || 0),
                    source: source || 'csv_upload',
                    filename: filename || 'unknown',
                    metadata: { originalRecord: record }
                }));

                await prisma.occupancyRecord.createMany({
                    data: occupancyRecords,
                    skipDuplicates: true
                });
                uploadedCount = occupancyRecords.length;
            }

            return res.json({
                success: true,
                records_processed: uploadedCount,
                message: `Successfully uploaded ${uploadedCount} ${data_type} records`,
                timestamp: new Date().toISOString()
            });
        }

        // Default 404
        return res.status(404).json({ error: 'Not found' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}