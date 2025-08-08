# Pacific Sands Analytics API - Deployment Guide

## 🚀 Quick Deploy to Vercel (Recommended)

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from this directory
vercel --prod
```

### Option 2: Deploy via Vercel Web Interface
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import this repository
4. Vercel will auto-detect the Node.js project
5. Deploy automatically

## 🔧 Your Live URLs Will Be:

**Primary Domain:**
- `https://pacific-sands-analytics.vercel.app`
- `https://your-custom-name.vercel.app`

**API Endpoints:**
- `GET /api/analytics/insights`
- `GET /api/analytics/competitors` 
- `GET /api/analytics/sentiment`
- `POST /api/data/upload`
- `GET /api/forecasting/rates`
- `POST /api/knowledge/store`
- `GET /api/knowledge/retrieve`
- `GET /api/knowledge/synthesis`

## 🔑 Authentication
All endpoints require:
```
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k
```

## 📝 After Deployment - Update These Files:

1. **Update web-scraping-system.py line 377:**
   ```python
   mcp_base_url = "https://your-vercel-domain.vercel.app/api"
   ```

2. **Update pacific-sands-gpt-schema.json line 10:**
   ```json
   "url": "https://your-vercel-domain.vercel.app/api"
   ```

## 🧪 Test Your API:

```bash
# Test health endpoint
curl https://your-domain.vercel.app/health

# Test authenticated endpoint
curl -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
     https://your-domain.vercel.app/api/analytics/insights
```

## 📊 Alternative Hosting Options:

### Railway (1-click deploy)
1. Go to [railway.app](https://railway.app)
2. Connect GitHub
3. Deploy this repo
4. Custom domain included

### Render (Free tier)
1. Go to [render.com](https://render.com)
2. Connect GitHub
3. Auto-deploy on push
4. Free tier available

### DigitalOcean App Platform
1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Create new app from GitHub
3. $5/month for production-ready hosting

## ✅ Complete Integration Flow:

1. **Deploy API** → Get live domain URL
2. **Update scraper files** → Point to live API
3. **Update Custom GPT schema** → Point to live API  
4. **Run scrapers** → Data flows to live API
5. **Custom GPT** → Accesses live data for analysis

Your system will be fully operational with automated data collection and AI analysis!