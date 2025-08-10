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
  
  const { endpoint } = req.query;
  
  try {
    switch(endpoint) {
      case 'insights':
        const rates = await prisma.rateData.findMany({
          take: 100,
          orderBy: { date: 'desc' }
        });
        const avgRate = rates.reduce((acc, r) => acc + r.rate, 0) / rates.length;
        return res.json({
          averageRate: avgRate || 0,
          totalRecords: rates.length,
          latestRate: rates[0]?.rate || 0,
          trend: 'stable'
        });
        
      case 'competitors':
        const competitors = await prisma.competitorData.findMany({
          take: 50,
          orderBy: { date: 'desc' }
        });
        return res.json({ competitors });
        
      case 'sentiment':
        const feedback = await prisma.customerFeedback.findMany({
          take: 50,
          orderBy: { date: 'desc' }
        });
        return res.json({ feedback });
        
      default:
        return res.json({ message: 'Specify endpoint: insights, competitors, or sentiment' });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
