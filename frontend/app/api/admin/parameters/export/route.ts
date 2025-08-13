import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/parameters/export - Export parameters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const category = searchParams.get('category');

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Format must be "json" or "csv"' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (category) where.category = category;

    const parameters = await prisma.rMSParameter.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { parameterKey: 'asc' }
      ]
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: parameters.length,
        data: parameters
      });
    } else {
      // Generate CSV
      const headers = [
        'parameterKey',
        'parameterValue',
        'parameterType',
        'category',
        'description',
        'minValue',
        'maxValue',
        'defaultValue',
        'updatedAt',
        'updatedBy'
      ];

      const rows = parameters.map(param => [
        param.parameterKey,
        JSON.stringify(param.parameterValue),
        param.parameterType,
        param.category,
        param.description || '',
        param.minValue?.toString() || '',
        param.maxValue?.toString() || '',
        param.defaultValue ? JSON.stringify(param.defaultValue) : '',
        param.updatedAt.toISOString(),
        param.updatedBy || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="parameters-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

  } catch (error: any) {
    console.error('Error exporting parameters:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}