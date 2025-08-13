import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Root API endpoint for Sandy
  return NextResponse.json({
    message: "Pacific Sands Analytics API",
    version: "3.1.1",
    status: "operational",
    database: "connected",
    custom_gpt_ready: true,
    endpoints: {
      "/api": "API information and status",
      "/api/analytics": "Business analytics and insights",
      "/api/forecasting": "AI-powered rate forecasting", 
      "/api/knowledge": "Store and retrieve insights",
      "/api/health": "System health check"
    },
    authentication: "No authentication required for Custom GPT",
    timestamp: new Date().toISOString()
  });
}