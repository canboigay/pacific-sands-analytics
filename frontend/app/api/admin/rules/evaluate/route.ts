import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RulesEngine } from '@pacific/rules-engine';

const prisma = new PrismaClient();
const rulesEngine = new RulesEngine();

// POST /api/admin/rules/evaluate - Test rule evaluation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleIds, context, options } = body;

    // Fetch rules
    const where: any = {};
    if (ruleIds && ruleIds.length > 0) {
      where.id = { in: ruleIds };
    }
    where.isActive = true;

    const rules = await prisma.rMSRule.findMany({ where });

    if (rules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active rules found' },
        { status: 404 }
      );
    }

    // Evaluate rules
    const result = await rulesEngine.evaluateRules(
      rules,
      context,
      {
        ...options,
        executeActions: false // Don't execute actions in test mode
      }
    );

    // Save execution records if requested
    if (options?.saveExecutions) {
      const executionPromises = result.results.map(async (ruleResult) => {
        return prisma.rMSRuleExecution.create({
          data: {
            ruleId: ruleResult.ruleId,
            inputData: context.data,
            conditionMet: ruleResult.matched,
            actionsTaken: ruleResult.actionsExecuted,
            executionTime: ruleResult.executionTime,
            metadata: { test: true }
          }
        });
      });

      await Promise.all(executionPromises);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          evaluatedRules: result.evaluatedRules,
          matchedRules: result.matchedRules,
          totalExecutionTime: result.totalExecutionTime
        },
        results: result.results.map(r => ({
          ruleId: r.ruleId,
          ruleName: r.ruleName,
          matched: r.matched,
          executionTime: r.executionTime,
          errors: r.errors
        })),
        context
      }
    });

  } catch (error: any) {
    console.error('Error evaluating rules:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}