# 🚀 RMS Quick Reference Card

## 🌐 Production URLs

**Base URL**: `https://pacific-sands-analytics.vercel.app`  
**API Key**: `Bearer ps_me2w0k3e_x81fsv0yz3k`

## 📍 Key Endpoints

### Admin Console
```bash
GET  /api/admin/formulas           # List formulas
POST /api/admin/formulas           # Create formula
GET  /api/admin/formulas/[id]      # Get formula
PUT  /api/admin/formulas/[id]      # Update formula
POST /api/admin/formulas/[id]/test # Test formula

GET  /api/admin/rules              # List rules
POST /api/admin/rules/evaluate     # Test rules

GET  /api/admin/parameters         # List parameters
PUT  /api/admin/parameters/bulk    # Bulk update
```

### RMS Platform
```bash
POST /api/rms/calculate/adr        # Calculate ADR
```

### Sandy AI
```bash
GET  /api/sandy/formulas          # Get explanations
POST /api/sandy/insights          # Generate insights  
POST /api/sandy/query             # Natural language
```

## 🧪 Quick Test Commands

### 1. Check if live
```bash
curl -X GET https://pacific-sands-analytics.vercel.app/api/admin/formulas \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k"
```

### 2. Calculate ADR
```bash
curl -X POST https://pacific-sands-analytics.vercel.app/api/rms/calculate/adr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -d '{"date":"2024-08-13","roomType":"Ocean View","occupancy":85,"competitorRates":[200,210,220]}'
```

### 3. Query Sandy
```bash
curl -X POST https://pacific-sands-analytics.vercel.app/api/sandy/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -d '{"query":"What formulas are active?"}'
```

## 🗄️ Database Commands

### Run Migration
```bash
NODE_ENV=production npx prisma migrate deploy
```

### Seed Data
```bash
NODE_ENV=production npx tsx prisma/seed-rms.ts
```

### Verify Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'RMS%';
```

## 📊 Core Formulas

1. **baseline_adr**: `BASE_ADR * (1 + D1 + D2 + D3 + D4 + M)`
2. **trevpar_calculation**: `(ROOM + SPA + F&B + RETAIL + ACTIVITIES) / AVAILABLE_NIGHTS`
3. **occupancy_forecast**: `BASE_OCC * (1 + SEASONAL) * (1 + EVENT) * WEATHER`
4. **elasticity_calculation**: `abs(PERCENT_CHANGE_OCC / PERCENT_CHANGE_RATE)`
5. **budget_gap**: `(BUDGET - EXPECTED) / BUDGET`

## 🎛️ Key Parameters

### Demand Thresholds
- `>90%`: +10%
- `80-90%`: +5%
- `60-70%`: -5%
- `<60%`: -10%

### System Limits
- Max daily rate change: 15%
- Formula timeout: 5 seconds
- Rule timeout: 3 seconds

## 🚨 Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check Bearer token spelling |
| 404 Not Found | Verify endpoint URL |
| 500 Server Error | Check logs, likely DB issue |
| No data returned | Run seed script |
| Slow response | Check formula complexity |

## 🔧 Useful Scripts

### Verify Deployment
```bash
npx tsx verify-rms-deployment.ts https://pacific-sands-analytics.vercel.app
```

### Check Logs
```bash
vercel logs --follow
```

### Test All Endpoints
```bash
./verify-live.sh
```

## 📱 Sandy Test Prompts

1. "Show me all RMS formulas"
2. "Explain the baseline ADR formula"
3. "What are the current demand thresholds?"
4. "Calculate ADR for 85% occupancy"
5. "How is the RMS performing?"

---

**Remember**: All formulas and rules are in the database - nothing is hardcoded!