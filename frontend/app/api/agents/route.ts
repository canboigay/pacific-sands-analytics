import { NextRequest, NextResponse } from 'next/server';
import { detectAgent, trackAgentInteraction, AgentContext } from '@/lib/agents/utils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query = '', agent = 'auto', context = {} } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Detect or use specified agent
    const selectedAgent = agent === 'auto' ? detectAgent(query) : agent;
    
    // Build context
    const agentContext: AgentContext = {
      query,
      ...context
    };

    // Call the appropriate agent
    const agentUrl = new URL(`/api/agents/${selectedAgent}`, request.url);
    const agentResponse = await fetch(agentUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify(agentContext)
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent ${selectedAgent} failed: ${agentResponse.statusText}`);
    }

    const result = await agentResponse.json();

    // Track the interaction
    await trackAgentInteraction(selectedAgent, agentContext, result);

    return NextResponse.json({
      success: true,
      agent: selectedAgent,
      query,
      result,
      metadata: {
        confidence: result.confidence,
        dataPoints: result.dataPoints,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal orchestrator error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
