# Update Files After Deployment

## Replace YOUR_VERCEL_DOMAIN with your actual domain

### 1. Update web-scraping-system.py (line 377)

**Change this:**
```python
mcp_base_url = "https://your-mcp-domain.com/api"
```

**To this (replace with your actual domain):**
```python
mcp_base_url = "https://YOUR_VERCEL_DOMAIN.vercel.app/api"
```

### 2. Update pacific-sands-gpt-schema.json (line 10)

**Change this:**
```json
"url": "https://your-domain.com/api"
```

**To this (replace with your actual domain):**
```json
"url": "https://YOUR_VERCEL_DOMAIN.vercel.app/api"
```

## Test Your API

After updating, test with:

```bash
# Test basic endpoint
curl https://YOUR_VERCEL_DOMAIN.vercel.app/

# Test authenticated endpoint
curl -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
     https://YOUR_VERCEL_DOMAIN.vercel.app/api/analytics/insights
```

## Update Custom GPT Actions

1. Go to your Custom GPT settings
2. Actions → Edit schema
3. Update the server URL in the schema to your live domain
4. Save changes

✅ Your system will then be fully operational!