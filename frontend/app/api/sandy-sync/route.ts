import { NextRequest, NextResponse } from 'next/server';
import { fetchSandyData, getLatestInsights } from '@/lib/agents/sandy-data';

export async function GET(request: NextRequest) {
  try {
    // Fetch all of Sandy's data
    const [sandyData, latestInsights] = await Promise.all([
      fetchSandyData(),
      getLatestInsights(10)
    ]);

    // Return summary of Sandy's data
    return NextResponse.json({
      success: true,
      message: 'Sandy\'s data retrieved successfully',
      summary: {
        totalRecords: sandyData.totalRecords,
        rateRecords: sandyData.rates.length,
        occupancyRecords: sandyData.occupancy.length,
        insightCount: sandyData.insights.length,
        latestInsights: latestInsights.slice(0, 5).map(i => ({
          title: i.title,
          content: i.content,
          created: i.created_at
        }))
      },
      lastActivity: latestInsights[0]?.created_at || 'Unknown',
      data: {
        rates: sandyData.rates.slice(0, 5),
        occupancy: sandyData.occupancy.slice(0, 5),
        insights: sandyData.insights.slice(0, 5)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to sync with Sandy\'s data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}