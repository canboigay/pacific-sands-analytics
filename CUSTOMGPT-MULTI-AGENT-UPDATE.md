# CustomGPT Multi-Agent System Update Guide

## Overview
This guide provides instructions for updating Sandy (Pacific Sands CustomGPT) to use the new multi-agent orchestrator system.

## Current Configuration
- **Current Base URL**: `https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api`
- **API Key**: `ps_me2w0k3e_x81fsv0yz3k`

## New Multi-Agent Orchestrator Endpoint

### Primary Endpoint
```
POST https://frontend-d3ia661um-pacific-sands.vercel.app/api/agents
```

### Request Format
```json
{
  "query": "User's question or request",
  "agent": "auto",  // Use "auto" for automatic agent selection
  "context": {
    "date": "2024-02-14",  // Optional: specific date context
    "roomType": "Ocean View",  // Optional: room type filter
    "period": "30days"  // Optional: time period
  }
}
```

### Headers
```
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k
Content-Type: application/json
```

## Available Agents

The orchestrator can automatically detect which agent to use based on the query, or you can specify:

1. **auto** (Recommended) - Automatically selects the best agent
2. **pricing** - For rate optimization and pricing strategy
3. **revenue** - For revenue analysis and targets
4. **guest** - For guest experience insights
5. **marketing** - For marketing campaigns and promotions
6. **operations** - For staffing and housekeeping
7. **analytics** - For comprehensive data analysis

## Example Queries and Expected Routing

### Pricing Agent
- "What rate should we charge for Ocean View rooms tomorrow?"
- "How should we price our suites for the summer season?"
- "What's the optimal rate for maximizing RevPAR?"

### Revenue Agent
- "Are we on track to meet our monthly revenue target?"
- "What's our revenue performance compared to last year?"
- "How can we increase revenue next month?"

### Guest Agent
- "What room types are most popular with guests?"
- "How can we improve guest satisfaction?"
- "What are the occupancy patterns for different room categories?"

### Marketing Agent
- "What marketing campaigns should we run for low season?"
- "How should we allocate our marketing budget?"
- "What promotions would help fill rooms next month?"

### Operations Agent
- "How many housekeeping staff do we need tomorrow?"
- "What's the optimal staffing level for 80% occupancy?"
- "When should we schedule maintenance?"

### Analytics Agent
- "Give me a comprehensive performance analysis"
- "What are the key trends in our data?"
- "How are we performing overall?"

## Response Format

All agents return a consistent format:

```json
{
  "success": true,
  "agent": "pricing",  // Which agent handled the request
  "recommendation": "Recommended rate for Ocean View: $450",
  "confidence": 0.85,  // Confidence level (0-1)
  "dataPoints": 150,   // Number of data points analyzed
  "insights": [
    "Competitor rates averaging $425",
    "High demand expected (85% occupancy forecast)",
    "Historical data shows price elasticity of -0.3"
  ],
  "actions": [
    {
      "type": "rate_update",
      "description": "Update Ocean View rate to $450",
      "priority": "high"
    }
  ],
  "metadata": {
    "responseTime": 245,  // Response time in ms
    "dataSource": "Pacific Sands Analytics",
    "lastUpdated": "2024-02-14T10:30:00Z"
  }
}
```

## Integration Steps for CustomGPT

### Option 1: Add New Action (Recommended)
1. Keep existing endpoints for compatibility
2. Add a new action called "Multi-Agent Query"
3. Configure it to use the orchestrator endpoint
4. Update GPT instructions to prefer this for complex queries

### Option 2: Update Existing Schema
1. Add the `/agents` endpoint to your OpenAPI schema
2. Update the base URL if needed
3. Test with various queries

## Sample OpenAPI Schema Addition

```yaml
/agents:
  post:
    summary: Multi-Agent Orchestrator
    description: Intelligently routes queries to specialized agents
    operationId: queryMultiAgent
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - query
            properties:
              query:
                type: string
                description: The user's question or request
              agent:
                type: string
                enum: [auto, pricing, revenue, guest, marketing, operations, analytics]
                default: auto
                description: Specific agent to use (auto for automatic selection)
              context:
                type: object
                properties:
                  date:
                    type: string
                    format: date
                  roomType:
                    type: string
                  period:
                    type: string
    responses:
      200:
        description: Successful response from agent
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentResponse'
```

## Testing the Integration

### Test Query 1: Pricing
```bash
curl -X POST https://frontend-d3ia661um-pacific-sands.vercel.app/api/agents \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What rate should we charge for Ocean View rooms tomorrow?",
    "agent": "auto"
  }'
```

### Test Query 2: Operations
```bash
curl -X POST https://frontend-d3ia661um-pacific-sands.vercel.app/api/agents \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many housekeeping staff do we need for 80% occupancy?",
    "agent": "auto"
  }'
```

## Benefits of Multi-Agent System

1. **Specialized Expertise**: Each agent is optimized for its domain
2. **Better Accuracy**: Agents use domain-specific logic and data
3. **Faster Responses**: Focused agents process queries more efficiently
4. **Comprehensive Insights**: Agents can provide deeper, more relevant analysis
5. **Automatic Routing**: The orchestrator ensures queries go to the right expert

## Monitoring and Analytics

All agent interactions are automatically tracked and visible in:
- RMS Dashboard: https://frontend-d3ia661um-pacific-sands.vercel.app/rms-alerts
- Look for the "Multi-Agent System" widget
- GPT Analytics widget shows all interactions

## Support

For any issues or questions:
- Check agent test results at `/test-agents.ts`
- Review logs in the Multi-Agent widget
- All interactions are tracked for debugging

## Next Steps

1. Test the orchestrator endpoint with sample queries
2. Update Sandy's configuration to include the new endpoint
3. Monitor the Multi-Agent widget for usage patterns
4. Adjust agent logic based on real-world usage

---

Updated: 2025-08-12
Status: Live in Production