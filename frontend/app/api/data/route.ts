// Main API endpoint for Pacific Sands data queries (App Router)
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Check Bearer token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roomType = searchParams.get('roomType');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    switch (type) {
      case 'pace':
        const paceData = await prisma.paceReport.findMany({
          take: limit,
          orderBy: { reportDate: 'desc' },
          where: {
            ...(startDate && { reportDate: { gte: new Date(startDate) } }),
            ...(endDate && { reportDate: { lte: new Date(endDate) } }),
            ...(roomType && { roomType })
          }
        });
        
        return NextResponse.json({
          success: true,
          type: 'pace_reports',
          count: paceData.length,
          data: paceData
        });
        
      case 'occupancy':
        const occupancyData = await prisma.occupancyData.findMany({
          take: limit,
          orderBy: { date: 'desc' },
          where: {
            ...(startDate && { date: { gte: new Date(startDate) } }),
            ...(endDate && { date: { lte: new Date(endDate) } }),
            ...(roomType && { roomType }),
            occupancyRate: { gt: 0 }
          }
        });
        
        return NextResponse.json({
          success: true,
          type: 'occupancy_data',
          count: occupancyData.length,
          data: occupancyData
        });
        
      case 'rateshop':
        const rateShopData = await prisma.rateShop.findMany({
          take: limit,
          orderBy: { reportDate: 'desc' },
          where: {
            ...(startDate && { reportDate: { gte: new Date(startDate) } }),
            ...(endDate && { reportDate: { lte: new Date(endDate) } }),
            ...(roomType && { roomType }),
            ourRate: { gt: 0 }
          }
        });
        
        return NextResponse.json({
          success: true,
          type: 'rate_shop',
          count: rateShopData.length,
          data: rateShopData
        });
        
      case 'analytics':
        const [paceCount, occupancyCount, rateShopCount] = await Promise.all([
          prisma.paceReport.count(),
          prisma.occupancyData.count(),
          prisma.rateShop.count()
        ]);
        
        const [paceAvg, occupancyAvg] = await Promise.all([
          prisma.paceReport.aggregate({
            _avg: { adr: true, revenue: true, roomsSold: true }
          }),
          prisma.occupancyData.aggregate({
            _avg: { occupancyRate: true, adr: true, revenue: true },
            where: { occupancyRate: { gt: 0 } }
          })
        ]);
        
        const recentPace = await prisma.paceReport.findMany({
          take: 12,
          orderBy: { reportDate: 'desc' }
        });
        
        const recentOccupancy = await prisma.occupancyData.findMany({
          take: 12,
          orderBy: { date: 'desc' },
          where: { occupancyRate: { gt: 0 } }
        });
        
        return NextResponse.json({
          success: true,
          type: 'analytics',
          summary: {
            totalRecords: paceCount + occupancyCount + rateShopCount,
            paceReports: paceCount,
            occupancyRecords: occupancyCount,
            rateShopRecords: rateShopCount,
            avgADR: occupancyAvg._avg.adr || paceAvg._avg.adr || 0,
            avgOccupancy: occupancyAvg._avg.occupancyRate || 0,
            avgRevPAR: (occupancyAvg._avg.occupancyRate || 0) * (occupancyAvg._avg.adr || 0),
            dataSource: 'Pacific Sands Analytics Database'
          },
          recentData: {
            paceReports: recentPace,
            occupancyData: recentOccupancy
          }
        });
        
      default:
        const overview = {
          totalPaceReports: await prisma.paceReport.count(),
          totalOccupancyRecords: await prisma.occupancyData.count(),
          totalRateShopRecords: await prisma.rateShop.count(),
          lastUpdated: new Date().toISOString(),
          availableEndpoints: [
            '/api/data?type=pace',
            '/api/data?type=occupancy', 
            '/api/data?type=rateshop',
            '/api/data?type=analytics'
          ]
        };
        
        return NextResponse.json({
          success: true,
          message: 'Pacific Sands Analytics API',
          overview
        });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
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