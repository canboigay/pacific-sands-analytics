import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
const Papa = require('papaparse');

const prisma = new PrismaClient();

async function findCSVPath() {
  const possiblePaths = [
    '../../Downloads/PacificSands_AllCSV',
    '../Downloads/PacificSands_AllCSV',
    './Downloads/PacificSands_AllCSV',
    '../../../Downloads/PacificSands_AllCSV'
  ];
  
  for (const p of possiblePaths) {
    try {
      await fs.access(path.join(p, 'PaceReports'));
      console.log('Found CSV files at:', p);
      return p;
    } catch {}
  }
  throw new Error('CSV files not found');
}

async function parseNumber(value: any): Promise<number> {
  if (!value) return 0;
  const cleaned = String(value).replace(/[$,%]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

async function parseDate(dateStr: string): Promise<Date> {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  if (dateStr.includes('_')) {
    return new Date(dateStr.replace(/_/g, ' ') + ', 2025');
  }
  return new Date();
}

async function migrate() {
  console.log('Starting migration...');
  const BASE_DIR = await findCSVPath();
  let total = 0;
  
  // Migrate Pace Reports
  console.log('Migrating Pace Reports...');
  try {
    const files = await fs.readdir(path.join(BASE_DIR, 'PaceReports'));
    for (const file of files.filter(f => f.endsWith('.csv'))) {
      const content = await fs.readFile(path.join(BASE_DIR, 'PaceReports', file), 'utf-8');
      const { data } = Papa.parse(content, { header: true });
      
      const parts = file.replace('.csv', '').split('__');
      const reportDate = await parseDate(parts[0].replace(/Pace_Report_/g, ''));
      const targetMonth = parts[1] || 'Unknown';
      
      const records = [];
      for (const row of data) {
        if (!row) continue;
        records.push({
          reportDate,
          targetMonth,
          roomType: row['Room Type'] || 'Unknown',
          dayOfWeek: parseInt(row['Day']) || 0,
          occupancy: await parseNumber(row['Occ %'] || row['Occupancy']),
          adr: await parseNumber(row['ADR']),
          revenue: await parseNumber(row['Revenue']),
          roomsSold: parseInt(row['Rooms Sold']) || 0
        });
      }
      
      if (records.length > 0) {
        await prisma.paceReport.createMany({ data: records, skipDuplicates: true });
        total += records.length;
        console.log('  ' + file + ': ' + records.length + ' records');
      }
    }
  } catch (e) {
    console.log('Error with Pace Reports:', e.message);
  }
  
  // Migrate Occupancy
  console.log('Migrating Occupancy Data...');
  try {
    const files = await fs.readdir(path.join(BASE_DIR, 'Occupancy'));
    for (const file of files.filter(f => f.endsWith('.csv'))) {
      const content = await fs.readFile(path.join(BASE_DIR, 'Occupancy', file), 'utf-8');
      const { data } = Papa.parse(content, { header: true });
      
      const parts = file.replace('.csv', '').split('__');
      const snapshotDate = await parseDate(parts[0].replace(/Occupancy_/g, ''));
      const fiscalYear = parts[1] || 'Unknown';
      
      const records = [];
      for (const row of data) {
        if (!row || !row['Date']) continue;
        records.push({
          snapshotDate,
          fiscalYear,
          date: await parseDate(row['Date']),
          available: parseInt(row['Available']) || 0,
          sold: parseInt(row['Sold']) || 0,
          occupancyRate: await parseNumber(row['Occupancy'] || row['Occ %']),
          adr: await parseNumber(row['ADR']),
          revPAR: await parseNumber(row['RevPAR'])
        });
      }
      
      if (records.length > 0) {
        await prisma.occupancyData.createMany({ data: records, skipDuplicates: true });
        total += records.length;
        console.log('  ' + file + ': ' + records.length + ' records');
      }
    }
  } catch (e) {
    console.log('Error with Occupancy:', e.message);
  }
  
  console.log('Migration complete! Total records: ' + total);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
