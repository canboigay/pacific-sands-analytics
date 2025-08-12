import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AgentResponse } from '@/lib/agents/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query, roomType = 'All', dates = [], occupancy = 0 } = await request.json();

    // Get relevant data
    const [occupancyData, competitorRates, historicalRates] = await Promise.all([
      prisma.occupancyData.findMany({
        where: {
          roomType,
          occupancyRate: { gte: occupancy - 0.1, lte: occupancy + 0.1 }
        },
        take: 30,
        orderBy: { date: 'desc' }
      }),
      prisma.rateShop.findMany({
        where: { roomType },
        take: 20,
        orderBy: { checkInDate: 'desc' }
      }),
      prisma.occupancyData.findMany({
        where: { roomType },
        select: { adr: true, occupancyRate: true },
        take: 100,
        orderBy: { date: 'desc' }
      })
    ]);

    // Calculate optimal pricing
    const avgCompetitorRate = competitorRates.reduce((sum, r) => sum + (r.compRate || 0), 0) / competitorRates.length;
    const avgHistoricalADR = historicalRates.reduce((sum, r) => sum + (r.adr || 0), 0) / historicalRates.length;
    
    // Pricing algorithm
    let recommendedRate = avgHistoricalADR;
    let confidence = 0.7;
    const insights = [];
    const actions = [];

    if (occupancy > 0.85) {
      recommendedRate *= 1.15; // 15% premium for high occupancy
      confidence = 0.9;
      insights.push('High occupancy detected - premium pricing recommended');
      actions.push('Increase rates by 15% for high-demand periods');
    } else if (occupancy < 0.6) {
      recommendedRate *= 0.92; // 8% discount for low occupancy
      confidence = 0.85;
      insights.push('Low occupancy detected - competitive pricing recommended');
      actions.push('Offer 8% discount to stimulate demand');
    }

    if (avgCompetitorRate && recommendedRate > avgCompetitorRate * 1.2) {
      recommendedRate = avgCompetitorRate * 1.15;
      insights.push('Adjusted to remain competitive with market rates');
    }

    const response: AgentResponse = {
      agent: 'pricing',
      recommendation: `Recommended rate for ${roomType}: $${Math.round(recommendedRate)}`,
      confidence,
      data: {
        recommendedRate: Math.round(recommendedRate),
        currentOccupancy: occupancy,
        avgCompetitorRate: Math.round(avgCompetitorRate),
        historicalADR: Math.round(avgHistoricalADR),
        pricePosition: recommendedRate > avgCompetitorRate ? 'premium' : 'competitive'
      },
      dataPoints: occupancyData.length + competitorRates.length,
      insights,
      actions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Pricing agent error:', error);
    return NextResponse.json({
      error: 'Pricing agent failed',
      message: error.message
    }, { status: 500 });
  }
}
