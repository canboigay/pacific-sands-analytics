# Database Unification Guide for Pacific Sands

## Current Problem
We have two separate databases:
1. **Production PostgreSQL** (Supabase) - Where Sandy uploads data
2. **Local SQLite** - Where the dashboard and multi-agent system read from

## Solution Steps

### Step 1: Update Frontend Environment
The frontend needs to connect to the same PostgreSQL database as data-upload-tools.

1. Copy the DATABASE_URL from data-upload-tools/.env.production
2. Update frontend/.env.production with the PostgreSQL connection string
3. Ensure both systems use the same database

### Step 2: Schema Alignment
The two systems have different schemas:

**data-upload-tools schema** (PostgreSQL):
- RateData
- CompetitorData  
- CustomerFeedback
- MarketInsights
- Forecast
- Knowledge

**frontend schema** (SQLite):
- OccupancyData
- PaceReport
- RateShop
- DataImport
- GPTInteraction
- (and more...)

### Step 3: Database Migration Strategy

#### Option 1: Use Frontend Schema (Recommended)
1. Migrate data-upload-tools to use the frontend schema
2. Update Sandy's endpoints to write to the correct tables
3. Keep all functionality in one unified schema

#### Option 2: Use Data-Upload-Tools Schema
1. Migrate frontend to use the simpler schema
2. Update all dashboard components
3. Modify multi-agent system queries

#### Option 3: Hybrid Approach
1. Keep both schemas in the same database
2. Create views or stored procedures to bridge them
3. Gradually migrate to unified schema

### Step 4: Immediate Actions

1. **Check Production Database Access**
   ```bash
   # From data-upload-tools directory
   cat .env.production | grep DATABASE_URL
   ```

2. **Update Frontend Production Config**
   ```bash
   # Copy PostgreSQL URL to frontend/.env.production
   # Update DATABASE_URL to match data-upload-tools
   ```

3. **Test Connection**
   ```bash
   cd frontend
   npx prisma db pull  # Pull existing schema from PostgreSQL
   npx prisma generate # Generate client
   ```

4. **Deploy Updated Configuration**
   ```bash
   vercel env pull
   vercel env add DATABASE_URL production
   vercel --prod
   ```

### Step 5: Data Migration
Once connected to the same database:

1. Map Sandy's uploaded data to frontend schema:
   - RateData → RateShop
   - Knowledge → Insight
   - CompetitorData → CompetitorRate

2. Create migration scripts to move existing data

3. Update Sandy's API endpoints to write to the correct tables

### Step 6: Update Sandy's Configuration
Update the CustomGPT to know about the new unified system:
- Keep existing endpoints for compatibility
- Add new multi-agent endpoint
- Ensure data flows to the right tables

## Benefits After Unification
- ✅ Sandy's uploads visible in dashboard
- ✅ Multi-agent system uses real production data
- ✅ Single source of truth for all data
- ✅ Real-time updates across all systems
- ✅ No more data synchronization issues

## Risk Mitigation
1. Backup all data before migration
2. Test in staging environment first
3. Keep old endpoints working during transition
4. Monitor for any data loss or corruption
5. Have rollback plan ready