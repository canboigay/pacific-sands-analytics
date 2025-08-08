#!/bin/bash
set -e

echo "🚀 Starting Vercel + Prisma Setup"

# Skip Vercel CLI install (assuming already installed)
echo "Checking Vercel CLI..."
vercel whoami || echo "Please run 'vercel login' if needed"

# Get database URL
echo ""
echo "📝 Please create a Postgres database:"
echo "1. Open: https://vercel.com/dashboard/stores/new"
echo "2. Click 'Postgres' (Powered by Neon)"
echo "3. Name it: pacific-sands-db"
echo "4. Click 'Create'"
echo "5. Copy the DATABASE_URL"
echo ""
echo "Paste your DATABASE_URL here:"
read DATABASE_URL

# Add to Vercel
echo "$DATABASE_URL" | vercel env add DATABASE_URL production --force
echo "$DATABASE_URL" | vercel env add DATABASE_URL preview --force
echo "$DATABASE_URL" | vercel env add DATABASE_URL development --force

# Sync environment
vercel env pull .env.local --yes

# Install dependencies
npm install prisma@latest @prisma/client@latest --save
npm install papaparse @types/node --save-dev

# Create Prisma schema
mkdir -p prisma
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model CSVUpload {
  id          String   @id @default(cuid())
  fileName    String
  uploadedAt  DateTime @default(now())
  rowCount    Int
  status      String   @default("processing")
  data        DataRow[]
}

model DataRow {
  id         String    @id @default(cuid())
  uploadId   String
  upload     CSVUpload @relation(fields: [uploadId], references: [id], onDelete: Cascade)
  rowData    Json
  @@index([uploadId])
}
EOF

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.postinstall = 'prisma generate';
pkg.scripts.build = 'prisma generate && next build';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Create Prisma client
mkdir -p lib
cat > lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF

# Create health check API
mkdir -p app/api/health
cat > app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'healthy', database: 'connected' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
EOF

# Setup database
npx prisma generate
npx prisma db push --accept-data-loss

# Test connection
echo "Testing database..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected!'))
  .catch(e => console.log('❌ Error:', e.message))
  .finally(() => prisma.\$disconnect());
"

# Deploy
vercel --prod --yes

echo "✅ Setup complete! Check your deployment."