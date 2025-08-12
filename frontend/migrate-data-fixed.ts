import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();
const BASE_DIR = '../../Downloads/PacificSands_AllCSV';
const BATCH_SIZE = 50;

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
  console.log(`${colors.bright}${colors.blue}🚀 Starting Pacific Sands CSV Migration (Fixed)${colors.reset}\n`);
  
  try {
    await fs.access(BASE_DIR);
  } catch (error) {
    console.error(`${colors.red}❌ Directory not found: ${BASE_DIR}${colors.reset}`);
    return;
  }
  
  const startTime = Date.now();
  let totalRecords = 0;
  
  // MIGRATE PACE REPORTS WITH IMPROVED PARSING
  console.log(`${colors.bright}📊 Migrating Pace Reports...${colors.reset}`);
  const paceDir = path.join(BASE_DIR, 'PaceReports');
  
  try {
    const paceFiles = await fs.readdir(paceDir);
    const csvFiles = paceFiles.filter(f => f.endsWith('.csv') && !f.includes('Sample'));
    console.log(`  Found ${csvFiles.length} pace report files`);
    
    for (const file of csvFiles) {
      console.log(`  ${colors.yellow}Processing: ${file}${colors.reset}`);
      
      const filePath = path.join(paceDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse without headers first, then identify data rows
      const lines = content.split('\n').filter(line => line.trim());
      
      const parts = file.replace('.csv', '').split('__');
      const reportDateStr = parts[0].replace(/20252026_Pace_Report_/g, '').replace(/_/g, ' ');
      const targetMonth = parts[1] ? parts[1].replace(/_/g, ' ') : 'Unknown';
      
      const records = [];
      
      // Skip header rows and process data rows (typically starting from row 5)
      for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cells = line.split(',');
        if (cells.length > 0 && cells[0] && !cells[0].includes('Year') && !cells[0].includes('%')) {
          const month = cells[0];
          const roomNights = parseNumber(cells[1]);
          const revenue = parseNumber(cells[6]);
          const adr = parseNumber(cells[11]);
          
          if (month && (roomNights > 0 || revenue > 0)) {
            records.push({
              reportDate: parseDate(reportDateStr),
              targetMonth: month,
              roomType: 'All',
              dayOfWeek: 0,
              dayName: null,
              occupancy: 0,
              adr: adr,
              revenue: revenue,
              roomsSold: Math.floor(roomNights),
              roomsAvailable: null
            });
          }
        }
      }
      
      if (records.length > 0) {
        try {
          for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            await prisma.paceReport.createMany({
              data: batch
            });
          }
          console.log(`    ${colors.green}✅ Imported ${records.length} records${colors.reset}`);
          totalRecords += records.length;
        } catch (error: any) {
          console.error(`    ${colors.red}❌ Error importing ${file}: ${error.message}${colors.reset}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);
  }
  
  // MIGRATE OCCUPANCY DATA WITH IMPROVED PARSING
  console.log(`\n${colors.bright}🏨 Migrating Occupancy Data...${colors.reset}`);
  const occDir = path.join(BASE_DIR, 'Occupancy');
  
  try {
    const occFiles = await fs.readdir(occDir);
    const csvFiles = occFiles.filter(f => f.endsWith('.csv') && !f.includes('Sample'));
    console.log(`  Found ${csvFiles.length} occupancy files`);
    
    for (const file of csvFiles) {
      console.log(`  ${colors.yellow}Processing: ${file}${colors.reset}`);
      
      const filePath = path.join(occDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const parts = file.replace('.csv', '').split('__');
      const snapshotDateStr = parts[0].replace('Pacific_Sands_Occupancy_', '').replace(/_/g, ' ');
      const fiscalYear = parts[1] || 'Unknown';
      
      const records = [];
      
      // Skip header rows and process data rows
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cells = line.split(',');
        if (cells.length >= 6 && cells[0] && !cells[0].includes('Month')) {
          const month = cells[0];
          const days = parseNumber(cells[1]);
          const roomNights = parseNumber(cells[2]);
          const occupancyRate = parseNumber(cells[3].replace('%', '')) / 100;
          const adr = parseNumber(cells[4]);
          const revenue = parseNumber(cells[5]);
          
          if (month && roomNights > 0) {
            records.push({
              snapshotDate: parseDate(snapshotDateStr),
              fiscalYear: fiscalYear,
              date: parseDate(month + ' 2025'),
              dayOfWeek: null,
              roomType: 'All',
              available: Math.floor(roomNights / occupancyRate) || roomNights,
              sold: Math.floor(roomNights),
              occupancyRate: occupancyRate,
              adr: adr,
              revPAR: occupancyRate * adr,
              revenue: revenue
            });
          }
        }
      }
      
      if (records.length > 0) {
        try {
          for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            await prisma.occupancyData.createMany({
              data: batch
            });
          }
          console.log(`    ${colors.green}✅ Imported ${records.length} records${colors.reset}`);
          totalRecords += records.length;
        } catch (error: any) {
          console.error(`    ${colors.red}❌ Error importing ${file}: ${error.message}${colors.reset}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);
  }
  
  // MIGRATE RATE SHOP DATA WITH IMPROVED PARSING
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
      const lines = content.split('\n').filter(line => line.trim());
      
      const parts = file.replace('.csv', '').split('__');
      const reportDateStr = parts[0].replace(/PS_2025_Rate_ShopsSuggestions_/g, '').replace(/_/g, ' ');
      const checkInDateStr = parts[1] ? parts[1].replace(/_/g, ' ') : null;
      
      const records = [];
      
      // Skip header row (line 1) and process data rows
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cells = line.split(',');
        if (cells.length >= 7 && cells[0] && !cells[0].includes('Date')) {
          const checkDate = cells[0];
          const property = cells[1] || 'Pacific Sands';
          const roomType = cells[2] || 'Ocean View';
          const ourRate = parseNumber(cells[3]);
          const compRate1 = parseNumber(cells[4]);
          const compRate2 = parseNumber(cells[5]);
          const compRate3 = parseNumber(cells[6]);
          
          if (checkDate && ourRate > 0) {
            records.push({
              reportDate: parseDate(reportDateStr),
              checkInDate: parseDate(checkDate),
              property: property,
              roomType: roomType,
              ourRate: ourRate,
              compRate: compRate1 || compRate2 || compRate3,
              difference: compRate1 ? ourRate - compRate1 : null,
              percentDiff: compRate1 ? ((ourRate - compRate1) / compRate1) * 100 : null,
              availability: null,
              notes: null
            });
          }
        }
      }
      
      if (records.length > 0) {
        try {
          for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            await prisma.rateShop.createMany({
              data: batch
            });
          }
          console.log(`    ${colors.green}✅ Imported ${records.length} records${colors.reset}`);
          totalRecords += records.length;
        } catch (error: any) {
          console.error(`    ${colors.red}❌ Error importing ${file}: ${error.message}${colors.reset}`);
        }
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