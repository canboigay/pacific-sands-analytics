import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate a deterministic embedding for a piece of text.
 *
 * If an OpenAI API key is available, this function could be replaced with
 * a real embedding call.  For this one-off backfill we generate a simple
 * numeric vector based on the SHA256 hash of the text so the script can run
 * without external dependencies.
 */
function generateEmbedding(text: string): number[] {
  const hash = crypto.createHash('sha256').update(text).digest();
  // Convert first 32 bytes of hash into 32 floating point numbers between 0 and 1
  return Array.from(hash.slice(0, 32)).map((b) => b / 255);
}

// Helper to stringify records including Date values
function serializeRecord(record: any): string {
  return JSON.stringify(record, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

async function backfill() {
  const rateRecords = await prisma.rateRecord.findMany();
  const occupancyRecords = await prisma.occupancyRecord.findMany();

  console.log(`Found ${rateRecords.length} rate records and ${occupancyRecords.length} occupancy records.`);

  // Ensure the destination table exists
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS raw_records (
    id SERIAL PRIMARY KEY,
    data_type TEXT NOT NULL,
    data JSONB NOT NULL,
    embedding JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  let inserted = 0;

  for (const r of rateRecords) {
    const data = serializeRecord(r);
    const embedding = JSON.stringify(generateEmbedding(data));
    await prisma.$executeRaw`INSERT INTO raw_records (data_type, data, embedding) VALUES ('rate', ${data}::jsonb, ${embedding}::jsonb)`;
    inserted++;
  }

  for (const o of occupancyRecords) {
    const data = serializeRecord(o);
    const embedding = JSON.stringify(generateEmbedding(data));
    await prisma.$executeRaw`INSERT INTO raw_records (data_type, data, embedding) VALUES ('occupancy', ${data}::jsonb, ${embedding}::jsonb)`;
    inserted++;
  }

  const rawCount: any = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM raw_records`;
  console.log(`Inserted ${inserted} records. RawRecord count: ${rawCount[0].count}`);
}

backfill()
  .catch((e) => {
    console.error('Backfill failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
