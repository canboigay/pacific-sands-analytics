import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying Pacific Sands Database...\n');
  
  try {
    // Count records in each table
    const paceCount = await prisma.paceReport.count();
    const occupancyCount = await prisma.occupancyData.count();
    const rateShopCount = await prisma.rateShop.count();
    const dataImportCount = await prisma.dataImport.count();
    const monthlyMetricsCount = await prisma.monthlyMetrics.count();
    
    console.log('📊 Record Counts:');
    console.log(`  PaceReport: ${paceCount}`);
    console.log(`  OccupancyData: ${occupancyCount}`);
    console.log(`  RateShop: ${rateShopCount}`);
    console.log(`  DataImport: ${dataImportCount}`);
    console.log(`  MonthlyMetrics: ${monthlyMetricsCount}`);
    
    // Sample some data
    console.log('\n📈 Sample Pace Report Data:');
    const samplePace = await prisma.paceReport.findMany({
      take: 3,
      orderBy: { reportDate: 'desc' }
    });
    samplePace.forEach(record => {
      console.log(`  ${record.targetMonth}: $${record.adr} ADR, ${record.roomsSold} rooms, $${record.revenue} revenue`);
    });
    
    console.log('\n🏨 Sample Occupancy Data:');
    const sampleOccupancy = await prisma.occupancyData.findMany({
      take: 3,
      orderBy: { date: 'desc' }
    });
    sampleOccupancy.forEach(record => {
      console.log(`  ${record.date.toISOString().split('T')[0]}: ${(record.occupancyRate * 100).toFixed(1)}% occupancy, $${record.adr} ADR`);
    });
    
    // Calculate basic analytics
    console.log('\n📊 Basic Analytics:');
    
    const avgMetrics = await prisma.paceReport.aggregate({
      _avg: {
        adr: true,
        occupancy: true,
        revenue: true
      },
      where: {
        adr: { gt: 0 }
      }
    });
    
    if (avgMetrics._avg.adr) {
      console.log(`  Average ADR: $${avgMetrics._avg.adr.toFixed(2)}`);
      console.log(`  Average Revenue: $${avgMetrics._avg.revenue?.toFixed(2) || 'N/A'}`);
    }
    
    const occupancyAvg = await prisma.occupancyData.aggregate({
      _avg: {
        occupancyRate: true,
        adr: true
      },
      where: {
        occupancyRate: { gt: 0 }
      }
    });
    
    if (occupancyAvg._avg.occupancyRate) {
      console.log(`  Average Occupancy Rate: ${(occupancyAvg._avg.occupancyRate * 100).toFixed(1)}%`);
      console.log(`  Average Occupancy ADR: $${occupancyAvg._avg.adr?.toFixed(2) || 'N/A'}`);
    }
    
    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();