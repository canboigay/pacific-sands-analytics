import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/parameters/import - Import parameters from CSV/JSON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, data, mode = 'merge', updatedBy } = body;

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Format must be "json" or "csv"' },
        { status: 400 }
      );
    }

    let parameters: any[] = [];

    // Parse data based on format
    if (format === 'json') {
      parameters = data;
    } else {
      // Parse CSV (simple implementation)
      const lines = data.split('\n');
      const headers = lines[0].split(',').map((h: string) => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((v: string) => v.trim());
          const param: any = {};
          
          headers.forEach((header: string, index: number) => {
            if (header === 'parameterValue') {
              // Try to parse as JSON first, fallback to string
              try {
                param[header] = JSON.parse(values[index]);
              } catch {
                param[header] = values[index];
              }
            } else if (['minValue', 'maxValue'].includes(header)) {
              param[header] = values[index] ? parseFloat(values[index]) : null;
            } else {
              param[header] = values[index];
            }
          });
          
          parameters.push(param);
        }
      }
    }

    // Validate parameters
    const validationErrors: string[] = [];
    const validParameters: any[] = [];

    for (const param of parameters) {
      if (!param.parameterKey) {
        validationErrors.push('Parameter missing key');
        continue;
      }

      if (!param.parameterType) {
        validationErrors.push(`${param.parameterKey}: Missing type`);
        continue;
      }

      if (!param.category) {
        validationErrors.push(`${param.parameterKey}: Missing category`);
        continue;
      }

      validParameters.push(param);
    }

    if (validationErrors.length > 0 && validParameters.length === 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    // Import based on mode
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const param of validParameters) {
        const existing = await tx.rMSParameter.findUnique({
          where: { parameterKey: param.parameterKey }
        });

        if (existing) {
          if (mode === 'merge' || mode === 'overwrite') {
            await tx.rMSParameter.update({
              where: { parameterKey: param.parameterKey },
              data: {
                parameterValue: param.parameterValue,
                parameterType: param.parameterType,
                category: param.category,
                description: param.description || existing.description,
                minValue: param.minValue !== undefined ? param.minValue : existing.minValue,
                maxValue: param.maxValue !== undefined ? param.maxValue : existing.maxValue,
                defaultValue: param.defaultValue !== undefined ? param.defaultValue : existing.defaultValue,
                updatedBy: updatedBy || 'import',
                updatedAt: new Date()
              }
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await tx.rMSParameter.create({
            data: {
              ...param,
              updatedBy: updatedBy || 'import'
            }
          });
          imported++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        imported,
        updated,
        skipped,
        total: validParameters.length,
        warnings: validationErrors
      }
    });

  } catch (error: any) {
    console.error('Error importing parameters:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}