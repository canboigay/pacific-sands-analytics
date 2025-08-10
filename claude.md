# Pacific Sands Analytics

## Project Overview
This is a comprehensive hotel analytics and business intelligence system for Pacific Sands Resort in Tofino, BC. The system provides real-time analytics, competitor analysis, occupancy forecasting, and automated reporting for hotel management.

## Key Business Context
- **Property**: Pacific Sands Beach Resort, Tofino, BC
- **Rooms**: ~150 units
- **Key Users**: Marianne Boom (Assistant General Manager), Grady (Owner), Sandy (Operations)
- **Primary Use Cases**: Daily housekeeping reports, occupancy analysis, rate shopping, revenue forecasting

## Architecture
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Integration**: CustomGPT via OpenAPI schema

## Database Schema
Core Tables: PaceReport, OccupancyData, RateShop, DataImport, MonthlyMetrics

## API Authentication
Bearer token: ps_me2w0k3e_x81fsv0yz3k

## Key API Endpoints
- GET /api/data - Query occupancy, pace, or rateshop data
- GET /api/gpt/dashboard - Comprehensive dashboard for GPT
- GET /api/analytics/insights - Business insights
- GET /api/housekeeping/tasks - Daily housekeeping tasks

## Current Priorities
1. Complete CSV to database migration (137 files to PostgreSQL)
2. Implement MCP server for better GPT integration
3. Set up automated daily reports for Marianne
4. Fix mixed routing (consolidate to App Router only)
