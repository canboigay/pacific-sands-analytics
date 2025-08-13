// Real data API endpoint (App Router)
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get actual data from migrated tables
    const paceReports = await prisma.paceReport.findMany({
      take: 50,
      orderBy: { reportDate: 'desc' }
    });
    
    const occupancyData = await prisma.occupancyData.findMany({
      take: 50,
      orderBy: { date: 'desc' },
      where: { occupancyRate: { gt: 0 } }
    });
    
    // Calculate real metrics from migrated data
    const paceAvg = await prisma.paceReport.aggregate({
      _avg: { adr: true, revenue: true }
    });
    
    const occupancyAvg = await prisma.occupancyData.aggregate({
      _avg: { occupancyRate: true, adr: true, revenue: true },
      where: { occupancyRate: { gt: 0 } }
    });
    
    const totalRecords = await prisma.paceReport.count() + await prisma.occupancyData.count();
    
    const metrics = {
      totalRecords,
      paceReports: paceReports.length,
      occupancyRecords: occupancyData.length,
      averageRate: paceAvg._avg.adr || occupancyAvg._avg.adr || 0,
      occupancy: occupancyAvg._avg.occupancyRate || 0,
      revpar: (occupancyAvg._avg.occupancyRate || 0) * (occupancyAvg._avg.adr || 0),
      totalRevenue: paceAvg._avg.revenue || occupancyAvg._avg.revenue || 0,
      dataSource: 'PACIFIC_SANDS_DATABASE',
      lastUpdated: new Date().toISOString(),
      databaseStatus: 'CONNECTED'
    };
    
    return NextResponse.json({
      success: true,
      metrics,
      data: {
        paceReports: paceReports.slice(0, 10),
        occupancyData: occupancyData.slice(0, 10)
      },
      message: 'Real Pacific Sands data from migrated database'
    });
    
  } catch (error) {
    console.error('Database error:', error);
    
    return NextResponse.json({
      success: false,
      metrics: {
        averageRate: null,
        occupancy: null,
        revpar: null,
        totalRevenue: null,
        dataSource: 'ERROR',
        error: error.message
      },
      message: 'Database connection failed'
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