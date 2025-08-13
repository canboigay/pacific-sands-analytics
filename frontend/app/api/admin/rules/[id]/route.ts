import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RulesEngine } from '@pacific/rules-engine';

const prisma = new PrismaClient();
const rulesEngine = new RulesEngine();

// GET /api/admin/rules/[id] - Get single rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rule = await prisma.rMSRule.findUnique({
      where: { id: params.id },
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rule
    });

  } catch (error: any) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rules/[id] - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { conditions, actions, priority, description, isActive } = body;

    // Get current rule
    const currentRule = await prisma.rMSRule.findUnique({
      where: { id: params.id }
    });

    if (!currentRule) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Validate updated rule
    const updatedRuleData = {
      ...currentRule,
      conditions: conditions || currentRule.conditions,
      actions: actions || currentRule.actions,
      priority: priority !== undefined ? priority : currentRule.priority,
      isActive: isActive !== undefined ? isActive : currentRule.isActive
    };

    const validation = rulesEngine.validateRuleSet([updatedRuleData]);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid rule', 
          validationErrors: validation.errors[0]?.errors || []
        },
        { status: 400 }
      );
    }

    // Update rule
    const updatedRule = await prisma.rMSRule.update({
      where: { id: params.id },
      data: {
        conditions: conditions || currentRule.conditions,
        actions: actions || currentRule.actions,
        priority: priority !== undefined ? priority : currentRule.priority,
        description: description !== undefined ? description : currentRule.description,
        isActive: isActive !== undefined ? isActive : currentRule.isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRule
    });

  } catch (error: any) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rules/[id] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if rule has executions
    const executionCount = await prisma.rMSRuleExecution.count({
      where: { ruleId: params.id }
    });

    if (executionCount > 0) {
      // Soft delete by setting isActive to false
      const rule = await prisma.rMSRule.update({
        where: { id: params.id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Rule deactivated (has execution history)',
        data: rule
      });
    } else {
      // Hard delete if no executions
      await prisma.rMSRule.delete({
        where: { id: params.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Rule deleted'
      });
    }

  } catch (error: any) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}