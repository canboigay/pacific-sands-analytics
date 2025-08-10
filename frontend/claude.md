# Frontend - Next.js Application

## Overview
Main web application for Pacific Sands Analytics, built with Next.js 14 using App Router.

## Directory Structure
- app/ - App Router pages and API routes
- components/ - Reusable React components  
- prisma/ - Database schema and client
- lib/ - Utility functions and services

## API Routes Pattern
All routes require Bearer token authentication.
Standard response format: JSON with error handling.

## Key Patterns
- Server Components for data fetching
- Tailwind CSS for styling
- Prisma for all database queries
- TypeScript for type safety

## Common Commands
npm run dev - Start development server
npx prisma studio - Open database GUI
npx prisma db push - Sync schema with database
npm run build - Build for production

## Known Issues
- Mixed App/Pages Router (migrate to App Router only)
- No caching layer yet (implement Redis)
- Multiple server.js files need consolidation
