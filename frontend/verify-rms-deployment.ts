#!/usr/bin/env tsx

/**
 * RMS Deployment Verification Script
 * Run this after deployment to verify all systems are working
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use production URL from environment or command line
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.argv[2] || 'http://localhost:3000';

const API_KEY = 'Bearer ps_me2w0k3e_x81fsv0yz3k';

interface TestResult {
  test: string;
  status: 'passed' | 'failed';
  message?: string;
  data?: any;
}

const tests: TestResult[] = [];

async function runTest(
  testName: string, 
  testFn: () => Promise<void>
): Promise<void> {
  try {
    await testFn();
    tests.push({ test: testName, status: 'passed' });
    console.log(`✅ ${testName}`);
  } catch (error: any) {
    tests.push({ 
      test: testName, 
      status: 'failed', 
      message: error.message 
    });
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

async function verifyDatabase() {
  // Check if RMS tables exist
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'RMS%'
  ` as any[];

  const expectedTables = [
    'RMSFormula',
    'RMSRule',
    'RMSParameter',
    'RMSCalculation',
    'RMSRuleExecution',
    'RMSFormulaVersion',
    'RMSFormulaTest'
  ];

  for (const table of expectedTables) {
    if (!tables.find(t => t.table_name === table)) {
      throw new Error(`Missing table: ${table}`);
    }
  }

  // Check if data is seeded
  const formulaCount = await prisma.rMSFormula.count();
  if (formulaCount === 0) {
    throw new Error('No formulas found - run seed script');
  }

  const ruleCount = await prisma.rMSRule.count();
  if (ruleCount === 0) {
    throw new Error('No rules found - run seed script');
  }

  const paramCount = await prisma.rMSParameter.count();
  if (paramCount === 0) {
    throw new Error('No parameters found - run seed script');
  }
}

async function verifyAPIs() {
  // Test formula listing
  const formulasResponse = await fetch(`${BASE_URL}/api/admin/formulas`, {
    headers: { 'Authorization': API_KEY }
  });

  if (!formulasResponse.ok) {
    throw new Error(`Formula API failed: ${formulasResponse.status}`);
  }

  const formulas = await formulasResponse.json();
  if (!formulas.data || formulas.data.length === 0) {
    throw new Error('No formulas returned from API');
  }

  // Test ADR calculation
  const adrResponse = await fetch(`${BASE_URL}/api/rms/calculate/adr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY
    },
    body: JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      roomType: 'Ocean View',
      occupancy: 85,
      competitorRates: [180, 195, 210]
    })
  });

  if (!adrResponse.ok) {
    const error = await adrResponse.text();
    throw new Error(`ADR calculation failed: ${error}`);
  }

  const adrResult = await adrResponse.json();
  if (!adrResult.data || !adrResult.data.adr) {
    throw new Error('Invalid ADR calculation result');
  }

  // Test Sandy query
  const sandyResponse = await fetch(`${BASE_URL}/api/sandy/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY
    },
    body: JSON.stringify({
      query: 'What formulas are currently active?'
    })
  });

  if (!sandyResponse.ok) {
    throw new Error(`Sandy API failed: ${sandyResponse.status}`);
  }
}

async function verifyPerformance() {
  // Test formula execution time
  const start = Date.now();
  
  const response = await fetch(`${BASE_URL}/api/rms/calculate/adr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY
    },
    body: JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      roomType: 'Ocean View',
      occupancy: 75,
      competitorRates: [200, 210, 220]
    })
  });

  const duration = Date.now() - start;
  
  if (duration > 1000) {
    throw new Error(`Slow API response: ${duration}ms`);
  }

  const result = await response.json();
  if (result.data && result.data.executionTime > 100) {
    throw new Error(`Slow formula execution: ${result.data.executionTime}ms`);
  }
}

async function main() {
  console.log('🔍 RMS Deployment Verification');
  console.log(`📍 Testing: ${BASE_URL}`);
  console.log('================================\n');

  // Database tests
  console.log('📊 Database Verification:');
  await runTest('RMS tables exist', verifyDatabase);
  
  // API tests
  console.log('\n🌐 API Verification:');
  await runTest('Formula API works', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/formulas`, {
      headers: { 'Authorization': API_KEY }
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
  });

  await runTest('Rule API works', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/rules`, {
      headers: { 'Authorization': API_KEY }
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
  });

  await runTest('Parameter API works', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/parameters`, {
      headers: { 'Authorization': API_KEY }
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
  });

  await runTest('ADR calculation works', async () => {
    await verifyAPIs();
  });

  // Performance tests
  console.log('\n⚡ Performance Verification:');
  await runTest('API response time < 1s', verifyPerformance);

  // Summary
  console.log('\n================================');
  console.log('📋 Summary:');
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n🚨 Failed Tests:');
    tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`  - ${t.test}: ${t.message}`));
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! RMS system is ready for production.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());