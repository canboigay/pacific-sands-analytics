import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Count records in database
    const [paceCount, occupancyCount, rateShopCount] = await Promise.all([
      prisma.paceReport.count(),
      prisma.occupancyData.count(),
      prisma.rateShop.count()
    ]);

    const totalRecords = paceCount + occupancyCount + rateShopCount;

    return NextResponse.json({
      status: "ok",
      db: "connected",
      records: totalRecords,
      details: {
        paceReports: paceCount,
        occupancyData: occupancyCount,
        rateShop: rateShopCount
      },
      database_type: process.env.DATABASE_URL?.includes('supabase') ? 'PostgreSQL (Supabase)' : 'SQLite',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      db: "disconnected",
      records: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}