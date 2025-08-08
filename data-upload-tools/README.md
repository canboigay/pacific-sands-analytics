# Pacific Sands Analytics API

Complete hotel analytics and competitive intelligence system for Pacific Sands Resort.

## 🏨 Features

- **Real-time Analytics API** - Business insights, competitor analysis, sentiment tracking
- **Automated Web Scraping** - Competitor pricing, reviews, social media monitoring  
- **Knowledge Base** - Qualitative insights storage and retrieval
- **Custom GPT Integration** - OpenAPI schema for ChatGPT Actions
- **Rate Forecasting** - AI-powered pricing recommendations

## 🚀 Quick Start

### Deploy to Vercel
1. Import this repo to [Vercel](https://vercel.com)
2. Deploy automatically 
3. Get your live URL: `https://your-app.vercel.app`

### Update Configuration
Replace placeholder URLs in:
- `web-scraping-system.py` line 377
- `pacific-sands-gpt-schema.json` line 10

## 📊 API Endpoints

All endpoints require: `Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k`

### Analytics
- `GET /api/analytics/insights` - Business insights and recommendations
- `GET /api/analytics/competitors` - Competitor pricing analysis  
- `GET /api/analytics/sentiment` - Customer sentiment analysis

### Data Management
- `POST /api/data/upload` - Upload historical data or scraped data
- `GET /api/forecasting/rates` - AI rate forecasting

### Raw Records
- `GET /api/raw-records/search` - Filter records by fields stored in `payload`
- `POST /api/raw-records/semantic-search` - Semantic search over embeddings

### Knowledge Base
- `POST /api/knowledge/store` - Store qualitative insights
- `GET /api/knowledge/retrieve` - Search stored insights
- `GET /api/knowledge/synthesis` - Combined analysis

## 🤖 Automated Data Collection

### Web Scrapers
- `python web-scraping-system.py` - Full competitor data scrape
- `python social-media-scraper.py` - Social media monitoring
- `python scraper-scheduler.py` - Automated scheduling

### Schedule
- **Daily 6:00 AM** - Competitor pricing
- **Every 2 hours** - Social media mentions
- **Weekly Sunday 2:00 AM** - Full comprehensive scrape

## 🧠 Custom GPT Integration

1. Upload `pacific-sands-gpt-schema.json` to ChatGPT Actions
2. Add API key: `ps_me2w0k3e_x81fsv0yz3k`
3. GPT can now access all analytics and store insights

## 📁 Key Files

- `server.js` - Main API server
- `web-scraping-system.py` - Competitor intelligence scraper
- `social-media-scraper.py` - Social media monitoring  
- `scraper-scheduler.py` - Automated task scheduler
- `pacific-sands-gpt-schema.json` - OpenAPI schema for Custom GPT
- `knowledge-base-interface.html` - Web interface for insights

## 💾 Data Storage

- Automatic JSON backups for all uploaded data
- CSV exports with timestamps
- In-memory storage (upgrade to database for production)

## 🔧 Local Development

```bash
npm install
npm start
# API runs on http://localhost:3000
```

## 📈 Business Intelligence Dashboard

Open `dashboard/index.html` for visual analytics interface with:
- Revenue forecasting
- Competitor analysis
- Sentiment timeline
- Key performance indicators

---

**🎯 Complete hotel intelligence system ready for deployment!**# Force redeploy Fri Aug  8 13:19:53 PDT 2025
