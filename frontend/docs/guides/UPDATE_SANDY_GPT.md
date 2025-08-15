# Update Sandy (CustomGPT) Configuration

## Problem
Sandy is trying to connect to the old data-upload-tools backend, but your data is now in the frontend Next.js app with Supabase.

## Solution
Update Sandy's base URL in the CustomGPT configuration.

### Old Configuration
```
Base URL: https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api
```

### New Configuration
Update to your frontend deployment:

#### Option 1: If frontend is deployed on Vercel
```
Base URL: https://[YOUR-FRONTEND-URL].vercel.app/api
```

#### Option 2: For local testing
```
Base URL: http://localhost:3000/api
```
(Use ngrok to expose local server: `ngrok http 3000`)

## Steps to Update Sandy

1. **Go to CustomGPT Configuration**
   - Open Sandy's configuration in ChatGPT
   - Navigate to Actions/Schema section

2. **Update the Server URL**
   Replace:
   ```json
   "servers": [
     {
       "url": "https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api",
       "description": "Pacific Sands Live Analytics Server"
     }
   ]
   ```
   
   With:
   ```json
   "servers": [
     {
       "url": "https://[YOUR-FRONTEND-DEPLOYMENT].vercel.app/api",
       "description": "Pacific Sands Analytics Server (Updated)"
     }
   ]
   ```

3. **Test the Connection**
   Ask Sandy to:
   - "Check system health"
   - "Get current analytics"
   - "Show recent occupancy data"

## Available Endpoints

All these endpoints now exist in your frontend:

- `GET /api` - API information
- `GET /api/health` - System health check
- `GET /api/analytics?endpoint=insights` - Business insights
- `GET /api/forecasting` - Rate forecasting
- `GET /api/knowledge` - Retrieve insights
- `POST /api/knowledge` - Store insights

## Authentication

Sandy uses the `bypass=custom_gpt_integration` parameter, so no Bearer token is needed for her requests.

## Troubleshooting

If Sandy still can't connect:

1. **Check Deployment Status**
   ```bash
   vercel ls
   ```

2. **Test Endpoints Manually**
   ```bash
   curl https://[YOUR-URL]/api/health
   ```

3. **Check CORS Headers**
   The frontend already has CORS enabled in vercel.json

4. **Verify Database Connection**
   - Check Supabase is connected
   - Ensure environment variables are set in Vercel

## Data Flow

1. Sandy makes request → Frontend API
2. Frontend queries Supabase (PostgreSQL)
3. Data returned to Sandy
4. Sandy can store insights back to database