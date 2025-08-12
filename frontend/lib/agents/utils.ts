import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Agent type definitions
export type AgentType = 'pricing' | 'revenue' | 'guest' | 'marketing' | 'operations' | 'analytics';

export interface AgentContext {
  query: string;
  roomType?: string;
  dates?: Date[];
  occupancy?: number;
  budget?: number;
  metric?: string;
  department?: string;
  [key: string]: any;
}

export interface AgentResponse {
  agent: AgentType;
  recommendation: string;
  confidence: number;
  data: any;
  dataPoints: number;
  insights?: string[];
  actions?: string[];
  timestamp: string;
}

// Detect which agent should handle the query
export function detectAgent(query: string): AgentType {
  const lower = query.toLowerCase();
  
  if (lower.includes('price') || lower.includes('rate') || lower.includes('adr')) {
    return 'pricing';
  }
  if (lower.includes('revenue') || lower.includes('revpar') || lower.includes('budget')) {
    return 'revenue';
  }
  if (lower.includes('guest') || lower.includes('satisfaction') || lower.includes('review')) {
    return 'guest';
  }
  if (lower.includes('marketing') || lower.includes('campaign') || lower.includes('promotion')) {
    return 'marketing';
  }
  if (lower.includes('housekeeping') || lower.includes('maintenance') || lower.includes('staff')) {
    return 'operations';
  }
  if (lower.includes('report') || lower.includes('analytics') || lower.includes('trend')) {
    return 'analytics';
  }
  
  // Default to analytics for general queries
  return 'analytics';
}

// Track agent interactions
export async function trackAgentInteraction(
  agent: AgentType,
  context: AgentContext,
  response: AgentResponse
) {
  try {
    await prisma.gPTInteraction.create({
      data: {
        interactionType: 'agent_query',
        endpoint: `/api/agents/${agent}`,
        user: 'Sandy',
        requestData: context,
        requestSummary: context.query,
        responseData: response,
        responseSummary: response.recommendation,
        responseTime: Date.now(),
        dataPoints: response.dataPoints,
        confidence: response.confidence,
        category: agent,
        businessValue: `${agent} optimization`,
        tags: `agent,${agent},ai-recommendation`
      }
    });

    // Store high-confidence insights
    if (response.confidence > 0.8 && response.recommendation) {
      await prisma.gPTInsight.create({
        data: {
          insightType: 'recommendation',
          title: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent Insight`,
          content: response.recommendation,
          summary: response.insights?.join('; '),
          confidence: response.confidence,
          priority: response.confidence > 0.9 ? 'high' : 'medium',
          actionable: true,
          category: agent,
          tags: `${agent},ai-generated,actionable`
        }
      });
    }
  } catch (error) {
    console.error('Failed to track agent interaction:', error);
  }
}

// Common data fetching functions
export async function getOccupancyTrends(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await prisma.occupancyData.findMany({
    where: {
      date: { gte: startDate }
    },
    orderBy: { date: 'desc' }
  });
}

export async function getCompetitorRates(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await prisma.rateShop.findMany({
    where: {
      checkInDate: { gte: startDate }
    },
    orderBy: { checkInDate: 'desc' }
  });
}

export async function getRevenueTrends(months: number = 3) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return await prisma.monthlyMetrics.findMany({
    where: {
      month: { gte: startDate }
    },
    orderBy: { month: 'desc' }
  });
}
