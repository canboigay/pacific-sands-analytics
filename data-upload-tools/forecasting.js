import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get historical data for forecasting
    const historicalRates = await prisma.rateData.findMany({
      take: 30,
      orderBy: { date: 'desc' }
    });
    
    if (historicalRates.length === 0) {
      return res.json({
        forecast: [],
        message: 'No historical data available for forecasting'
      });
    }
    
    // Simple moving average forecast
    const avgRate = historicalRates.reduce((acc, r) => acc + r.rate, 0) / historicalRates.length;
    const trend = historicalRates[0].rate > historicalRates[historicalRates.length - 1].rate ? 0.02 : -0.02;
    
    // Generate 30-day forecast
    const forecast = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const predictedRate = avgRate * (1 + (trend * i));
      
      forecast.push({
        date: targetDate.toISOString().split('T')[0],
        predictedRate: Math.round(predictedRate * 100) / 100,
        confidence: 0.85 - (i * 0.01),
        factors: 'Historical trend analysis'
      });
    }
    
    return res.json({
      forecast,
      baseRate: avgRate,
      trend: trend > 0 ? 'increasing' : 'decreasing',
      recommendation: predictedRate > avgRate ? 
        'Consider raising rates based on positive trend' : 
        'Monitor market conditions for rate adjustments'
    });
    
  } catch (error) {
    console.error('Forecasting error:', error);
    return res.status(500).json({ error: 'Forecasting failed' });
  }
}
