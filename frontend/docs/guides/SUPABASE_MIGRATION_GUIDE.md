# Supabase Migration Guide

## Prerequisites

1. **Supabase Project**: You have `db.gibketmqaipryafwtjui.supabase.co`
2. **Database Password**: You need your Supabase password
3. **Node.js & npm**: Already installed

## Step-by-Step Migration

### 1. Get Your Connection URLs

Go to your Supabase dashboard:
- Navigate to **Settings → Database**
- Find **Connection string** section
- You need both:
  - **Direct connection** (already have: `db.gibketmqaipryafwtjui.supabase.co`)
  - **Connection pooling** (Transaction mode - looks like `aws-0-us-west-1.pooler.supabase.com`)

### 2. Update Environment Variables

Edit `.env.supabase` and replace `[YOUR-PASSWORD]` with your actual password:

```env
DIRECT_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.gibketmqaipryafwtjui.supabase.co:5432/postgres"
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

### 3. Run Migration Steps

```bash
# 1. Backup current setup
cp .env .env.backup
cp prisma/schema.prisma prisma/schema.sqlite.backup

# 2. Use PostgreSQL schema
cp prisma/schema.postgres.prisma prisma/schema.prisma

# 3. Update environment
cp .env.supabase .env

# 4. Install dependencies
npm install

# 5. Generate Prisma Client for PostgreSQL
npx prisma generate

# 6. Push schema to Supabase (creates tables)
npx prisma db push

# 7. Run data migration
npx tsx migrate-to-supabase.ts
```

### 4. Verify Migration

1. Go to Supabase dashboard → **Table Editor**
2. Check these tables have data:
   - `PaceReport` (should have 432 records)
   - `OccupancyData` (should have 96 records)
   - `GPTInteraction` (should have 14 records)

### 5. Update Your Application

After migration, your app will automatically use Supabase instead of SQLite.

### 6. Update Vercel Environment

In Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Update:
   - `DATABASE_URL` with pooled connection string
   - `DIRECT_URL` with direct connection string

## Troubleshooting

### Connection Refused
- Check password is correct
- Ensure no special characters need escaping in password
- Verify Supabase project is active

### Migration Fails
- Run `npx prisma db push --force-reset` to recreate schema
- Check for data type mismatches
- Ensure all required fields have data

### Performance Issues
- Use connection pooling URL for app
- Add `?pgbouncer=true&connection_limit=1` to pooled URL
- Enable query optimization in Supabase

## Rollback Plan

If something goes wrong:
```bash
# Restore SQLite setup
cp .env.backup .env
cp prisma/schema.sqlite.backup prisma/schema.prisma
npx prisma generate
```

Your SQLite database at `prisma/dev.db` remains untouched during migration.