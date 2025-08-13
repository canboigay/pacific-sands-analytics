import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();

// GET /api/admin/formulas - List all formulas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    const formulas = await prisma.rMSFormula.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { calculations: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: formulas,
      count: formulas.length
    });

  } catch (error: any) {
    console.error('Error fetching formulas:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/formulas - Create new formula
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, formulaExpression, variables, description, createdBy } = body;

    // Validate formula syntax
    const validation = await formulaEngine.validate(formulaExpression);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid formula', 
          validationErrors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.rMSFormula.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Formula with this name already exists' },
        { status: 409 }
      );
    }

    // Create formula
    const formula = await prisma.rMSFormula.create({
      data: {
        name,
        category,
        formulaExpression,
        variables: variables || {},
        description,
        createdBy
      }
    });

    return NextResponse.json({
      success: true,
      data: formula
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating formula:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}