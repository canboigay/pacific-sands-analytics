import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/admin/parameters/bulk - Bulk update parameters
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, updatedBy } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Validate all updates first
    const validationErrors: string[] = [];
    
    for (const update of updates) {
      const param = await prisma.rMSParameter.findUnique({
        where: { parameterKey: update.parameterKey }
      });

      if (!param) {
        validationErrors.push(`Parameter not found: ${update.parameterKey}`);
        continue;
      }

      // Validate against min/max
      if (param.parameterType === 'number' || param.parameterType === 'percentage') {
        const numValue = typeof update.parameterValue === 'number' 
          ? update.parameterValue 
          : parseFloat(update.parameterValue);

        if (param.minValue !== null && numValue < param.minValue) {
          validationErrors.push(
            `${update.parameterKey}: Value must be >= ${param.minValue}`
          );
        }

        if (param.maxValue !== null && numValue > param.maxValue) {
          validationErrors.push(
            `${update.parameterKey}: Value must be <= ${param.maxValue}`
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    // Perform bulk update in transaction
    const results = await prisma.$transaction(
      updates.map(update => 
        prisma.rMSParameter.update({
          where: { parameterKey: update.parameterKey },
          data: {
            parameterValue: update.parameterValue,
            updatedBy: updatedBy || 'system',
            updatedAt: new Date()
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        updated: results.length,
        parameters: results
      }
    });

  } catch (error: any) {
    console.error('Error bulk updating parameters:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}