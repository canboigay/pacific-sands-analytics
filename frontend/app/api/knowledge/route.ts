import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'retrieve';
    const searchQuery = searchParams.get('search_query');
    const tags = searchParams.get('tags');

    if (action === 'retrieve') {
      // Retrieve stored insights
      const insights = await prisma.gPTInsight.findMany({
        where: {
          ...(searchQuery && {
            OR: [
              { title: { contains: searchQuery } },
              { content: { contains: searchQuery } },
              { summary: { contains: searchQuery } }
            ]
          }),
          ...(tags && { tags: { contains: tags } })
        },
        orderBy: { generatedAt: 'desc' },
        take: 20
      });

      return NextResponse.json({
        insights: insights.map(i => ({
          id: i.id,
          title: i.title,
          content: i.content,
          confidence_level: i.confidence || 0.8,
          tags: i.tags ? i.tags.split(',') : [],
          created_at: i.generatedAt.toISOString()
        })),
        total_found: insights.length,
        search_parameters: {
          search_query: searchQuery,
          tags: tags
        },
        timestamp: new Date().toISOString()
      });
    } else if (action === 'synthesis') {
      // Synthesize insights
      const recentInsights = await prisma.gPTInsight.findMany({
        where: { priority: 'high' },
        orderBy: { generatedAt: 'desc' },
        take: 10
      });

      return NextResponse.json({
        synthesis: {
          total_insights: recentInsights.length,
          key_themes: ["Revenue optimization", "Occupancy trends", "Market positioning"],
          recommendations: recentInsights.slice(0, 3).map(i => ({
            title: i.title,
            summary: i.summary || i.content.substring(0, 100) + '...'
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error('Knowledge retrieval error:', error);
    return NextResponse.json({
      error: "Failed to retrieve knowledge",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action !== 'store') {
      return NextResponse.json({ error: "Invalid action for POST" }, { status: 400 });
    }

    const body = await request.json();
    const { insight_type, title, content, confidence_level, tags } = body;

    // Store the insight
    const insight = await prisma.gPTInsight.create({
      data: {
        insightType: insight_type || 'general',
        title: title,
        content: content,
        confidence: confidence_level || 0.8,
        tags: tags?.join(',') || '',
        priority: confidence_level > 0.8 ? 'high' : 'medium',
        category: insight_type,
        actionable: true
      }
    });

    // Also track this as a GPT interaction
    await prisma.gPTInteraction.create({
      data: {
        interactionType: 'knowledge_store',
        endpoint: '/api/knowledge',
        user: 'Sandy',
        requestData: body,
        requestSummary: title,
        responseData: { insight_id: insight.id },
        responseSummary: 'Insight stored successfully',
        confidence: confidence_level,
        category: insight_type
      }
    });

    return NextResponse.json({
      success: true,
      insight_id: insight.id,
      message: "Knowledge stored successfully",
      stored_data: {
        title: insight.title,
        type: insight.insightType,
        confidence: insight.confidence
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Knowledge storage error:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to store knowledge",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}