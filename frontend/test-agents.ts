// Test script for Pacific Sands Multi-Agent System
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'Bearer ps_me2w0k3e_x81fsv0yz3k';

async function testAgent(agent: string, query: string, context: any = {}) {
  console.log(`\nTesting ${agent} agent...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify({
        query,
        agent,
        context
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${agent} agent: SUCCESS`);
      console.log(`   Recommendation: ${data.result.recommendation}`);
      console.log(`   Confidence: ${(data.result.confidence * 100).toFixed(0)}%`);
      console.log(`   Data points: ${data.result.dataPoints}`);
    } else {
      console.log(`❌ ${agent} agent: FAILED`);
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ ${agent} agent: ERROR`);
    console.log(`   ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Pacific Sands Multi-Agent System\n');
  
  // Test each agent
  await testAgent('auto', 'What should our room rates be for next weekend?');
  await testAgent('pricing', 'Recommend rates for 2BR Ocean View with 85% occupancy');
  await testAgent('revenue', 'How can we reach our $500k monthly revenue target?');
  await testAgent('guest', 'What can we do to improve guest satisfaction?');
  await testAgent('marketing', 'Where should we focus our $10k marketing budget?');
  await testAgent('operations', 'How many housekeepers do we need today?');
  await testAgent('analytics', 'Give me a performance overview for the last 30 days');
  
  console.log('\n✅ All tests completed!');
}

// Run tests
runTests();
