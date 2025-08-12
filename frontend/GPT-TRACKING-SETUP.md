# GPT Tracking Setup Guide

## Overview
This guide explains how to configure Sandy (CustomGPT) to automatically track all interactions with the Pacific Sands Analytics system.

## Current Setup

### 1. Direct Connection (Current)
- **GPT → API Server**: `https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api`
- **Tracking**: Manual (needs to be implemented on GPT side)

### 2. Proxy Connection (Recommended for Tracking)
To enable automatic tracking of all GPT interactions, update the CustomGPT to use the proxy endpoint:

## How to Enable Automatic Tracking

### Option 1: Update CustomGPT OpenAPI Schema
Replace the server URL in your CustomGPT configuration:

```json
"servers": [
  {
    "url": "https://frontend-q89qqh65u-pacific-sands.vercel.app/api/gpt-proxy",
    "description": "Pacific Sands Analytics Server with Tracking"
  }
]
```

Then update all endpoint paths to include the target endpoint as a parameter:
- `/analytics` → `/?endpoint=/analytics`
- `/forecasting` → `/?endpoint=/forecasting`
- `/knowledge` → `/?endpoint=/knowledge`

### Option 2: Manual Tracking
If you prefer to keep the direct connection, you can manually log interactions by calling:

```
POST https://frontend-q89qqh65u-pacific-sands.vercel.app/api/gpt-tracking
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k

{
  "interactionType": "query",
  "endpoint": "/analytics",
  "requestData": {...},
  "responseData": {...},
  "category": "analytics",
  "businessValue": "Data-driven decision support"
}
```

## Testing the Connection

### Test Direct Connection:
```bash
curl "https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api/health"
```

### Test Proxy Connection:
```bash
curl "https://frontend-q89qqh65u-pacific-sands.vercel.app/api/gpt-proxy?endpoint=/health&bypass=custom_gpt_integration"
```

## Benefits of Using the Proxy

1. **Automatic Tracking**: All interactions are logged automatically
2. **Performance Metrics**: Response times, data volumes tracked
3. **Insight Capture**: AI-generated insights stored for analysis
4. **Usage Analytics**: Daily summaries and trend analysis
5. **Business Value**: Track which insights lead to actions

## Current Endpoints Being Tracked

- `/analytics` - Business analytics queries
- `/forecasting` - Rate forecasting requests
- `/knowledge` - Insight storage and retrieval
- `/health` - System health checks

## Dashboard Access

View all GPT analytics at:
https://frontend-q89qqh65u-pacific-sands.vercel.app/rms-alerts

Scroll down to find the "Sandy AI Analytics" widget.