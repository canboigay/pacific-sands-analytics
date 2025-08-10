const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('\n📊 Checking Pacific Sands Database...\n');
  
  try {
    // Check for Items (generic table)
    const items = await prisma.item.findMany({ take: 5 });
    console.log('Items table:', items.length, 'records');
    
    // Check for RateData if it exists
    try {
      const rates = await prisma.rateData.findMany({ take: 5 });
      console.log('RateData table:', rates.length, 'records');
      if (rates.length > 0) {
        console.log('Sample rate:', rates[0]);
      }
    } catch (e) {
      console.log('RateData table not found or empty');
    }
    
    // Check for CompetitorData
    try {
      const competitors = await prisma.competitorData.findMany({ take: 5 });
      console.log('CompetitorData table:', competitors.length, 'records');
    } catch (e) {
      console.log('CompetitorData table not found or empty');
    }
    
    // Check for CustomerFeedback
    try {
      const feedback = await prisma.customerFeedback.findMany({ take: 5 });
      console.log('CustomerFeedback table:', feedback.length, 'records');
    } catch (e) {
      console.log('CustomerFeedback table not found or empty');
    }
    
    console.log('\n✅ Database check complete!');
    console.log('\nTo see all data, open Prisma Studio:');
    console.log('http://localhost:5555');
    
  } catch (error) {
    console.error('Database error:', error.message);
    console.log('\nMake sure Prisma is configured correctly');
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
