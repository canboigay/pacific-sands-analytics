import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AgentResponse } from '@/lib/agents/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query, guestType = 'all', metric = 'satisfaction' } = await request.json();

    // Get guest-related insights
    const [gptInsights, occupancyByType, seasonalTrends] = await Promise.all([
      prisma.gPTInsight.findMany({
        where: {
          category: { in: ['guest', 'experience', 'satisfaction'] }
        },
        take: 20,
        orderBy: { generatedAt: 'desc' }
      }),
      prisma.occupancyData.groupBy({
        by: ['roomType'],
        _avg: { occupancyRate: true },
        _count: true
      }),
      prisma.occupancyData.findMany({
        select: { date: true, occupancyRate: true, roomType: true },
        orderBy: { date: 'desc' },
        take: 90
      })
    ]);

    // Analyze guest preferences
    const insights = [];
    const actions = [];
    let confidence = 0.75;

    // Room type preferences
    const mostPopular = occupancyByType.reduce((best, current) => 
      (current._avg.occupancyRate || 0) > (best._avg.occupancyRate || 0) ? current : best
    );
    
    insights.push(`${mostPopular.roomType} is most popular with ${(mostPopular._avg.occupancyRate * 100).toFixed(1)}% occupancy`);

    // Seasonal patterns
    const summerOccupancy = seasonalTrends
      .filter(t => {
        const month = new Date(t.date).getMonth();
        return month >= 5 && month <= 8; // June-September
      })
      .reduce((sum, t) => sum + t.occupancyRate, 0) / seasonalTrends.length;

    if (summerOccupancy > 0.8) {
      insights.push('High guest demand during summer season');
      actions.push('Prepare enhanced summer guest experience packages');
      confidence = 0.85;
    }

    // Extract insights from GPT history
    const recentInsights = gptInsights
      .filter(i => i.confidence && i.confidence > 0.7)
      .slice(0, 3)
      .map(i => i.summary || i.title);
    
    insights.push(...recentInsights);

    // Guest experience recommendations
    actions.push('Implement personalized welcome messages for repeat guests');
    actions.push('Enhance beach equipment rental service');
    actions.push('Create local experience packages with Tofino partners');

    const response: AgentResponse = {
      agent: 'guest',
      recommendation: `Focus on enhancing ${mostPopular.roomType} experience as it drives highest occupancy. Summer season requires premium service delivery.`,
      confidence,
      data: {
        mostPopularRoom: mostPopular.roomType,
        avgOccupancy: (mostPopular._avg.occupancyRate * 100).toFixed(1),
        summerDemand: (summerOccupancy * 100).toFixed(1),
        guestInsights: recentInsights.length
      },
      dataPoints: occupancyByType.length + seasonalTrends.length,
      insights,
      actions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Guest agent error:', error);
    return NextResponse.json({
      error: 'Guest agent failed',
      message: error.message
    }, { status: 500 });
  }
}
