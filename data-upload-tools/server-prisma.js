// Pacific Sands Analytics API with Prisma Database Integration
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Pacific Sands Analytics API with Prisma',
        version: '2.0.0',
        status: 'operational',
        database: 'prisma-postgres',
        endpoints: [
            '/health',
            '/api/data/upload',
            '/api/analytics/insights',
            '/api/storage/stats',
            '/api/data/rates',
            '/api/data/occupancy'
        ],
        timestamp: new Date().toISOString()
    });
});

// Health check with database status
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Get record counts
        const [rateCount, occupancyCount, insightCount] = await Promise.all([
            prisma.rateRecord.count(),
            prisma.occupancyRecord.count(),
            prisma.insight.count()
        ]);

        res.json({ 
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
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Data upload endpoint with Prisma
app.post('/api/data/upload', authenticateAPI, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { data_type, data, source, filename } = req.body;
        
        if (!data_type || !data) {
            return res.status(400).json({ 
                error: 'Missing required fields: data_type, data' 
            });
        }

        // Validate data_type
        const validTypes = ['rates', 'occupancy', 'bookings', 'reviews', 'competitors', 'mentions', 'insights'];
        if (!validTypes.includes(data_type)) {
            return res.status(400).json({ 
                error: `Invalid data_type. Must be one of: ${validTypes.join(', ')}` 
            });
        }

        const records = Array.isArray(data) ? data : [data];
        let uploadedCount = 0;

        // Process different data types
        if (data_type === 'rates') {
            const rateRecords = records.map(record => ({
                date: new Date(record.date || record.Date || record['Stay Date'] || new Date()),
                roomType: record.room_type || record.RoomType || record['Room Type'] || 'Standard',
                rate: parseFloat(record.rate || record.Rate || record.ADR || record['Daily Rate'] || 0),
                channel: record.channel || record.Channel || record['Booking Source'] || 'Direct',
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
                date: new Date(record.date || record.Date || record['Stay Date'] || new Date()),
                roomType: record.room_type || record.RoomType || record['Room Type'] || 'Standard',
                occupancyRate: parseFloat(record.occupancy_rate || record.OccupancyRate || record['Occupancy Rate'] || record.occupancy || 0),
                roomsSold: parseInt(record.rooms_sold || record.RoomsSold || record['Rooms Sold'] || 0),
                roomsAvailable: parseInt(record.rooms_available || record.RoomsAvailable || record['Rooms Available'] || record.inventory || 0),
                source: source || 'csv_upload',
                filename: filename || 'unknown',
                metadata: { originalRecord: record }
            }));

            await prisma.occupancyRecord.createMany({
                data: occupancyRecords,
                skipDuplicates: true
            });
            uploadedCount = occupancyRecords.length;

        } else {
            // For other data types, store as insights
            const insight = await prisma.insight.create({
                data: {
                    text: `${data_type} data uploaded: ${records.length} records from ${filename}`,
                    source: source || 'csv_upload',
                    confidence: 0.7,
                    impact: 'medium',
                    metadata: { 
                        data_type, 
                        filename, 
                        recordCount: records.length,
                        sampleRecord: records[0]
                    }
                }
            });
            uploadedCount = records.length;
        }

        // Record upload metadata
        const processingTime = Date.now() - startTime;
        await prisma.uploadMetadata.create({
            data: {
                filename: filename || 'unknown',
                dataType: data_type,
                recordsCount: uploadedCount,
                source: source || 'csv_upload',
                processingTimeMs: processingTime
            }
        });

        res.json({
            success: true,
            records_processed: uploadedCount,
            message: `Successfully uploaded ${uploadedCount} ${data_type} records to Prisma database`,
            processing_time_ms: processingTime,
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

// Analytics insights endpoint
app.get('/api/analytics/insights', authenticateAPI, async (req, res) => {
    try {
        const { date_from, date_to, limit = 100 } = req.query;

        // Get data summary
        const [rateCount, occupancyCount, insightCount] = await Promise.all([
            prisma.rateRecord.count(),
            prisma.occupancyRecord.count(),
            prisma.insight.count()
        ]);

        // Get recent rates with date filtering if provided
        const whereClause = {};
        if (date_from && date_to) {
            whereClause.date = {
                gte: new Date(date_from),
                lte: new Date(date_to)
            };
        }

        const recentRates = await prisma.rateRecord.findMany({
            where: whereClause,
            take: parseInt(limit),
            orderBy: { date: 'desc' },
            select: { 
                rate: true, 
                roomType: true, 
                date: true,
                channel: true 
            }
        });

        const avgRate = recentRates.length > 0 
            ? recentRates.reduce((sum, r) => sum + r.rate, 0) / recentRates.length
            : 0;

        // Get stored insights
        const storedInsights = await prisma.insight.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            data_summary: {
                total_rate_records: rateCount,
                total_occupancy_records: occupancyCount,
                total_insights: insightCount,
                total_records: rateCount + occupancyCount + insightCount,
                date_range: date_from && date_to ? { from: date_from, to: date_to } : null
            },
            insights: [
                {
                    title: "Data Collection Status",
                    description: `${rateCount} rate records and ${occupancyCount} occupancy records in Prisma database`,
                    impact: "high",
                    confidence: 1.0
                },
                {
                    title: "Average Daily Rate Analysis",
                    description: `Current average daily rate: $${avgRate.toFixed(2)} based on recent ${recentRates.length} records`,
                    impact: "high", 
                    confidence: 0.9
                },
                ...storedInsights.map(insight => ({
                    title: insight.text.substring(0, 50) + '...',
                    description: insight.text,
                    impact: insight.impact,
                    confidence: insight.confidence,
                    source: insight.source
                }))
            ],
            recent_rates: recentRates,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            error: 'Analytics failed',
            details: error.message
        });
    }
});

// Storage statistics
app.get('/api/storage/stats', authenticateAPI, async (req, res) => {
    try {
        const [
            rateStats,
            occupancyStats,
            rateCount,
            occupancyCount,
            insightCount,
            uploadStats
        ] = await Promise.all([
            prisma.rateRecord.groupBy({
                by: ['roomType'],
                _count: { id: true },
                _avg: { rate: true }
            }),
            prisma.occupancyRecord.groupBy({
                by: ['roomType'],
                _count: { id: true },
                _avg: { occupancyRate: true }
            }),
            prisma.rateRecord.count(),
            prisma.occupancyRecord.count(),
            prisma.insight.count(),
            prisma.uploadMetadata.findMany({
                take: 10,
                orderBy: { uploadedAt: 'desc' }
            })
        ]);

        res.json({
            storage_stats: {
                rates: { count: rateCount },
                occupancy: { count: occupancyCount },
                insights: { count: insightCount }
            },
            room_type_breakdown: {
                rates: rateStats.map(stat => ({
                    roomType: stat.roomType,
                    count: stat._count.id,
                    avgRate: stat._avg.rate
                })),
                occupancy: occupancyStats.map(stat => ({
                    roomType: stat.roomType,
                    count: stat._count.id,
                    avgOccupancy: stat._avg.occupancyRate
                }))
            },
            recent_uploads: uploadStats,
            total_records: rateCount + occupancyCount + insightCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Storage stats error:', error);
        res.status(500).json({
            error: 'Storage stats failed',
            details: error.message
        });
    }
});

// Get rates data
app.get('/api/data/rates', authenticateAPI, async (req, res) => {
    try {
        const { date_from, date_to, room_type, limit = 100, offset = 0 } = req.query;
        
        const whereClause = {};
        if (date_from && date_to) {
            whereClause.date = {
                gte: new Date(date_from),
                lte: new Date(date_to)
            };
        }
        if (room_type) {
            whereClause.roomType = room_type;
        }

        const rates = await prisma.rateRecord.findMany({
            where: whereClause,
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { date: 'desc' }
        });

        res.json({ 
            rates, 
            count: rates.length,
            query_params: { date_from, date_to, room_type, limit, offset }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get occupancy data  
app.get('/api/data/occupancy', authenticateAPI, async (req, res) => {
    try {
        const { date_from, date_to, room_type, limit = 100, offset = 0 } = req.query;
        
        const whereClause = {};
        if (date_from && date_to) {
            whereClause.date = {
                gte: new Date(date_from),
                lte: new Date(date_to)
            };
        }
        if (room_type) {
            whereClause.roomType = room_type;
        }

        const occupancy = await prisma.occupancyRecord.findMany({
            where: whereClause,
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { date: 'desc' }
        });

        res.json({ 
            occupancy, 
            count: occupancy.length,
            query_params: { date_from, date_to, room_type, limit, offset }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🏨 Pacific Sands Analytics API with Prisma running on port ${PORT}`);
    console.log(`🗄️  Database: Connected to Prisma PostgreSQL`);
});

module.exports = app;