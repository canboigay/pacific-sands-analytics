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
  
  const { action } = req.query;
  
  try {
    switch(action) {
      case 'store':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required for storing' });
        }
        
        const { type, content, metadata } = req.body;
        const knowledge = await prisma.knowledge.create({
          data: {
            type: type || 'insight',
            content,
            metadata: metadata || {}
          }
        });
        
        return res.json({ success: true, id: knowledge.id });
        
      case 'retrieve':
        const { type: filterType, limit = 10 } = req.query;
        const items = await prisma.knowledge.findMany({
          where: filterType ? { type: filterType } : {},
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        });
        
        return res.json({ knowledge: items });
        
      case 'synthesis':
        const allKnowledge = await prisma.knowledge.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' }
        });
        
        const synthesis = {
          totalInsights: allKnowledge.length,
          categories: [...new Set(allKnowledge.map(k => k.type))],
          recentTopics: allKnowledge.slice(0, 5).map(k => ({
            type: k.type,
            preview: k.content.substring(0, 100)
          }))
        };
        
        return res.json({ synthesis });
        
      default:
        return res.json({ 
          message: 'Specify action: store, retrieve, or synthesis',
          method: req.method 
        });
    }
  } catch (error) {
    console.error('Knowledge error:', error);
    return res.status(500).json({ error: 'Knowledge operation failed' });
  }
}
