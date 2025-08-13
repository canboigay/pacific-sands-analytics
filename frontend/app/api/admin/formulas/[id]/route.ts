import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();

// GET /api/admin/formulas/[id] - Get single formula
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formula = await prisma.rMSFormula.findUnique({
      where: { id: params.id },
      include: {
        formulaVersions: {
          orderBy: { version: 'desc' },
          take: 10
        },
        calculations: {
          orderBy: { calculatedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!formula) {
      return NextResponse.json(
        { success: false, error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Add complexity analysis
    const complexity = formulaEngine.analyzeComplexity(formula.formulaExpression);

    return NextResponse.json({
      success: true,
      data: {
        ...formula,
        complexity
      }
    });

  } catch (error: any) {
    console.error('Error fetching formula:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/formulas/[id] - Update formula
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { formulaExpression, variables, description, isActive, changedBy, changeReason } = body;

    // Get current formula
    const currentFormula = await prisma.rMSFormula.findUnique({
      where: { id: params.id }
    });

    if (!currentFormula) {
      return NextResponse.json(
        { success: false, error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Validate new formula if expression changed
    if (formulaExpression && formulaExpression !== currentFormula.formulaExpression) {
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
    }

    // Start transaction to update formula and create version history
    const result = await prisma.$transaction(async (tx) => {
      // Create version history entry if expression changed
      if (formulaExpression && formulaExpression !== currentFormula.formulaExpression) {
        await tx.rMSFormulaVersion.create({
          data: {
            formulaId: params.id,
            version: currentFormula.version,
            formulaExpression: currentFormula.formulaExpression,
            variables: currentFormula.variables,
            changedBy: changedBy || 'system',
            changeReason
          }
        });
      }

      // Update formula
      const updatedFormula = await tx.rMSFormula.update({
        where: { id: params.id },
        data: {
          formulaExpression: formulaExpression || currentFormula.formulaExpression,
          variables: variables !== undefined ? variables : currentFormula.variables,
          description: description !== undefined ? description : currentFormula.description,
          isActive: isActive !== undefined ? isActive : currentFormula.isActive,
          version: formulaExpression && formulaExpression !== currentFormula.formulaExpression 
            ? currentFormula.version + 1 
            : currentFormula.version,
          updatedAt: new Date()
        }
      });

      return updatedFormula;
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error updating formula:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/formulas/[id] - Delete formula
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if formula has calculations
    const calculationCount = await prisma.rMSCalculation.count({
      where: { formulaId: params.id }
    });

    if (calculationCount > 0) {
      // Soft delete by setting isActive to false
      const formula = await prisma.rMSFormula.update({
        where: { id: params.id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Formula deactivated (has calculation history)',
        data: formula
      });
    } else {
      // Hard delete if no calculations
      await prisma.rMSFormula.delete({
        where: { id: params.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Formula deleted'
      });
    }

  } catch (error: any) {
    console.error('Error deleting formula:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}