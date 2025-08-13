import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();

// POST /api/sandy/query - Query the RMS system with natural language
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    // Verify Sandy API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ps_')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the query to understand intent
    const intent = parseQueryIntent(query);
    let response: any = {};

    switch (intent.type) {
      case 'explain_formula':
        response = await explainFormula(intent.target);
        break;

      case 'current_parameters':
        response = await getCurrentParameters(intent.category);
        break;

      case 'formula_usage':
        response = await getFormulaUsage(intent.target);
        break;

      case 'rule_status':
        response = await getRuleStatus(intent.target);
        break;

      case 'calculation_history':
        response = await getCalculationHistory(intent.timeframe);
        break;

      case 'system_overview':
        response = await getSystemOverview();
        break;

      default:
        response = {
          message: "I can help you understand the RMS formulas, parameters, and rules. Try asking about specific formulas, current parameter values, or system status.",
          suggestions: [
            "Explain the baseline ADR formula",
            "What are the current demand thresholds?",
            "Show me recent formula calculations",
            "Which rules are currently active?"
          ]
        };
    }

    // Log interaction
    await prisma.gPTInteraction.create({
      data: {
        interactionType: 'sandy_rms_query',
        endpoint: '/api/sandy/query',
        user: 'Sandy',
        requestData: { query, intent },
        responseData: response,
        category: 'rms_query'
      }
    });

    return NextResponse.json({
      success: true,
      data: response,
      query,
      intent
    });

  } catch (error: any) {
    console.error('Error processing Sandy query:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseQueryIntent(query: string): any {
  const lowerQuery = query.toLowerCase();

  // Formula explanations
  if (lowerQuery.includes('explain') || lowerQuery.includes('what is')) {
    const formulas = ['baseline_adr', 'trevpar', 'occupancy_forecast', 'elasticity', 'budget_gap'];
    for (const formula of formulas) {
      if (lowerQuery.includes(formula.replace('_', ' '))) {
        return { type: 'explain_formula', target: formula };
      }
    }
  }

  // Parameter queries
  if (lowerQuery.includes('parameter') || lowerQuery.includes('threshold') || lowerQuery.includes('current')) {
    const categories = ['demand', 'competitor', 'seasonality', 'event'];
    for (const cat of categories) {
      if (lowerQuery.includes(cat)) {
        return { type: 'current_parameters', category: cat };
      }
    }
    return { type: 'current_parameters', category: null };
  }

  // Formula usage
  if (lowerQuery.includes('usage') || lowerQuery.includes('used') || lowerQuery.includes('calculation')) {
    return { type: 'formula_usage', target: null };
  }

  // Rule status
  if (lowerQuery.includes('rule') || lowerQuery.includes('trigger')) {
    return { type: 'rule_status', target: null };
  }

  // History
  if (lowerQuery.includes('history') || lowerQuery.includes('recent') || lowerQuery.includes('last')) {
    if (lowerQuery.includes('hour')) return { type: 'calculation_history', timeframe: 'hour' };
    if (lowerQuery.includes('day')) return { type: 'calculation_history', timeframe: 'day' };
    if (lowerQuery.includes('week')) return { type: 'calculation_history', timeframe: 'week' };
    return { type: 'calculation_history', timeframe: 'day' };
  }

  // System overview
  if (lowerQuery.includes('system') || lowerQuery.includes('overview') || lowerQuery.includes('status')) {
    return { type: 'system_overview' };
  }

  return { type: 'unknown' };
}

async function explainFormula(formulaName: string | null) {
  if (!formulaName) {
    const formulas = await prisma.rMSFormula.findMany({
      where: { isActive: true },
      select: { name: true, description: true, category: true }
    });

    return {
      message: "Here are all active formulas in the system:",
      formulas: formulas.map(f => ({
        name: f.name,
        category: f.category,
        description: f.description
      }))
    };
  }

  const formula = await prisma.rMSFormula.findUnique({
    where: { name: formulaName }
  });

  if (!formula) {
    return { message: `Formula "${formulaName}" not found.` };
  }

  const complexity = formulaEngine.analyzeComplexity(formula.formulaExpression);
  const doc = formulaEngine.generateDocumentation(formula.formulaExpression);

  return {
    formula: {
      name: formula.name,
      expression: formula.formulaExpression,
      description: formula.description,
      variables: formula.variables,
      complexity: complexity.complexity,
      suggestions: complexity.suggestions
    },
    documentation: doc,
    message: `The ${formula.name} formula ${formula.description}. It uses ${Object.keys(formula.variables as any).length} variables.`
  };
}

async function getCurrentParameters(category: string | null) {
  const where: any = {};
  if (category) {
    where.category = { contains: category };
  }

  const parameters = await prisma.rMSParameter.findMany({
    where,
    orderBy: { parameterKey: 'asc' }
  });

  if (parameters.length === 0) {
    return { message: "No parameters found for the specified category." };
  }

  const grouped = parameters.reduce((acc, param) => {
    if (!acc[param.category]) {
      acc[param.category] = [];
    }
    acc[param.category].push({
      key: param.parameterKey,
      value: param.parameterValue,
      type: param.parameterType,
      description: param.description
    });
    return acc;
  }, {} as Record<string, any[]>);

  return {
    message: `Found ${parameters.length} parameters${category ? ` for ${category}` : ''}:`,
    parameters: grouped,
    lastUpdated: parameters[0]?.updatedAt
  };
}

async function getFormulaUsage(formulaName: string | null) {
  const where: any = {};
  if (formulaName) {
    const formula = await prisma.rMSFormula.findUnique({
      where: { name: formulaName },
      select: { id: true }
    });
    if (formula) where.formulaId = formula.id;
  }

  const usage = await prisma.rMSCalculation.groupBy({
    by: ['formulaId'],
    where: {
      ...where,
      calculatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
      }
    },
    _count: true,
    _avg: {
      executionTime: true
    }
  });

  const results = await Promise.all(
    usage.map(async (u) => {
      const formula = await prisma.rMSFormula.findUnique({
        where: { id: u.formulaId },
        select: { name: true }
      });
      return {
        formula: formula?.name,
        usageCount: u._count,
        avgExecutionTime: Math.round(u._avg.executionTime || 0)
      };
    })
  );

  return {
    message: `Formula usage statistics for the last 7 days:`,
    usage: results,
    totalCalculations: results.reduce((sum, r) => sum + r.usageCount, 0)
  };
}

