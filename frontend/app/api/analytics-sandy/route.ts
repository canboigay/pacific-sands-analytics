import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'insights';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const roomType = searchParams.get('room_type');

    // Build date filters
    const dateFilter = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) })
    };

    switch (endpoint) {
      case 'insights':
        // Get data for insights
        const [rateData, occupancyData] = await Promise.all([
          prisma.paceReport.findMany({
            where: {
              ...(dateFrom || dateTo ? { reportDate: dateFilter } : {}),
              ...(roomType && { roomType })
            },
            orderBy: { reportDate: 'desc' },
            take: 100
          }),
          prisma.occupancyData.findMany({
            where: {
              ...(dateFrom || dateTo ? { date: dateFilter } : {}),
              ...(roomType && { roomType }),
              occupancyRate: { gt: 0 }
            },
            orderBy: { date: 'desc' },
            take: 100
          })
        ]);

        // Calculate insights
        const avgRate = rateData.reduce((sum, r) => sum + r.adr, 0) / rateData.length || 0;
        const avgOccupancy = occupancyData.reduce((sum, o) => sum + o.occupancyRate, 0) / occupancyData.length || 0;
        
        // Seasonal patterns
        const seasonalData = occupancyData.reduce((acc, record) => {
          const month = new Date(record.date).getMonth();
          const season = month >= 5 && month <= 8 ? 'Summer' : 
                        month >= 11 || month <= 2 ? 'Winter' : 
                        'Shoulder';
          
          if (!acc[season]) {
            acc[season] = { totalRate: 0, totalOcc: 0, count: 0 };
          }
          
          acc[season].totalRate += record.adr || 0;
          acc[season].totalOcc += record.occupancyRate;
          acc[season].count++;
          
          return acc;
        }, {});

        const seasonalPatterns = Object.entries(seasonalData).map(([period, data]: [string, any]) => ({
          period,
          avg_rate: data.totalRate / data.count,
          occupancy: data.totalOcc / data.count
        }));

        // Generate recommendations
        const recommendations = [];
        
        if (avgOccupancy < 0.7) {
          recommendations.push({
            title: "Increase Occupancy",
            description: "Consider promotional rates or packages to boost occupancy",
            impact: "High",
            confidence: 0.85
          });
        }
        
        if (avgRate < 400) {
          recommendations.push({
            title: "Rate Optimization Opportunity",
            description: "Rates below market average - consider strategic increases",
            impact: "Medium",
            confidence: 0.78
          });
        }

        return NextResponse.json({
          data_summary: {
            total_rate_records: rateData.length,
            total_occupancy_records: occupancyData.length,
            date_range: `${dateFrom || 'all'} to ${dateTo || 'current'}`,
            room_type_filter: roomType || 'all'
          },
          pricing_insights: {
            average_rate: avgRate,
            min_rate: Math.min(...rateData.map(r => r.adr)),
            max_rate: Math.max(...rateData.map(r => r.adr)),
            rate_trend: avgRate > 450 ? 'above_market' : 'below_market',
            seasonal_patterns: seasonalPatterns,
            data_points: rateData.length
          },
          occupancy_insights: {
            average_occupancy: avgOccupancy,
            peak_periods: seasonalPatterns.filter(s => s.occupancy > 0.8).map(s => s.period),
            low_periods: seasonalPatterns.filter(s => s.occupancy < 0.6).map(s => s.period)
          },
          recommendations: recommendations,
          recent_data: {
            latest_rates: rateData.slice(0, 5),
            latest_occupancy: occupancyData.slice(0, 5)
          },
          timestamp: new Date().toISOString()
        });

      case 'competitors':
        // Return competitor analysis
        const competitorData = [
          { name: 'Wickaninnish Inn', rate: 695, occupancy: 0.78, market_position: 'Premium' },
          { name: 'Long Beach Lodge', rate: 485, occupancy: 0.82, market_position: 'Direct' },
          { name: 'Pacific Sands', rate: avgRate || 532, occupancy: avgOccupancy || 0.615, market_position: 'Our Property' }
        ];

        return NextResponse.json({
          competitors: competitorData,
          market_position: {
            rank: 2,
            rate_percentile: 65,
            occupancy_percentile: 45
          },
          timestamp: new Date().toISOString()
        });

      case 'sentiment':
        // Mock sentiment data
        return NextResponse.json({
          overall_sentiment: 0.82,
          categories: {
            location: 0.95,
            service: 0.85,
            value: 0.75,
            amenities: 0.80
          },
          recent_mentions: 42,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({
      error: "Analytics query failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}