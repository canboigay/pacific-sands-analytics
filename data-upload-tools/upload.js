import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Auth check
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { data_type, data, filename } = req.body;
  
  try {
    let result;
    
    switch(data_type) {
      case 'rates':
        result = await prisma.rateData.createMany({
          data: data.map(item => ({
            date: new Date(item.date),
            rate: parseFloat(item.rate),
            roomType: item.room_type || 'Standard',
            occupancy: item.occupancy ? parseFloat(item.occupancy) : null,
            source: filename || 'upload'
          }))
        });
        break;
        
      case 'competitors':
        result = await prisma.competitorData.createMany({
          data: data.map(item => ({
            competitor: item.competitor,
            date: new Date(item.date),
            rate: parseFloat(item.rate),
            roomType: item.room_type,
            source: filename || 'upload'
          }))
        });
        break;
        
      case 'feedback':
        result = await prisma.customerFeedback.createMany({
          data: data.map(item => ({
            date: new Date(item.date),
            rating: parseFloat(item.rating),
            comment: item.comment,
            category: item.category,
            sentiment: item.sentiment,
            source: filename || 'upload'
          }))
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid data_type' });
    }
    
    return res.json({ 
      success: true, 
      message: `Uploaded ${result.count} records`,
      data_type 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
