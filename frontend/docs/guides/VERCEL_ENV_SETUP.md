# Vercel Environment Variables Setup

## COPY THESE TO VERCEL DASHBOARD:

### 1. DATABASE_URL
postgresql://postgres.gibketmqaipryafwtjui:PyT0uSVAZzdsLZuB@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

### 2. DIRECT_URL  
postgresql://postgres.gibketmqaipryafwtjui:PyT0uSVAZzdsLZuB@aws-0-us-west-1.pooler.supabase.com:5432/postgres

### 3. NODE_ENV
production

## STEPS IN VERCEL:
1. Go to: Settings > Environment Variables
2. Click 'Add New' for each variable
3. Select all environments (Production, Preview, Development)
4. Save each one
5. Redeploy your project

## NEW API URL FOR SANDY:
https://frontend-pinm23ffi-pacific-sands.vercel.app/api

