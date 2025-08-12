// File Upload API endpoint for CSV data
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

const prisma = new PrismaClient();

// Utility functions
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleaned = dateStr.trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) return parsed;
  if (/^[A-Za-z]+ \d{4}$/.test(cleaned)) {
    return new Date(cleaned + ' 01');
  }
  if (/^[A-Za-z]+ \d{1,2}$/.test(cleaned)) {
    return new Date(cleaned + ', 2025');
  }
  return new Date();
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[$,%]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Detect file type based on structure
function detectFileType(headers: string[], firstRow: any): 'pace' | 'occupancy' | 'rateshop' | 'unknown' {
  const headerLower = headers.map(h => h.toLowerCase());
  
  // Pace Report detection
  if (headerLower.includes('room nights ty') || headerLower.includes('room nights') || headerLower.includes('revenue ty')) {
    return 'pace';
  }
  
  // Occupancy detection
  if (headerLower.includes('available') && headerLower.includes('sold') && headerLower.includes('occupancy')) {
    return 'occupancy';
  }
  
  // Rate Shop detection
  if (headerLower.includes('our rate') && headerLower.includes('comp rate')) {
    return 'rateshop';
  }
  
  return 'unknown';
}

// Parse Pace Report data
async function parsePaceData(data: any[], filename: string) {
  const records = [];
  const parts = filename.replace('.csv', '').split('_');
  const reportDate = new Date();
  const targetMonth = parts.find(p => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(p)) || 'Unknown';
  
  for (const row of data) {
    if (!row || Object.keys(row).length === 0) continue;
    
    records.push({
      reportDate,
      targetMonth,
      roomType: row['Room Type'] || row['Category'] || 'All',
      dayOfWeek: parseInt(row['Day']) || 0,
      dayName: row['DayName'] || null,
      occupancy: parseNumber(row['Occ %'] || row['Occupancy']),
      adr: parseNumber(row['ADR'] || row['Rate']),
      revenue: parseNumber(row['Revenue']),
      roomsSold: Math.floor(parseNumber(row['Rooms Sold'] || row['Rooms'])),
      roomsAvailable: row['Available'] ? Math.floor(parseNumber(row['Available'])) : null
    });
  }
  
  if (records.length > 0) {
    await prisma.paceReport.createMany({ data: records });
  }
  
  return records.length;
}

// Parse Occupancy data
async function parseOccupancyData(data: any[], filename: string) {
  const records = [];
  const parts = filename.replace('.csv', '').split('_');
  const snapshotDate = new Date();
  const fiscalYear = parts.find(p => /\d{4}/.test(p)) || '2025';
  
  for (const row of data) {
    if (!row || !row['Date'] && !row['Month']) continue;
    
    const dateField = row['Date'] || row['Month'];
    records.push({
      snapshotDate,
      fiscalYear,
      date: parseDate(dateField),
      dayOfWeek: row['Day of Week'] || null,
      roomType: row['Room Type'] || 'All',
      available: Math.floor(parseNumber(row['Available'] || 0)),
      sold: Math.floor(parseNumber(row['Sold'] || row['Room Nights'] || 0)),
      occupancyRate: parseNumber(row['Occupancy'] || row['Occ %']) / (row['Occupancy']?.toString().includes('%') ? 100 : 1),
      adr: parseNumber(row['ADR']),
      revPAR: parseNumber(row['RevPAR']),
      revenue: parseNumber(row['Revenue'])
    });
  }
  
  if (records.length > 0) {
    await prisma.occupancyData.createMany({ data: records });
  }
  
  return records.length;
}

// Parse Rate Shop data
async function parseRateShopData(data: any[], filename: string) {
  const records = [];
  const reportDate = new Date();
  
  for (const row of data) {
    if (!row || !row['Date'] || row['Date'] === 'Date') continue;
    
    records.push({
      reportDate,
      checkInDate: parseDate(row['Date']),
      property: row['Property'] || 'Pacific Sands',
      roomType: row['Room Type'] || 'Ocean View',
      ourRate: parseNumber(row['Our Rate']),
      compRate: parseNumber(row['Comp Rate 1'] || row['Comp Rate']),
      difference: parseNumber(row['Our Rate']) - parseNumber(row['Comp Rate 1'] || row['Comp Rate']),
      percentDiff: parseNumber(row['Our Rate']) && parseNumber(row['Comp Rate 1']) 
        ? ((parseNumber(row['Our Rate']) - parseNumber(row['Comp Rate 1'])) / parseNumber(row['Comp Rate 1'])) * 100 
        : null,
      availability: row['Availability'] || null,
      notes: row['Notes'] || null
    });
  }
  
  if (records.length > 0) {
    await prisma.rateShop.createMany({ data: records });
  }
  
  return records.length;
}

export async function POST(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // 'pace', 'occupancy', 'rateshop', or 'auto'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 });
    }

    // Read and parse CSV
    const text = await file.text();
    const parseResult = Papa.parse(text, { 
      header: true, 
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing failed',
        details: parseResult.errors 
      }, { status: 400 });
    }

    const data = parseResult.data;
    if (data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Auto-detect file type if not specified
    let detectedType = fileType;
    if (fileType === 'auto' || !fileType) {
      detectedType = detectFileType(Object.keys(data[0]), data[0]);
    }

    if (detectedType === 'unknown') {
      return NextResponse.json({ 
        error: 'Unable to detect file type. Please specify manually.',
        availableTypes: ['pace', 'occupancy', 'rateshop']
      }, { status: 400 });
    }

    // Process based on file type
    let recordsImported = 0;
    let tableName = '';

    switch (detectedType) {
      case 'pace':
        recordsImported = await parsePaceData(data, file.name);
        tableName = 'PaceReport';
        break;
      case 'occupancy':
        recordsImported = await parseOccupancyData(data, file.name);
        tableName = 'OccupancyData';
        break;
      case 'rateshop':
        recordsImported = await parseRateShopData(data, file.name);
        tableName = 'RateShop';
        break;
    }

    // Log the import
    await prisma.dataImport.create({
      data: {
        fileName: file.name,
        fileType: detectedType,
        fileSize: file.size,
        recordCount: recordsImported,
        status: 'completed',
        metadata: {
          detectedColumns: Object.keys(data[0]),
          totalRows: data.length,
          processedRows: recordsImported,
          tableName
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${recordsImported} records`,
      details: {
        fileName: file.name,
        fileType: detectedType,
        recordsImported,
        tableName,
        fileSize: file.size,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Log failed import
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (file) {
        await prisma.dataImport.create({
          data: {
            fileName: file.name,
            fileType: 'unknown',
            fileSize: file.size,
            recordCount: 0,
            status: 'failed',
            errors: { message: error.message, stack: error.stack }
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json({
      success: false,
      error: 'Upload processing failed',
      message: error.message
    }, { status: 500 });
  }
}

// Get upload history
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'ps_me2w0k3e_x81fsv0yz3k') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const imports = await prisma.dataImport.findMany({
      take: limit,
      orderBy: { importedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      imports,
      summary: {
        total: imports.length,
        successful: imports.filter(i => i.status === 'completed').length,
        failed: imports.filter(i => i.status === 'failed').length
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch import history'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}