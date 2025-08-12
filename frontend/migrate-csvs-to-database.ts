// migrate-csvs-to-database.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();
const BASE_DIR = '../../Downloads/PacificSands_AllCSV';
const BATCH_SIZE = 100;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

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

async function migrateCSVs() {
  console.log(`${colors.bright}${colors.blue}🚀 Starting Pacific Sands CSV Migration${colors.reset}\n`);
  
  try {
    await fs.access(BASE_DIR);
  } catch (error) {
    console.error(`${colors.red}❌ Directory not found: ${BASE_DIR}${colors.reset}`);
    return;
  }
  
  const startTime = Date.now();
  let totalRecords = 0;
  
  // MIGRATE PACE REPORTS
  console.log(`${colors.bright}📊 Migrating Pace Reports...${colors.reset}`);
  const paceDir = path.join(BASE_DIR, 'PaceReports');
  
  try {
    const paceFiles = await fs.readdir(paceDir);
    const csvFiles = paceFiles.filter(f => f.endsWith('.csv'));
    console.log(`  Found ${csvFiles.length} pace report files`);
    
    for (const file of csvFiles) {
      console.log(`  ${colors.yellow}Processing: ${file}${colors.reset}`);
      
      const filePath = path.join(paceDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = Papa.parse(content, { 
        header: true, 
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      const parts = file.replace('.csv', '').split('__');
      const reportDateStr = parts[0].replace(/_/g, ' ').replace('Pace Report ', '');
      const targetMonth = parts[1] ? parts[1].replace(/_/g, ' ') : 'Unknown';
      
      const records = [];
      for (const row of data) {
        if (!row || Object.keys(row).length === 0) continue;
        
        records.push({
          reportDate: parseDate(reportDateStr),
          targetMonth: targetMonth,
          roomType: row['Room Type'] || row['Category'] || 'Unknown',
          dayOfWeek: row['Day'] || 0,
          dayName: row['DayName'] || null,
          occupancy: parseNumber(row['Occ %'] || row['Occupancy']),
          adr: parseNumber(row['ADR'] || row['Rate']),
          revenue: parseNumber(row['Revenue']),
          roomsSold: Math.floor(parseNumber(row['Rooms Sold'] || row['Rooms'])),
          roomsAvailable: row['Available'] ? Math.floor(parseNumber(row['Available'])) : null
        });
      }
      
      if (records.length > 0) {
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await prisma.paceReport.createMany({
            data: batch
          });
        }
        console.log(`    ${colors.green}✅ Imported ${records.length} records${colors.reset}`);
        totalRecords += records.length;
      }
    }
  } catch (error: any) {
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);
  }
  
  // MIGRATE OCCUPANCY DATA
  console.log(`\n${colors.bright}🏨 Migrating Occupancy Data...${colors.reset}`);
  const occDir = path.join(BASE_DIR, 'Occupancy');
  
  try {
    const occFiles = await fs.readdir(occDir);
    const csvFiles = occFiles.filter(f => f.endsWith('.csv'));
    console.log(`  Found ${csvFiles.length} occupancy files`);
    
    for (const file of csvFiles) {
      console.log(`  ${colors.yellow}Processing: ${file}${colors.reset}`);
      
      const filePath = path.join(occDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = Papa.parse(content, { 
        header: true, 
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      const parts = file.replace('.csv', '').split('__');
      const snapshotDateStr = parts[0].replace('Occupancy_', '').replace(/_/g, ' ');
      const fiscalYear = parts[1] || 'Unknown';
      
      const records = [];
      for (const row of data) {
        if (!row || !row['Date']) continue;
        
        records.push({
          snapshotDate: parseDate(snapshotDateStr),
          fiscalYear: fiscalYear,
          date: parseDate(row['Date']),
          dayOfWeek: row['Day of Week'] || null,
          roomType: row['Room Type'] || 'All',
          available: Math.floor(parseNumber(row['Available'] || 0)),
          sold: Math.floor(parseNumber(row['Sold'] || 0)),
          occupancyRate: parseNumber(row['Occupancy'] || row['Occ %']),
          adr: parseNumber(row['ADR']),
          revPAR: parseNumber(row['RevPAR']),
          revenue: parseNumber(row['Revenue'])
        });
      }
      
      if (records.length > 0) {
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await prisma.occupancyData.createMany({
            data: batch,
                      });
        }
        console.log(`    ${colors.green}✅ Imported ${records.length} records${colors.reset}`);
        totalRecords += records.length;
      }
    }
  } catch (error: any) {
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);
  }
  
  // MIGRATE RATE SHOPS
  console.log(`\n${colors.bright}💰 Migrating Rate Shop Data...${colors.reset}`);
  const rateDir = path.join(BASE_DIR, 'RateShops');
  
  try {
    const rateFiles = await fs.readdir(rateDir);
    const csvFiles = rateFiles.filter(f => f.endsWith('.csv') && !f.includes('Sample'));
    console.log(`  Found ${csvFiles.length} rate shop files`);
    
    for (const file of csvFiles) {
      console.log(`  ${colors.yellow}Processing: ${file}${colors.reset}`);
      
      const filePath = path.join(rateDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = Papa.parse(content, { 
        header: true, 
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      const parts = file.replace('.csv', '').split('__');
      const reportDateStr = parts[0].replace(/PS_2025_Rate_ShopsSuggestions_/g, '').replace(/_/g, ' ');
      const checkInDateStr = parts[1] ? parts[1].replace(/_/g, ' ') : null;
      
      const records = [];
      for (const row of data) {
        if (!row || !row['Date'] || row['Date'] === 'Date') continue;
        
        records.push({
          reportDate: parseDate(reportDateStr),
          checkInDate: parseDate(row['Date'] || checkInDateStr),
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
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await prisma.rateShop.createMany({
            data: batch,
                      });
        }
        console.log(`    ${colors.green}✅ Imported ${records.length} records${colors.reset}`);
        totalRecords += records.length;
      }
    }
  } catch (error: any) {
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);
  }
  
  // SUMMARY
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${colors.bright}${colors.green}✨ Migration Complete in ${elapsed} seconds!${colors.reset}`);
  console.log(`Total records imported: ${totalRecords}`);
}

migrateCSVs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
