// GPT Interaction Tracking API
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// POST: Log a GPT interaction
export async function POST(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const startTime = Date.now();

    // Create interaction record
    const interaction = await prisma.gPTInteraction.create({
      data: {
        interactionType: body.interactionType,
        endpoint: body.endpoint,
        user: body.user || 'Sandy',
        requestData: body.requestData,
        requestSummary: body.requestSummary,
        responseData: body.responseData,
        responseSummary: body.responseSummary,
        responseTime: body.responseTime || Date.now() - startTime,
        dataPoints: body.dataPoints,
        confidence: body.confidence,
        category: body.category,
        tags: body.tags,
        businessValue: body.businessValue,
        actionTaken: body.actionTaken
      }
    });

    // Update daily summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = await prisma.gPTUsageSummary.upsert({
      where: { date: today },
      update: {
        totalQueries: { increment: body.interactionType === 'query' ? 1 : 0 },
        totalResponses: { increment: body.interactionType === 'response' ? 1 : 0 },
        analyticsQueries: { increment: body.endpoint?.includes('analytics') ? 1 : 0 },
        forecastQueries: { increment: body.endpoint?.includes('forecast') ? 1 : 0 },
        knowledgeQueries: { increment: body.endpoint?.includes('knowledge') ? 1 : 0 },
        insightsStored: { increment: body.interactionType === 'insight_stored' ? 1 : 0 },
        dataPointsAnalyzed: { increment: body.dataPoints || 0 }
      },
      create: {
        date: today,
        totalQueries: body.interactionType === 'query' ? 1 : 0,
        totalResponses: body.interactionType === 'response' ? 1 : 0,
        analyticsQueries: body.endpoint?.includes('analytics') ? 1 : 0,
        forecastQueries: body.endpoint?.includes('forecast') ? 1 : 0,
        knowledgeQueries: body.endpoint?.includes('knowledge') ? 1 : 0,
        insightsStored: body.interactionType === 'insight_stored' ? 1 : 0,
        dataPointsAnalyzed: body.dataPoints || 0
      }
    });

    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
      message: 'Interaction logged successfully'
    });

  } catch (error) {
    console.error('GPT tracking error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to log interaction'
    }, { status: 500 });
  }
}

// GET: Retrieve GPT interactions and analytics
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'summary';
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (view) {
      case 'summary':
        // Get daily summaries
        const summaries = await prisma.gPTUsageSummary.findMany({
          where: { date: { gte: startDate } },
          orderBy: { date: 'desc' }
        });

        // Get recent insights
        const recentInsights = await prisma.gPTInsight.findMany({
          where: { generatedAt: { gte: startDate } },
          orderBy: { generatedAt: 'desc' },
          take: 10
        });

        // Calculate totals
        const totals = summaries.reduce((acc, summary) => ({
          totalQueries: acc.totalQueries + summary.totalQueries,
          totalResponses: acc.totalResponses + summary.totalResponses,
          totalInsights: acc.totalInsights + summary.insightsStored,
          dataPointsAnalyzed: acc.dataPointsAnalyzed + summary.dataPointsAnalyzed
        }), { totalQueries: 0, totalResponses: 0, totalInsights: 0, dataPointsAnalyzed: 0 });

        return NextResponse.json({
          success: true,
          period: `${days} days`,
          totals,
          dailySummaries: summaries,
          recentInsights: recentInsights.map(insight => ({
            id: insight.id,
            title: insight.title,
            type: insight.insightType,
            priority: insight.priority,
            generatedAt: insight.generatedAt,
            implemented: insight.implemented
          }))
        });

      case 'interactions':
        // Get detailed interactions
        const interactions = await prisma.gPTInteraction.findMany({
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'desc' },
          take: 100
        });

        return NextResponse.json({
          success: true,
          period: `${days} days`,
          interactions: interactions.map(i => ({
            id: i.id,
            timestamp: i.timestamp,
            type: i.interactionType,
            endpoint: i.endpoint,
            summary: i.requestSummary || i.responseSummary,
            responseTime: i.responseTime,
            category: i.category,
            businessValue: i.businessValue
          }))
        });

      case 'insights':
        // Get all insights
        const insights = await prisma.gPTInsight.findMany({
          where: { generatedAt: { gte: startDate } },
          orderBy: { generatedAt: 'desc' }
        });

        const implementedCount = insights.filter(i => i.implemented).length;
        const highPriorityCount = insights.filter(i => i.priority === 'high').length;

        return NextResponse.json({
          success: true,
          period: `${days} days`,
          totalInsights: insights.length,
          implementedCount,
          highPriorityCount,
          insights: insights
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid view parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('GPT tracking retrieval error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve tracking data'
    }, { status: 500 });
  }
}

// Store a GPT-generated insight
export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const insight = await prisma.gPTInsight.create({
      data: {
        insightType: body.insightType,
        title: body.title,
        content: body.content,
        summary: body.summary,
        dataSource: body.dataSource,
        dateRange: body.dateRange,
        confidence: body.confidence,
        priority: body.priority || 'medium',
        actionable: body.actionable !== false,
        category: body.category,
        tags: body.tags,
        potentialImpact: body.potentialImpact
      }
    });

    return NextResponse.json({
      success: true,
      insightId: insight.id,
      message: 'Insight stored successfully'
    });

  } catch (error) {
    console.error('Insight storage error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to store insight'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}