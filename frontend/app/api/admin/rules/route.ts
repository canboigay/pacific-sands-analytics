import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RulesEngine } from '@pacific/rules-engine';

const prisma = new PrismaClient();
const rulesEngine = new RulesEngine();

// GET /api/admin/rules - List all rules
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleType = searchParams.get('ruleType');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (ruleType) where.ruleType = ruleType;
    if (isActive !== null) where.isActive = isActive === 'true';

    const rules = await prisma.rMSRule.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { executions: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: rules,
      count: rules.length
    });

  } catch (error: any) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/rules - Create new rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ruleType, conditions, actions, priority, description, createdBy } = body;

    // Validate rule structure
    const validation = rulesEngine.validateRuleSet([{
      id: 'temp',
      name,
      ruleType,
      conditions,
      actions,
      priority,
      isActive: true
    }]);

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

    // Check for duplicate name
    const existing = await prisma.rMSRule.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Rule with this name already exists' },
        { status: 409 }
      );
    }

    // Create rule
    const rule = await prisma.rMSRule.create({
      data: {
        name,
        ruleType,
        conditions,
        actions,
        priority: priority || 0,
        description,
        createdBy
      }
    });

    return NextResponse.json({
      success: true,
      data: rule
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}