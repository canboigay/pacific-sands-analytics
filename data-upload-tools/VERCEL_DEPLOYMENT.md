# 🚀 Vercel + Prisma Deployment Guide for Pacific Sands Analytics

## Overview
This guide will help you deploy your Pacific Sands Analytics API to Vercel with Prisma database integration for your Custom GPT.

## ✅ What's Been Fixed
- ✅ Proper Vercel serverless structure in `/api` folder
- ✅ Fixed Prisma client imports (no more custom paths)
- ✅ Comprehensive API endpoints for your Custom GPT
- ✅ Proper CORS and authentication
- ✅ Enhanced error handling and insights generation

## 🏗️ Project Structure
```
/api/                     # Vercel serverless functions
  ├── index.js           # Main API router & health checks
  ├── analytics.js       # Analytics insights for GPT
  ├── upload.js          # Data upload endpoint  
  ├── forecasting.js     # Rate forecasting
  └── knowledge.js       # Knowledge management (store/retrieve insights)
/prisma/
  └── schema.prisma      # Database schema (fixed)
pacific-sands-gpt-schema.json  # OpenAPI schema for Custom GPT
vercel.json             # Vercel configuration
package.json            # Dependencies
```

## 🗄️ Database Setup

### 1. Create Postgres Database
Choose one option:

**Option A: Vercel Postgres (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and create database
vercel login
vercel postgres create pacific-sands-db
```

**Option B: External Provider (Supabase, Railway, etc.)**
- Create a PostgreSQL database
- Get the connection URL

### 2. Environment Variables
Create `.env` file:
```bash
# Database
PRISMA_DATABASE_URL="postgresql://username:password@host:port/database"

# Optional: For connection pooling
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🚀 Deployment Steps

### 1. Deploy to Vercel
```bash
# Initialize if not already done
vercel

# Deploy
vercel --prod
```

### 2. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

### 3. Test Your API
Your API will be available at: `https://your-app-name.vercel.app`

Test endpoints:
```bash
# Health check
curl https://your-app-name.vercel.app/health

# API info
curl https://your-app-name.vercel.app/api/
```

## 🤖 Custom GPT Integration

### 1. Update Schema URL
In `pacific-sands-gpt-schema.json`, replace:
```json
"url": "https://your-vercel-app.vercel.app/api"
```
With your actual Vercel URL.

### 2. Configure Custom GPT
1. Go to ChatGPT → Create a GPT
2. Add Actions
3. Upload `pacific-sands-gpt-schema.json`
4. Add API Key: `ps_me2w0k3e_x81fsv0yz3k`
5. Set Authentication: API Key in Header

### 3. Test GPT Integration
Ask your GPT:
- "What are the current business insights?"
- "Upload some sample rate data"
- "Generate a rate forecast for next 30 days"
- "Store this insight: Customer feedback shows strong satisfaction with beach access"

## 📊 API Endpoints for Your GPT

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics?endpoint=insights` | GET | Business insights & analytics |
| `/api/analytics?endpoint=competitors` | GET | Competitor analysis |
| `/api/analytics?endpoint=sentiment` | GET | Customer sentiment analysis |
| `/api/upload` | POST | Upload CSV/data |
| `/api/forecasting` | GET | Rate forecasting |
| `/api/knowledge?action=store` | POST | Store GPT insights |
| `/api/knowledge?action=retrieve` | GET | Retrieve stored insights |
| `/api/knowledge?action=synthesis` | GET | Synthesized insights |

## 🔑 Authentication
All endpoints require:
```
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k
```

## 📈 Next Steps

### 1. Upload Historical Data
Use your existing CSV files with the upload endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -H "Content-Type: application/json" \
  -d '{
    "data_type": "rates",
    "data": [{"date": "2024-01-01", "rate": 295.50, "room_type": "Standard"}],
    "filename": "historical-rates.csv"
  }'
```

### 2. Automate Data Collection
Your Python scrapers can now upload directly to the live API:
```python
import requests

def upload_to_api(data_type, data):
    url = "https://your-app.vercel.app/api/upload"
    headers = {
        "Authorization": "Bearer ps_me2w0k3e_x81fsv0yz3k",
        "Content-Type": "application/json"
    }
    payload = {
        "data_type": data_type,
        "data": data,
        "source": "web_scraper"
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

### 3. Monitor & Scale
- Use Vercel Analytics to monitor API usage
- Scale database as needed
- Add more sophisticated ML models for forecasting

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull
```

### API Not Working
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod
```

### GPT Integration Issues
1. Verify schema URL is correct
2. Check API key is properly set
3. Test endpoints manually first

## 📁 Files to Remove (Optional Cleanup)
Once deployed successfully, you can remove:
- `server.js` (old local server)
- `server-old.js`
- `server-prisma.js` 
- `storage-manager.js` (replaced by Prisma)

## 🎯 Success Criteria
✅ API deployed to Vercel  
✅ Database connected and migrations run  
✅ Custom GPT can access all endpoints  
✅ Data upload works  
✅ Insights generation working  
✅ Forecasting providing recommendations  

---

**🏨 Your Pacific Sands Analytics API is now live and ready for your Custom GPT!**
