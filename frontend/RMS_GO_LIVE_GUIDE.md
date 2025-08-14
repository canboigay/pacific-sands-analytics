# 🚀 RMS Go-Live Guide - Complete Activation Steps

## 📋 Pre-Flight Checklist

Before starting, ensure:
- [ ] GitHub shows your latest commit (hash: 474f1d4)
- [ ] You have access to Vercel dashboard
- [ ] You have access to Supabase dashboard
- [ ] You have the API key: `ps_me2w0k3e_x81fsv0yz3k`

## Step 1: Verify Vercel Deployment ✅

### 1.1 Check Deployment Status

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find `pacific-sands-analytics` project
3. Look for latest deployment with commit "feat: Add RMS Intelligence System"

**Expected Status**: ✅ Ready

### 1.2 Check Build Logs

Click on the deployment and check:
- [ ] "Installing dependencies" - Should show mathjs, lodash installed
- [ ] "Building packages" - Should show @pacific/formula-engine built
- [ ] "Generating Prisma Client" - Should complete successfully
- [ ] "Building application" - Should show "Compiled successfully"

### 1.3 Get Production URL

Your production URL should be:
```
https://pacific-sands-analytics.vercel.app
```

Or check the deployment for the actual URL.

### 1.4 Verify Environment Variables

In Vercel project settings > Environment Variables, ensure these exist:
```
DATABASE_URL
DIRECT_URL
FORMULA_CACHE_TTL=60
ENABLE_FORMULA_SANDBOX=true
AUDIT_ALL_CALCULATIONS=true
```

## Step 2: Run Database Migration 🗄️

### 2.1 Connect to Production Database

Option A - Using Vercel CLI:
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Pull production env vars
vercel env pull .env.production.local

# Run migration
NODE_ENV=production npx prisma migrate deploy
```

Option B - Using Supabase SQL Editor:
1. Go to Supabase Dashboard > SQL Editor
2. Create new query
3. Paste the contents of `frontend/prisma/migrations/20250813_add_rms_intelligence_system.sql`
4. Run query

### 2.2 Verify Tables Created

Run this query in Supabase:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'RMS%'
ORDER BY table_name;
```

**Expected Result**: 7 tables
- RMSCalculation
- RMSFormula
- RMSFormulaTest
- RMSFormulaVersion
- RMSParameter
- RMSRule
- RMSRuleExecution

## Step 3: Load Initial Data 📊

### 3.1 Run Seed Script

```bash
# Make sure you're in frontend directory
cd frontend

# Use production environment
NODE_ENV=production npx tsx prisma/seed-rms.ts
```

### 3.2 Verify Data Loaded

Run these queries in Supabase:

**Check Formulas:**
```sql
SELECT name, category, is_active 
FROM "RMSFormula" 
ORDER BY name;
```
Expected: 5 formulas (baseline_adr, trevpar_calculation, etc.)

**Check Rules:**
```sql
SELECT name, rule_type, priority 
FROM "RMSRule" 
ORDER BY priority DESC;
```
Expected: 4 rules

**Check Parameters:**
```sql
SELECT COUNT(*), category 
FROM "RMSParameter" 
GROUP BY category;
```
Expected: Multiple categories with 12+ total parameters

## Step 4: Test Endpoints 🧪

### 4.1 Test Formula List (Basic Test)

```bash
curl -X GET https://pacific-sands-analytics.vercel.app/api/admin/formulas \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### 4.2 Test ADR Calculation (Core Functionality)

```bash
curl -X POST https://pacific-sands-analytics.vercel.app/api/rms/calculate/adr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -d '{
    "date": "2024-08-13",
    "roomType": "Ocean View",
    "occupancy": 85,
    "competitorRates": [200, 210, 220]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "adr": [calculated_value],
    "breakdown": {...},
    "formula": {...}
  }
}
```

### 4.3 Test Sandy Query (AI Integration)

```bash
curl -X POST https://pacific-sands-analytics.vercel.app/api/sandy/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -d '{
    "query": "What formulas are active?"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {...},
  "query": "What formulas are active?",
  "intent": {...}
}
```

## Step 5: Progressive Testing Sequence 📈

Test in this order:

1. **Parameters** (simplest)
   ```bash
   curl -X GET https://pacific-sands-analytics.vercel.app/api/admin/parameters \
     -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k"
   ```

2. **Formulas** (no execution)
   ```bash
   curl -X GET https://pacific-sands-analytics.vercel.app/api/admin/formulas \
     -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k"
   ```

3. **Sandy Formulas** (read-only)
   ```bash
   curl -X GET https://pacific-sands-analytics.vercel.app/api/sandy/formulas \
     -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k"
   ```

4. **RMS Calculation** (complex)
   ```bash
   curl -X POST https://pacific-sands-analytics.vercel.app/api/rms/calculate/adr \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
     -d '{"date":"2024-08-13","roomType":"Ocean View","occupancy":75,"competitorRates":[190,200,210]}'
   ```

## 🚨 Troubleshooting

### Build Failures
- **"Cannot find module"**: Check package.json has all dependencies
- **"Build failed"**: Check Vercel build logs for specific error

### Migration Failures
- **"relation already exists"**: Tables already created, skip migration
- **"permission denied"**: Check DATABASE_URL has correct permissions
- **"connection refused"**: Verify DATABASE_URL is correct

### Endpoint 404 Errors
- Check URL spelling exactly
- Ensure deployment completed
- Verify route files exist in deployment

### Authentication Errors
- **401 Unauthorized**: Check Bearer token spelling
- **Missing auth header**: Include full "Bearer " prefix

### Database Connection Errors
- Check DATABASE_URL in Vercel env vars
- Verify Supabase project is active
- Check connection pooling settings

## ✅ Go-Live Verification

Run this verification script:

```bash
# Save as verify-live.sh
#!/bin/bash

BASE_URL="https://pacific-sands-analytics.vercel.app"
AUTH="Bearer ps_me2w0k3e_x81fsv0yz3k"

echo "🔍 Verifying RMS is live..."

# Test 1: Formulas
echo -n "Testing formulas endpoint... "
FORMULAS=$(curl -s -X GET "$BASE_URL/api/admin/formulas" -H "Authorization: $AUTH" | grep -c "success.*true")
[ $FORMULAS -eq 1 ] && echo "✅" || echo "❌"

# Test 2: Parameters
echo -n "Testing parameters endpoint... "
PARAMS=$(curl -s -X GET "$BASE_URL/api/admin/parameters" -H "Authorization: $AUTH" | grep -c "success.*true")
[ $PARAMS -eq 1 ] && echo "✅" || echo "❌"

# Test 3: ADR Calculation
echo -n "Testing ADR calculation... "
ADR=$(curl -s -X POST "$BASE_URL/api/rms/calculate/adr" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH" \
  -d '{"date":"2024-08-13","roomType":"Ocean View","occupancy":80,"competitorRates":[200]}' \
  | grep -c "adr")
[ $ADR -eq 1 ] && echo "✅" || echo "❌"

echo "🎉 RMS Go-Live verification complete!"
```

## 📞 Support Checklist

If issues persist:
1. Check Vercel deployment logs
2. Check Supabase logs (Dashboard > Logs > API)
3. Verify all environment variables
4. Test with local environment first
5. Check browser console for CORS errors

## 🎉 Success Indicators

Your RMS is fully live when:
- [ ] All test endpoints return success
- [ ] ADR calculations return valid numbers
- [ ] Sandy queries return explanations
- [ ] No errors in Vercel functions log
- [ ] Database shows calculation records

---

**Next Step**: Update Sandy's CustomGPT with the new schema!