import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AgentResponse } from '@/lib/agents/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query, currentRevenue = 0, targetRevenue = 0, period = 30 } = await request.json();

    // Get revenue data
    const [monthlyMetrics, paceReports, occupancyTrends] = await Promise.all([
      prisma.monthlyMetrics.findMany({
        take: 6,
        orderBy: { month: 'desc' }
      }),
      prisma.paceReport.findMany({
        take: 30,
        orderBy: { reportDate: 'desc' }
      }),
      prisma.occupancyData.groupBy({
        by: ['roomType'],
        _avg: {
          occupancyRate: true,
          adr: true,
          revenue: true
        }
      })
    ]);

    // Calculate revenue insights
    const avgMonthlyRevenue = monthlyMetrics.reduce((sum, m) => sum + m.totalRevenue, 0) / monthlyMetrics.length;
    const revenueGrowth = monthlyMetrics.length > 1 ? 
      ((monthlyMetrics[0].totalRevenue - monthlyMetrics[1].totalRevenue) / monthlyMetrics[1].totalRevenue) * 100 : 0;
    
    const insights = [];
    const actions = [];
    let confidence = 0.8;

    if (revenueGrowth > 5) {
      insights.push(`Strong revenue growth of ${revenueGrowth.toFixed(1)}% month-over-month`);
      confidence = 0.9;
    } else if (revenueGrowth < -5) {
      insights.push(`Revenue declining by ${Math.abs(revenueGrowth).toFixed(1)}% - immediate action needed`);
      actions.push('Implement revenue recovery strategies');
      confidence = 0.85;
    }

    // Room type performance
    const topPerformer = occupancyTrends.reduce((best, current) => 
      (current._avg.revenue || 0) > (best._avg.revenue || 0) ? current : best
    );
    
    insights.push(`${topPerformer.roomType} is top revenue generator`);
    actions.push(`Focus marketing on ${topPerformer.roomType} units`);

    // Revenue optimization recommendations
    const gapToTarget = targetRevenue - avgMonthlyRevenue;
    if (gapToTarget > 0) {
      const occupancyIncrease = (gapToTarget / avgMonthlyRevenue) * 100;
      actions.push(`Increase occupancy by ${occupancyIncrease.toFixed(1)}% to reach target`);
    }

    const response: AgentResponse = {
      agent: 'revenue',
      recommendation: `Current monthly average: $${Math.round(avgMonthlyRevenue).toLocaleString()}. ${gapToTarget > 0 ? `Need $${Math.round(gapToTarget).toLocaleString()} more to reach target.` : 'Exceeding target!'}`,
      confidence,
      data: {
        avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
        revenueGrowth: revenueGrowth.toFixed(1),
        topPerformer: topPerformer.roomType,
        gapToTarget: Math.round(gapToTarget),
        monthlyTrend: monthlyMetrics.map(m => ({
          month: m.month,
          revenue: m.totalRevenue
        }))
      },
      dataPoints: monthlyMetrics.length + paceReports.length,
      insights,
      actions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Revenue agent error:', error);
    return NextResponse.json({
      error: 'Revenue agent failed',
      message: error.message
    }, { status: 500 });
  }
}
