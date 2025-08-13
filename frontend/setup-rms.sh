#!/bin/bash

echo "🚀 Setting up Pacific Sands RMS Intelligence System"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the frontend directory"
    exit 1
fi

print_status "Installing dependencies..."

# Install root dependencies
npm install

# Install formula engine dependencies
print_status "Installing @pacific/formula-engine dependencies..."
cd packages/@pacific/formula-engine
npm install
npm run build
cd ../../..

# Install rules engine dependencies  
print_status "Installing @pacific/rules-engine dependencies..."
cd packages/@pacific/rules-engine
npm install
npm run build
cd ../../..

print_success "Dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migration
print_status "Running database migration..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    print_warning "Migration failed, trying to create migration..."
    npx prisma migrate dev --name add_rms_tables
fi

# Seed the database
print_status "Seeding RMS formulas, rules, and parameters..."
npx tsx prisma/seed-rms.ts

if [ $? -eq 0 ]; then
    print_success "Database seeded successfully"
else
    print_error "Failed to seed database"
    exit 1
fi

# Create a summary
echo ""
echo "=================================================="
print_success "RMS Intelligence System Setup Complete!"
echo ""
echo "📊 What's been set up:"
echo "  ✅ Database schema for dynamic formulas, rules, and parameters"
echo "  ✅ Formula engine for parsing and executing formulas"
echo "  ✅ Rules engine for evaluating conditions and actions"
echo "  ✅ Admin API endpoints for managing formulas and rules"
echo "  ✅ RMS calculation API using dynamic formulas"
echo "  ✅ Sandy AI integration for formula explanations"
echo "  ✅ Initial formulas and parameters loaded"
echo ""
echo "🔧 Admin Console Endpoints:"
echo "  - GET/POST    /api/admin/formulas"
echo "  - GET/PUT/DEL /api/admin/formulas/[id]"
echo "  - POST        /api/admin/formulas/[id]/test"
echo "  - GET/POST    /api/admin/rules"
echo "  - GET/PUT/DEL /api/admin/rules/[id]"
echo "  - POST        /api/admin/rules/evaluate"
echo "  - GET/POST    /api/admin/parameters"
echo "  - PUT         /api/admin/parameters/bulk"
echo "  - POST        /api/admin/parameters/import"
echo "  - GET         /api/admin/parameters/export"
echo ""
echo "🤖 Sandy AI Endpoints:"
echo "  - GET  /api/sandy/formulas"
echo "  - POST /api/sandy/insights"
echo "  - POST /api/sandy/query"
echo ""
echo "💡 RMS Platform Endpoints:"
echo "  - POST /api/rms/calculate/adr"
echo ""
echo "📝 Next Steps:"
echo "  1. Build the admin console UI for formula editing"
echo "  2. Create additional RMS calculation endpoints"
echo "  3. Implement real-time formula updates"
echo "  4. Add more sophisticated testing capabilities"
echo ""
echo "Run 'npm run dev' to start the development server"
echo "==================================================