import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';
import { RulesEngine } from '@pacific/rules-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();
const rulesEngine = new RulesEngine();

// POST /api/sandy/insights - Get insights based on current formulas and rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, insightType } = body;

    // Verify Sandy API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ps_')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const insights: any[] = [];

    // Get current system state
    const activeFormulas = await prisma.rMSFormula.count({ where: { isActive: true } });
    const activeRules = await prisma.rMSRule.count({ where: { isActive: true } });
    const recentCalculations = await prisma.rMSCalculation.count({
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // System health insight
    insights.push({
      type: 'system_health',
      title: 'RMS System Status',
      content: `The RMS system is active with ${activeFormulas} formulas and ${activeRules} rules. There have been ${recentCalculations} calculations in the last 24 hours.`,
      confidence: 0.95,
      priority: 'low'
    });

    // Formula performance insights
    if (insightType === 'performance' || !insightType) {
      const slowFormulas = await prisma.rMSCalculation.groupBy({
        by: ['formulaId'],
        where: {
          executionTime: { gte: 100 }, // Slower than 100ms
          calculatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
          }
        },
        _count: true,
        _avg: {
          executionTime: true
        }
      });

      if (slowFormulas.length > 0) {
        for (const slow of slowFormulas) {
          const formula = await prisma.rMSFormula.findUnique({
            where: { id: slow.formulaId }
          });

          if (formula) {
            insights.push({
              type: 'performance',
              title: `Slow Formula Detected: ${formula.name}`,
              content: `The formula "${formula.name}" is averaging ${Math.round(slow._avg.executionTime!)}ms execution time. Consider optimizing this formula for better performance.`,
              confidence: 0.85,
              priority: 'medium',
              actionable: true,
              suggestedAction: 'Review and optimize formula complexity'
            });
          }
        }
      }
    }

    // Rule effectiveness insights
    if (insightType === 'rules' || !insightType) {
      const ruleExecutions = await prisma.rMSRuleExecution.groupBy({
        by: ['ruleId', 'conditionMet'],
        where: {
          executedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      });

      // Find rules that never match
      const neverMatchedRules = await prisma.rMSRule.findMany({
        where: {
          isActive: true,
          executions: {
            none: {
              conditionMet: true
            }
          }
        }
      });

      for (const rule of neverMatchedRules) {
        insights.push({
          type: 'rule_effectiveness',
          title: `Unused Rule: ${rule.name}`,
          content: `The rule "${rule.name}" has never matched any conditions. Consider reviewing its conditions or deactivating it.`,
          confidence: 0.75,
          priority: 'low',
          actionable: true,
          suggestedAction: 'Review rule conditions'
        });
      }
    }

    // Parameter optimization insights
    if (insightType === 'parameters' || !insightType) {
      // Check for parameters at their limits
      const parameters = await prisma.rMSParameter.findMany();
      
      for (const param of parameters) {
        if (param.minValue !== null && param.maxValue !== null) {
          const value = typeof param.parameterValue === 'number' 
            ? param.parameterValue 
            : parseFloat(param.parameterValue as string);

          if (!isNaN(value)) {
            if (value === param.minValue) {
              insights.push({
                type: 'parameter_limit',
                title: `Parameter at Minimum: ${param.parameterKey}`,
                content: `The parameter "${param.parameterKey}" is at its minimum value (${param.minValue}). This might indicate overly conservative settings.`,
                confidence: 0.7,
                priority: 'medium',
                actionable: true,
                suggestedAction: 'Review parameter effectiveness'
              });
            } else if (value === param.maxValue) {
              insights.push({
                type: 'parameter_limit',
                title: `Parameter at Maximum: ${param.parameterKey}`,
                content: `The parameter "${param.parameterKey}" is at its maximum value (${param.maxValue}). This might indicate aggressive settings that need review.`,
                confidence: 0.7,
                priority: 'medium',
                actionable: true,
                suggestedAction: 'Review parameter effectiveness'
              });
            }
          }
        }
      }
    }

    // Recent changes insight
    const recentFormulaChanges = await prisma.rMSFormula.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentFormulaChanges > 0) {
      insights.push({
        type: 'recent_changes',
        title: 'Recent Formula Updates',
        content: `${recentFormulaChanges} formula(s) have been updated in the last 24 hours. Monitor their performance closely.`,
        confidence: 1.0,
        priority: 'high',
        actionable: false
      });
    }

    // Store insights in database
    for (const insight of insights) {
      await prisma.gPTInsight.create({
        data: {
          insightType: insight.type,
          title: insight.title,
          content: insight.content,
          confidence: insight.confidence,
          priority: insight.priority,
          actionable: insight.actionable || false,
          category: 'rms_system',
          dataSource: 'rms_analysis'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        insights,
        totalInsights: insights.length,
        systemStatus: {
          formulas: activeFormulas,
          rules: activeRules,
          recentCalculations
        }
      }
    });

  } catch (error: any) {
    console.error('Error generating insights for Sandy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}