#!/bin/bash

echo "🚀 Pacific Sands Backend Deployment"
echo "===================================="
echo ""

# Check if we have Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Step 1: Set up environment variables
echo "📝 Setting up environment variables..."

# Create .env file with proper values
cat > .env << EOL
# Database (will be updated after database creation)
DATABASE_URL="postgresql://default:password@host/verceldb?sslmode=require"
DIRECT_DATABASE_URL="postgresql://default:password@host/verceldb"

# API Configuration
API_KEY="ps_me2w0k3e_x81fsv0yz3k"
PORT=3000

# CORS Settings  
ALLOWED_ORIGINS="https://pacific-sands-frontend.vercel.app,http://localhost:3000"
EOL

echo "✅ Environment file created"

# Step 2: Link to Vercel
echo ""
echo "🔗 Linking to Vercel..."
vercel link --yes

# Step 3: Pull environment variables if they exist
echo ""
echo "📥 Pulling Vercel environment variables..."
vercel env pull .env.production

# Step 4: Deploy the API
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on your pacific-sands-api project"
echo "3. Go to Storage tab"
echo "4. Create a new Postgres database"
echo "5. Connect it to your project"
echo ""
echo "Your API should be available at the URL shown above!"
