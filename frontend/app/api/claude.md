# API Routes Documentation

## Authentication
All requests require: Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k

## Base URLs
- Development: http://localhost:3000/api
- Production: https://pacific-sands-analytics.vercel.app/api

## Key Endpoints

### Data Management
GET /api/data?type=[occupancy|pace|rateshop]
- Query parameters: startDate, endDate, groupBy, roomType

### Analytics
GET /api/analytics/insights - Business insights
GET /api/analytics/competitors - Competitor analysis

### GPT Integration  
GET /api/gpt/dashboard - Comprehensive dashboard data
POST /api/gpt/analyze - Analyze specific metrics

### Housekeeping
GET /api/housekeeping/tasks - Current tasks
PATCH /api/housekeeping/tasks/:id - Update task status

## Error Handling
Consistent error format with code, message, and details.

## Rate Limiting
100 requests/minute, 1000 requests/hour per API key.
