const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countRecords() {
  console.log('\n📊 DATABASE RECORD COUNT:');
  console.log('=========================');
  
  try {
    // Count all tables
    const counts = {};
    
    // Try different table names
    try {
      const items = await prisma.item.count();
      counts['Items'] = items;
    } catch {}
    
    try {
      const rates = await prisma.rateData.count();
      counts['Rate Data'] = rates;
    } catch {}
    
    try {
      const competitors = await prisma.competitorData.count();
      counts['Competitor Data'] = competitors;
    } catch {}
    
    try {
      const feedback = await prisma.customerFeedback.count();
      counts['Customer Feedback'] = feedback;
    } catch {}
    
    // Display counts
    let total = 0;
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table}: ${count} records`);
      total += count;
    }
    
    console.log('\n  TOTAL RECORDS: ' + total);
    
    if (total > 0) {
      console.log('\n✅ YOUR DATABASE HAS REAL DATA!');
      console.log('🎯 View it at: http://localhost:3000/real-dashboard');
    } else {
      console.log('\n⚠️  Database is empty - upload in progress...');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

countRecords();
