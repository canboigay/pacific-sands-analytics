# Deploying to Vercel with Supabase

## Quick Start Guide

### 1. Set Up Supabase (Local Development)
```bash
# Run the setup script
./setup-supabase-fresh.sh

# Then migrate your data
npm install sqlite3
node migrate-to-supabase-clean.js
```

### 2. Test Locally
```bash
npm run dev
# Visit http://localhost:3000
# Check that data loads from Supabase
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add API_KEY
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set environment variables:
   ```
   DATABASE_URL = postgresql://postgres.gibketmqaipryafwtjui:PyT0uSVAZzdsLZuB@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   
   DIRECT_URL = postgresql://postgres:PyT0uSVAZzdsLZuB@db.gibketmqaipryafwtjui.supabase.co:5432/postgres
   
   API_KEY = ps_me2w0k3e_x81fsv0yz3k
   ```

### 4. Important Vercel Settings

In your `vercel.json`:
```json
{
  "buildCommand": "prisma generate && next build",
  "env": {
    "DATABASE_URL": "@database_url",
    "DIRECT_URL": "@direct_url",
    "API_KEY": "@api_key"
  }
}
```

### 5. Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify data loads correctly
- [ ] Check CustomGPT integration
- [ ] Monitor Supabase dashboard for queries
- [ ] Set up Supabase backups

## Connection Details

### Supabase Dashboard
- Project: https://supabase.com/dashboard/project/gibketmqaipryafwtjui
- Database: https://supabase.com/dashboard/project/gibketmqaipryafwtjui/editor
- API Settings: https://supabase.com/dashboard/project/gibketmqaipryafwtjui/settings/api

### Database URLs
- **Pooled (for Vercel)**: Uses connection pooling for serverless
- **Direct (for migrations)**: Direct connection for schema changes

### Monitoring
- Check query performance in Supabase dashboard
- Use Vercel Analytics for API performance
- Monitor database size and row counts

## Troubleshooting

### "Too many connections" error
- Ensure using pooled connection URL
- Add `?pgbouncer=true&connection_limit=1`

### "Authentication failed"
- Check password is correct
- Verify using correct user (postgres vs postgres.projectid)

### Slow queries
- Add indexes for frequently queried fields
- Use Supabase query performance insights
- Consider caching with Redis

## Security Best Practices

1. **Never commit .env files**
2. **Use Row Level Security (RLS)** in Supabase
3. **Rotate API keys regularly**
4. **Monitor for unusual queries**
5. **Set up alerts for high usage**