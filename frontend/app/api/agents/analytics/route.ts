import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AgentResponse } from '@/lib/agents/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query, metric = 'overview', period = 30 } = await request.json();

    // Comprehensive analytics
    const [
      totalRecords,
      avgMetrics,
      recentTrends,
      topInsights,
      agentActivity
    ] = await Promise.all([
      prisma.occupancyData.count(),
      prisma.occupancyData.aggregate({
        _avg: { occupancyRate: true, adr: true, revPAR: true }
      }),
      prisma.monthlyMetrics.findMany({
        take: 6,
        orderBy: { month: 'desc' }
      }),
      prisma.gPTInsight.findMany({
        where: { priority: 'high', implemented: false },
        take: 5,
        orderBy: { generatedAt: 'desc' }
      }),
      prisma.gPTInteraction.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const insights = [];
    const actions = [];
    let confidence = 0.9;

    // Performance summary
    insights.push(`Average occupancy: ${(avgMetrics._avg.occupancyRate * 100).toFixed(1)}%`);
    insights.push(`Average ADR: $${avgMetrics._avg.adr?.toFixed(2)}`);
    insights.push(`RevPAR: $${avgMetrics._avg.revPAR?.toFixed(2)}`);

    // Trend analysis
    if (recentTrends.length >= 2) {
      const trend = recentTrends[0].totalRevenue > recentTrends[1].totalRevenue ? 'increasing' : 'decreasing';
      const change = ((recentTrends[0].totalRevenue - recentTrends[1].totalRevenue) / recentTrends[1].totalRevenue * 100).toFixed(1);
      insights.push(`Revenue trend: ${trend} by ${Math.abs(Number(change))}%`);
    }

    // Unimplemented high-priority insights
    if (topInsights.length > 0) {
      insights.push(`${topInsights.length} high-priority insights pending implementation`);
      topInsights.forEach(insight => {
        actions.push(`Implement: ${insight.title}`);
      });
    }

    // AI system usage
    insights.push(`AI system processed ${agentActivity} queries in last ${period} days`);

    // Key recommendations
    if (avgMetrics._avg.occupancyRate < 0.7) {
      actions.push('Focus on occupancy improvement strategies');
      confidence = 0.85;
    }
    if (avgMetrics._avg.adr < 500) {
      actions.push('Review pricing strategy for premium positioning');
    }

    const response: AgentResponse = {
      agent: 'analytics',
      recommendation: `System analyzing ${totalRecords.toLocaleString()} data points. Key focus: ${avgMetrics._avg.occupancyRate < 0.7 ? 'Improve occupancy' : 'Optimize revenue'}.`,
      confidence,
      data: {
        totalDataPoints: totalRecords,
        avgOccupancy: (avgMetrics._avg.occupancyRate * 100).toFixed(1),
        avgADR: avgMetrics._avg.adr?.toFixed(2),
        avgRevPAR: avgMetrics._avg.revPAR?.toFixed(2),
        revenueHistory: recentTrends.map(t => ({
          month: t.month,
          revenue: t.totalRevenue,
          occupancy: t.avgOccupancy
        })),
        pendingInsights: topInsights.length,
        aiActivity: agentActivity
      },
      dataPoints: totalRecords,
      insights,
      actions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics agent error:', error);
    return NextResponse.json({
      error: 'Analytics agent failed',
      message: error.message
    }, { status: 500 });
  }
}
