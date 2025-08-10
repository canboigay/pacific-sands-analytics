import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { sessionId, role, content } = req.body;
      if (!sessionId || !role || !content) {
        return res.status(400).json({ error: 'sessionId, role, and content are required' });
      }
      const message = await prisma.message.create({
        data: { sessionId, role, content }
      });
      return res.status(200).json(message);
    }

    if (req.method === 'GET') {
      const { sessionId, search } = req.query;
      if (typeof search === 'string') {
        const results = await prisma.message.findMany({
          where: {
            content: { contains: search, mode: 'insensitive' }
          },
          orderBy: { createdAt: 'asc' }
        });
        return res.status(200).json(results);
      }
      if (typeof sessionId === 'string') {
        const history = await prisma.message.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' }
        });
        return res.status(200).json(history);
      }
      return res.status(400).json({ error: 'sessionId or search query required' });
    }

    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Error handling request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
