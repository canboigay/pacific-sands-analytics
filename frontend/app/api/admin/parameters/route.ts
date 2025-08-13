import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/parameters - Get all parameters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const where: any = {};
    if (category) where.category = category;

    const parameters = await prisma.rMSParameter.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { parameterKey: 'asc' }
      ]
    });

    // Group by category for easier consumption
    const grouped = parameters.reduce((acc, param) => {
      if (!acc[param.category]) {
        acc[param.category] = [];
      }
      acc[param.category].push(param);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      data: {
        parameters,
        grouped,
        count: parameters.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching parameters:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/parameters - Create new parameter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      parameterKey, 
      parameterValue, 
      parameterType, 
      category, 
      description,
      minValue,
      maxValue,
      defaultValue,
      updatedBy
    } = body;

    // Validate parameter value against min/max if provided
    if (parameterType === 'number' || parameterType === 'percentage') {
      const numValue = typeof parameterValue === 'number' 
        ? parameterValue 
        : parseFloat(parameterValue);

      if (minValue !== undefined && numValue < minValue) {
        return NextResponse.json(
          { success: false, error: `Value must be >= ${minValue}` },
          { status: 400 }
        );
      }

      if (maxValue !== undefined && numValue > maxValue) {
        return NextResponse.json(
          { success: false, error: `Value must be <= ${maxValue}` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate key
    const existing = await prisma.rMSParameter.findUnique({
      where: { parameterKey }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Parameter with this key already exists' },
        { status: 409 }
      );
    }

    // Create parameter
    const parameter = await prisma.rMSParameter.create({
      data: {
        parameterKey,
        parameterValue,
        parameterType,
        category,
        description,
        minValue,
        maxValue,
        defaultValue,
        updatedBy
      }
    });

    return NextResponse.json({
      success: true,
      data: parameter
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating parameter:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}