import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AgentResponse } from '@/lib/agents/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query, budget = 10000, channel = 'all', campaign = 'general' } = await request.json();

    // Get marketing-relevant data
    const [lowOccupancyPeriods, competitorRates, revenueByRoom] = await Promise.all([
      prisma.occupancyData.findMany({
        where: { occupancyRate: { lt: 0.6 } },
        orderBy: { date: 'asc' },
        take: 30
      }),
      prisma.rateShop.findMany({
        orderBy: { checkInDate: 'desc' },
        take: 20
      }),
      prisma.occupancyData.groupBy({
        by: ['roomType'],
        _sum: { revenue: true },
        _avg: { occupancyRate: true }
      })
    ]);

    const insights = [];
    const actions = [];
    let confidence = 0.8;

    // Identify marketing opportunities
    if (lowOccupancyPeriods.length > 0) {
      const dates = lowOccupancyPeriods.map(p => new Date(p.date).toLocaleDateString());
      insights.push(`${lowOccupancyPeriods.length} low occupancy dates identified for targeted campaigns`);
      actions.push(`Launch "Escape to Tofino" campaign for: ${dates.slice(0, 5).join(', ')}`);
    }

    // Competitive positioning
    const ourAvgRate = 532; // From previous data
    const compAvgRate = competitorRates.reduce((sum, r) => sum + (r.compRate || 0), 0) / competitorRates.length;
    
    if (ourAvgRate > compAvgRate * 1.1) {
      insights.push('Premium positioning vs competitors - emphasize unique value');
      actions.push('Highlight exclusive beachfront access and premium amenities');
    } else {
      insights.push('Competitive pricing advantage - promote value');
      actions.push('Launch "Best Value on the Beach" campaign');
    }

    // Budget allocation
    const budgetAllocation = {
      digital: Math.round(budget * 0.6),
      social: Math.round(budget * 0.25),
      partnerships: Math.round(budget * 0.15)
    };

    actions.push(`Allocate $${budgetAllocation.digital} to digital advertising`);
    actions.push(`Invest $${budgetAllocation.social} in social media campaigns`);
    actions.push(`Reserve $${budgetAllocation.partnerships} for local partnerships`);

    // Target markets
    const topRevRoom = revenueByRoom.reduce((best, current) => 
      (current._sum.revenue || 0) > (best._sum.revenue || 0) ? current : best
    );
    
    insights.push(`${topRevRoom.roomType} generates highest revenue - target families/groups`);

    const response: AgentResponse = {
      agent: 'marketing',
      recommendation: `Focus marketing budget on digital channels (60%) targeting low occupancy periods. Emphasize ${ourAvgRate > compAvgRate ? 'premium experience' : 'exceptional value'}.`,
      confidence,
      data: {
        budget,
        budgetAllocation,
        lowOccupancyDates: lowOccupancyPeriods.length,
        competitivePosition: ourAvgRate > compAvgRate ? 'premium' : 'value',
        topRevenueRoom: topRevRoom.roomType,
        campaigns: ['Escape to Tofino', 'Summer Beach Paradise', 'Romantic Winter Getaway']
      },
      dataPoints: lowOccupancyPeriods.length + competitorRates.length,
      insights,
      actions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Marketing agent error:', error);
    return NextResponse.json({
      error: 'Marketing agent failed',
      message: error.message
    }, { status: 500 });
  }
}
