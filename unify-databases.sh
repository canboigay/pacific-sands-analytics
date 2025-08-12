#!/bin/bash

# Database Unification Script for Pacific Sands
# This script helps connect both systems to the same database

set -e

echo "🔄 Pacific Sands Database Unification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "data-upload-tools" ]; then
    echo -e "${RED}Error: Please run this script from the pacific-sands-analytics root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking current database configurations...${NC}"
echo ""

# Check data-upload-tools database
echo "📦 Data-Upload-Tools Configuration:"
if [ -f "data-upload-tools/.env.production" ]; then
    echo "Found production env file"
    grep -E "DATABASE_URL|DIRECT_DATABASE_URL" data-upload-tools/.env.production || echo "No database URL found"
else
    echo -e "${RED}No production env file found${NC}"
fi

echo ""
echo "🖥️  Frontend Configuration:"
if [ -f "frontend/.env.production" ]; then
    echo "Found production env file"
    grep "DATABASE_URL" frontend/.env.production || echo "No database URL found"
else
    echo -e "${RED}No production env file found${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Options for unification${NC}"
echo ""
echo "1. Update frontend to use data-upload-tools PostgreSQL database"
echo "2. Create new unified database for both systems"
echo "3. Keep separate databases but sync data"
echo ""

echo -e "${GREEN}Recommended: Option 1 - Use existing PostgreSQL database${NC}"
echo ""

echo -e "${YELLOW}Step 3: To unify databases:${NC}"
echo ""
echo "1. Get the PostgreSQL connection string from Vercel dashboard"
echo "   - Go to: https://vercel.com/pacific-sands/data-upload-tools/settings/environment-variables"
echo "   - Copy the DATABASE_URL value"
echo ""
echo "2. Update frontend/.env.production:"
echo "   DATABASE_URL=\"<paste-postgresql-url-here>\""
echo ""
echo "3. Update frontend Prisma schema to match production:"
echo "   cd frontend"
echo "   npx prisma db pull    # Pull schema from PostgreSQL"
echo "   npx prisma generate   # Generate client"
echo ""
echo "4. Deploy the updated configuration:"
echo "   vercel env add DATABASE_URL production"
echo "   vercel --prod"
echo ""

echo -e "${YELLOW}Step 4: Verify data visibility${NC}"
echo ""
echo "After connecting to the same database, you should see:"
echo "- Sandy's uploaded rate data (22,692 records)"
echo "- Budget data (171 records)"
echo "- All stored insights (128 records)"
echo ""

echo -e "${GREEN}✅ Ready to unify databases!${NC}"
echo ""
echo "Need help? Check DATABASE-UNIFICATION-GUIDE.md for detailed instructions"