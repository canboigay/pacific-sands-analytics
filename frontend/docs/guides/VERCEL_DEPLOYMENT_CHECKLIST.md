# Vercel Deployment Checklist for Sandy API

## Issue
API routes returning 404 on Vercel even though they exist locally and build successfully.

## Possible Causes & Solutions

### 1. Environment Variables
Make sure these are set in Vercel:
```
DATABASE_URL=<your-database-url>
DIRECT_URL=<your-direct-database-url>  
```

### 2. API Route Structure
- ✅ Routes are in `app/api/` directory
- ✅ Each route has a `route.ts` file
- ✅ Routes export named functions (GET, POST, etc.)

### 3. Build Command
Current: `prisma generate && next build`
- ✅ This should work correctly

### 4. Vercel Configuration
Check `vercel.json`:
- ✅ Has proper function configuration
- ✅ CORS headers configured

### 5. Manual Steps to Fix

1. **Check Vercel Dashboard**
   - Go to your project settings
   - Verify environment variables are set
   - Check build logs for errors

2. **Force Redeploy**
   ```bash
   vercel --prod --force
   ```

3. **Clear Build Cache**
   - In Vercel dashboard: Settings → Advanced → Clear Build Cache
   - Then redeploy

4. **Check Deployment URL**
   - Make sure you're using the correct deployment URL
   - Sometimes Vercel creates new deployment URLs

### 6. Test Commands
```bash
# Test root API
curl https://frontend-zeta-drab-88.vercel.app/api

# Test health endpoint  
curl https://frontend-zeta-drab-88.vercel.app/api/health

# Test with Sandy's parameters
curl "https://frontend-zeta-drab-88.vercel.app/api/analytics?endpoint=insights&bypass=custom_gpt_integration"
```

### 7. Alternative: Use Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy directly
vercel --prod
```

This will ensure latest code is deployed with proper configuration.