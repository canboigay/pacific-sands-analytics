// GPT Proxy API - Logs interactions automatically
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// This endpoint acts as a proxy to log all GPT interactions
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const targetEndpoint = searchParams.get('endpoint') || '';
    const bypass = searchParams.get('bypass') || 'custom_gpt_integration';
    
    // Get request body
    const requestBody = await request.json();
    
    // Forward the request to the actual endpoint
    const targetUrl = `https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api${targetEndpoint}?bypass=${bypass}`;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseData = await response.json();
    const responseTime = Date.now() - startTime;
    
    // Log the interaction
    try {
      // Determine interaction type and category
      let interactionType = 'query';
      let category = 'general';
      let dataPoints = 0;
      let businessValue = '';
      let requestSummary = '';
      let responseSummary = '';
      
      if (targetEndpoint.includes('knowledge') && requestBody.action === 'store') {
        interactionType = 'insight_stored';
        category = 'knowledge';
        requestSummary = `Stored insight: ${requestBody.title || 'Untitled'}`;
        businessValue = 'Knowledge base enhancement';
      } else if (targetEndpoint.includes('analytics')) {
        interactionType = 'query';
        category = 'analytics';
        requestSummary = `Analytics query: ${requestBody.endpoint || 'insights'}`;
        dataPoints = responseData.data_summary?.total_rate_records || 0;
        businessValue = 'Data-driven decision support';
      } else if (targetEndpoint.includes('forecast')) {
        interactionType = 'forecast_generated';
        category = 'forecasting';
        requestSummary = `Forecast for ${requestBody.room_type || 'all rooms'}`;
        businessValue = 'Revenue optimization planning';
      }
      
      // Extract response summary
      if (responseData.recommendations) {
        responseSummary = `Generated ${responseData.recommendations.length} recommendations`;
      } else if (responseData.forecast) {
        responseSummary = `Forecast generated for ${responseData.forecast.length} periods`;
      } else if (responseData.insights) {
        responseSummary = `Retrieved ${responseData.insights.length} insights`;
      }
      
      await prisma.gPTInteraction.create({
        data: {
          interactionType,
          endpoint: targetEndpoint,
          user: 'Sandy',
          requestData: requestBody,
          requestSummary,
          responseData,
          responseSummary,
          responseTime,
          dataPoints,
          category,
          businessValue,
          confidence: responseData.confidence
        }
      });
      
      // Update daily summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await prisma.gPTUsageSummary.upsert({
        where: { date: today },
        update: {
          totalQueries: { increment: 1 },
          totalResponses: { increment: 1 },
          analyticsQueries: { increment: category === 'analytics' ? 1 : 0 },
          forecastQueries: { increment: category === 'forecasting' ? 1 : 0 },
          knowledgeQueries: { increment: category === 'knowledge' ? 1 : 0 },
          insightsStored: { increment: interactionType === 'insight_stored' ? 1 : 0 },
          dataPointsAnalyzed: { increment: dataPoints }
        },
        create: {
          date: today,
          totalQueries: 1,
          totalResponses: 1,
          analyticsQueries: category === 'analytics' ? 1 : 0,
          forecastQueries: category === 'forecasting' ? 1 : 0,
          knowledgeQueries: category === 'knowledge' ? 1 : 0,
          insightsStored: interactionType === 'insight_stored' ? 1 : 0,
          dataPointsAnalyzed: dataPoints
        }
      });
      
      // If it's a knowledge store request, also save as an insight
      if (interactionType === 'insight_stored' && requestBody.insight_type) {
        await prisma.gPTInsight.create({
          data: {
            insightType: requestBody.insight_type,
            title: requestBody.title,
            content: requestBody.content,
            summary: requestBody.summary,
            confidence: requestBody.confidence_level,
            priority: requestBody.priority || 'medium',
            category: requestBody.category,
            tags: requestBody.tags?.join(',')
          }
        });
      }
      
    } catch (loggingError) {
      console.error('Failed to log GPT interaction:', loggingError);
      // Don't fail the request if logging fails
    }
    
    // Return the original response
    return NextResponse.json(responseData, { status: response.status });
    
  } catch (error) {
    console.error('GPT proxy error:', error);
    return NextResponse.json({
      success: false,
      error: 'Proxy request failed',
      message: error.message
    }, { status: 500 });
  }
}

// GET requests are forwarded without logging
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetEndpoint = searchParams.get('endpoint') || '';
  const bypass = searchParams.get('bypass') || 'custom_gpt_integration';
  
  // Build query string
  const queryParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      queryParams.append(key, value);
    }
  });
  
  const targetUrl = `https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api${targetEndpoint}?${queryParams}`;
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    
    // Log GET requests too
    const startTime = Date.now();
    await prisma.gPTInteraction.create({
      data: {
        interactionType: 'query',
        endpoint: targetEndpoint,
        user: 'Sandy',
        requestData: Object.fromEntries(searchParams),
        requestSummary: `GET ${targetEndpoint}`,
        responseData: data,
        responseTime: Date.now() - startTime,
        category: targetEndpoint.includes('analytics') ? 'analytics' : 
                 targetEndpoint.includes('forecast') ? 'forecasting' : 
                 targetEndpoint.includes('knowledge') ? 'knowledge' : 'general'
      }
    });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Proxy request failed'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}