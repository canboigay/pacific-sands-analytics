import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();

// POST /api/admin/formulas/[id]/test - Test formula with sample data
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { testData, saveTest } = body;

    // Get formula
    const formula = await prisma.rMSFormula.findUnique({
      where: { id: params.id }
    });

    if (!formula) {
      return NextResponse.json(
        { success: false, error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Execute formula with test data
    const result = await formulaEngine.execute(formula.formulaExpression, {
      variables: testData
    });

    // Save test result if requested
    if (saveTest) {
      await prisma.rMSFormulaTest.create({
        data: {
          formulaName: formula.name,
          testData,
          expectedResult: {}, // User can provide this
          actualResult: result.value,
          passed: !result.errors || result.errors.length === 0,
          errorMessage: result.errors?.join('; ')
        }
      });
    }

    // Also create calculation record
    await prisma.rMSCalculation.create({
      data: {
        formulaId: params.id,
        inputValues: testData,
        outputValue: result.value,
        executionTime: result.executionTime,
        metadata: { test: true }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        formula: {
          id: formula.id,
          name: formula.name,
          expression: formula.formulaExpression
        },
        testData,
        result: {
          value: result.value,
          executionTime: result.executionTime,
          usedVariables: result.usedVariables,
          errors: result.errors
        }
      }
    });

  } catch (error: any) {
    console.error('Error testing formula:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}