async function getRuleStatus(ruleName: string | null) {
  const where: any = { isActive: true };
  if (ruleName) {
    where.name = { contains: ruleName };
  }

  const rules = await prisma.rMSRule.findMany({
    where,
    include: {
      _count: {
        select: { executions: true }
      }
    }
  });

  const ruleStatus = await Promise.all(
    rules.map(async (rule) => {
      const recentExecutions = await prisma.rMSRuleExecution.findMany({
        where: {
          ruleId: rule.id,
          executedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        select: { conditionMet: true }
      });

      const matchRate = recentExecutions.length > 0
        ? (recentExecutions.filter(e => e.conditionMet).length / recentExecutions.length) * 100
        : 0;

      return {
        name: rule.name,
        type: rule.ruleType,
        priority: rule.priority,
        totalExecutions: rule._count.executions,
        recentMatchRate: Math.round(matchRate),
        description: rule.description
      };
    })
  );

  return {
    message: `Found ${rules.length} active rules:`,
    rules: ruleStatus
  };
}

async function getCalculationHistory(timeframe: string) {
  const timeframes: Record<string, number> = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
  };

  const since = new Date(Date.now() - (timeframes[timeframe] || timeframes.day));

  const calculations = await prisma.rMSCalculation.findMany({
    where: {
      calculatedAt: { gte: since }
    },
    orderBy: { calculatedAt: 'desc' },
    take: 10,
    include: {
      formula: {
        select: { name: true }
      }
    }
  });

  return {
    message: `Recent calculations from the last ${timeframe}:`,
    calculations: calculations.map(calc => ({
      formula: calc.formula.name,
      calculatedAt: calc.calculatedAt,
      executionTime: `${calc.executionTime}ms`,
      outputValue: calc.outputValue
    })),
    totalCount: calculations.length
  };
}

async function getSystemOverview() {
  const [formulas, rules, parameters, recentCalcs] = await Promise.all([
    prisma.rMSFormula.count({ where: { isActive: true } }),
    prisma.rMSRule.count({ where: { isActive: true } }),
    prisma.rMSParameter.count(),
    prisma.rMSCalculation.count({
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  const categories = await prisma.rMSFormula.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: true
  });

  return {
    message: "RMS System Overview:",
    overview: {
      activeFormulas: formulas,
      activeRules: rules,
      parameters: parameters,
      calculationsLast24h: recentCalcs,
      formulaCategories: categories.map(c => ({
        category: c.category,
        count: c._count
      }))
    }
  };
}