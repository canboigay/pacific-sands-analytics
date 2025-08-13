# RMS Intelligence System - Production Setup Guide

## 🚨 IMPORTANT: Pre-Deployment Checklist

Before deploying to production, ensure you have:

1. ✅ Backed up your production database
2. ✅ Tested all migrations locally
3. ✅ Verified all environment variables are set in Vercel
4. ✅ Reviewed all formulas and rules for production readiness

## 📋 Environment Variables Required

Add these to your Vercel project settings:

```bash
# Existing variables (should already be set)
DATABASE_URL="your-supabase-connection-string"
DIRECT_URL="your-supabase-direct-connection-string"

# New RMS-specific variables
FORMULA_CACHE_TTL="60"              # Cache formulas for 60 seconds
ENABLE_FORMULA_SANDBOX="true"       # Enable formula testing
AUDIT_ALL_CALCULATIONS="true"       # Log all calculations
MAX_FORMULA_EXECUTION_TIME="5000"   # Max 5 seconds per formula
MAX_RULE_EXECUTION_TIME="3000"      # Max 3 seconds per rule
```

## 🚀 Deployment Steps

### 1. Install Dependencies Locally
```bash
cd frontend
npm install
```

### 2. Create Database Migration
```bash
# Generate migration for RMS tables
npx prisma migrate dev --name add_rms_intelligence_system
```

### 3. Commit All Changes
```bash
# Stage all RMS files
git add .

# Commit with detailed message
git commit -m "feat: Add RMS Intelligence System with dynamic formulas and rules

- Database-driven formula engine for pricing calculations
- Dynamic business rules with condition/action system
- Admin API for managing formulas, rules, and parameters
- Sandy AI integration for formula explanations
- Complete audit trail for all calculations
- Version control for formula changes"
```

### 4. Push to GitHub
```bash
git push origin main
```

### 5. Vercel Deployment (Automatic)
Vercel will automatically deploy when you push to main. Monitor the deployment:
1. Go to your Vercel dashboard
2. Check the deployment logs
3. Verify the build completes successfully

### 6. Run Production Migrations
After deployment, run migrations on production:

```bash
# Option A: Using Vercel CLI
vercel env pull .env.production.local
npm run db:migrate

# Option B: Using Supabase Dashboard
# Go to SQL Editor and run the migration SQL manually
```

### 7. Seed Initial Data
```bash
# Load initial formulas and rules
NODE_ENV=production npm run db:seed:rms
```

## 🔍 Post-Deployment Verification

### 1. Test Formula API
```bash
# Test formula listing
curl https://your-app.vercel.app/api/admin/formulas \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k"

# Should return list of seeded formulas
```

### 2. Test ADR Calculation
```bash
curl -X POST https://your-app.vercel.app/api/rms/calculate/adr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -d '{
    "date": "2024-07-15",
    "roomType": "Ocean View",
    "occupancy": 85,
    "competitorRates": [180, 195, 210]
  }'
```

### 3. Test Sandy Integration
```bash
curl -X POST https://your-app.vercel.app/api/sandy/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k" \
  -d '{
    "query": "Explain the baseline ADR formula"
  }'
```

## 📊 Monitoring

### Key Metrics to Track
1. **Formula Performance**
   - Average execution time < 100ms
   - Error rate < 0.1%

2. **Rule Effectiveness**
   - Rules matching as expected
   - Actions completing successfully

3. **API Response Times**
   - Admin APIs < 1s
   - RMS calculations < 500ms
   - Sandy queries < 2s

### Database Queries to Monitor
```sql
-- Check recent calculations
SELECT 
  f.name as formula_name,
  COUNT(*) as calculation_count,
  AVG(c.execution_time) as avg_execution_time,
  MAX(c.execution_time) as max_execution_time
FROM "RMSCalculation" c
JOIN "RMSFormula" f ON c.formula_id = f.id
WHERE c.calculated_at > NOW() - INTERVAL '24 hours'
GROUP BY f.name
ORDER BY calculation_count DESC;

-- Check rule execution
SELECT 
  r.name as rule_name,
  COUNT(*) as execution_count,
  SUM(CASE WHEN e.condition_met THEN 1 ELSE 0 END) as matches,
  AVG(e.execution_time) as avg_execution_time
FROM "RMSRuleExecution" e
JOIN "RMSRule" r ON e.rule_id = r.id
WHERE e.executed_at > NOW() - INTERVAL '24 hours'
GROUP BY r.name;
```

## 🚨 Rollback Plan

If issues occur, rollback immediately:

```bash
# 1. Revert to previous deployment in Vercel
# Go to Vercel Dashboard > Deployments > Select previous > Promote to Production

# 2. If database issues, restore from backup
# Use Supabase point-in-time recovery

# 3. Disable RMS features via parameters
UPDATE "RMSFormula" SET is_active = false;
UPDATE "RMSRule" SET is_active = false;
```

## 📝 Production Checklist

Before marking deployment complete:

- [ ] All API endpoints responding correctly
- [ ] Formulas calculating without errors
- [ ] Rules evaluating as expected
- [ ] Sandy can explain formulas
- [ ] Audit trail recording calculations
- [ ] No performance degradation
- [ ] Error rates within acceptable limits

## 🔐 Security Notes

1. **API Keys**: Ensure production API keys are different from development
2. **Formula Validation**: All formulas are validated before execution
3. **Rate Limiting**: Monitor for abuse and adjust limits if needed
4. **Audit Logs**: Review logs daily for first week

## 📞 Support

If issues arise:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for client-side errors
4. Contact support with deployment ID and error details

---

**Remember**: Always test in development first. The RMS system is critical for pricing - handle with care!