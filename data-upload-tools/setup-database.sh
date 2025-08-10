#!/bin/bash

echo "🗄️ Pacific Sands Database Setup"
echo "================================"
echo ""
echo "📝 Step 1: Create PostgreSQL Database"
echo "Please go to the Chrome tab with Vercel Dashboard"
echo "1. Click 'Create Store' or 'Create Database'"
echo "2. Select 'Postgres'"
echo "3. Name it: pacific-sands-db"
echo "4. Select your region (closest to you)"
echo "5. Click 'Create'"
echo ""
read -p "Press Enter when you've created the database..."

echo ""
echo "📋 Step 2: Copy Database Credentials"
echo "In the Vercel Dashboard:"
echo "1. Click on your new database (pacific-sands-db)"
echo "2. Go to '.env.local' tab"
echo "3. Copy the DATABASE_URL and POSTGRES_URL_NON_POOLING values"
echo ""
read -p "Press Enter when you have the credentials..."

echo ""
echo "🔧 Step 3: Configure Environment"
echo "Creating .env file..."

# Create .env file
read -p "Paste your DATABASE_URL here: " DB_URL
read -p "Paste your POSTGRES_URL_NON_POOLING here: " DIRECT_URL

cat > .env << EOL
DATABASE_URL="\${DB_URL}"
DIRECT_DATABASE_URL="\${DIRECT_URL}"
API_KEY="ps_me2w0k3e_x81fsv0yz3k"
PORT=3000
ALLOWED_ORIGINS="https://pacific-sands-frontend.vercel.app,http://localhost:3000"
EOL

echo "✅ Environment configured!"

echo ""
echo "🚀 Step 4: Initialize Database"
npx prisma generate
npx prisma db push

echo ""
echo "✅ Database setup complete!"
