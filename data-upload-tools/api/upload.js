// Data upload endpoint for Pacific Sands GPT
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

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Authenticate
    if (!authenticateAPI(req)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    try {
        const { data_type, data, source, filename } = req.body;
        
        if (!data_type || !data) {
            return res.status(400).json({ 
                error: 'Missing required fields: data_type, data' 
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
            await prisma.insight.create({
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
        await prisma.uploadMetadata.create({
            data: {
                filename: filename || 'unknown',
                dataType: data_type,
                recordsCount: uploadedCount,
                source: source || 'csv_upload'
            }
        });

        return res.json({
            success: true,
            records_processed: uploadedCount,
            message: `Successfully uploaded ${uploadedCount} ${data_type} records to Prisma database`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            error: 'Upload failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};