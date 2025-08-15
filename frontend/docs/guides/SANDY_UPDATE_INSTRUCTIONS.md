# Sandy (CustomGPT) Update Instructions

## Your Frontend URL
```
https://frontend-zeta-drab-88.vercel.app/
```

## Update Sandy's Configuration

### 1. In ChatGPT, go to Sandy's configuration

### 2. Update the schema's server section

**Change FROM:**
```json
"servers": [
  {
    "url": "https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api",
    "description": "Pacific Sands Live Analytics Server"
  }
]
```

**Change TO:**
```json
"servers": [
  {
    "url": "https://frontend-zeta-drab-88.vercel.app/api",
    "description": "Pacific Sands Analytics Server (Updated)"
  }
]
```

### 3. Save the configuration

## Test Sandy's Connection

After updating, test these commands with Sandy:

1. **"Check system health"**
   - Should return database connection status
   - Shows record counts

2. **"What's our current occupancy rate?"**
   - Should return real occupancy data from your database

3. **"Generate a 7-day rate forecast"**
   - Should return rate predictions

4. **"Show recent analytics insights"**
   - Should return business insights

## Available Endpoints at Your Frontend

All these endpoints are now live at `https://frontend-zeta-drab-88.vercel.app/api`:

- ✅ `/api` - API information
- ✅ `/api/health` - System health check
- ✅ `/api/analytics?endpoint=insights` - Business analytics
- ✅ `/api/forecasting` - Rate forecasting
- ✅ `/api/knowledge` - Store/retrieve insights
- ✅ `/api/data` - Direct data queries (requires auth)
- ✅ `/api/agents` - Multi-agent system

## Quick Test

You can test manually:
```bash
curl https://frontend-zeta-drab-88.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "db": "connected",
  "records": [number],
  "timestamp": "..."
}
```

## If Sandy Still Has Issues

1. Make sure the frontend is deployed and running
2. Check that all environment variables are set in Vercel
3. Verify database connection (SQLite or Supabase)
4. Clear Sandy's cache by saying "Clear your cache and try again"

## Authentication

Sandy uses `bypass=custom_gpt_integration` so no Bearer token needed for her requests.