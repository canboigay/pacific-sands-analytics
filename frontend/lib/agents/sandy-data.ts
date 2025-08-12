// Sandy Data Integration
// This module allows the multi-agent system to access Sandy's production data

const SANDY_API_URL = 'https://data-upload-tools-drrtek24q-pacific-sands.vercel.app/api';
const API_KEY = 'Bearer ps_me2w0k3e_x81fsv0yz3k';

export interface SandyData {
  rates: any[];
  occupancy: any[];
  insights: any[];
  totalRecords: number;
}

export async function fetchSandyData(): Promise<SandyData> {
  try {
    // Get health check for record counts
    const healthResponse = await fetch(`${SANDY_API_URL}/health`, {
      headers: { 'Authorization': API_KEY }
    });
    const health = await healthResponse.json();

    // Get analytics data
    const analyticsResponse = await fetch(`${SANDY_API_URL}/analytics?endpoint=insights&bypass=custom_gpt_integration`, {
      headers: { 'Authorization': API_KEY }
    });
    const analytics = await analyticsResponse.json();

    // Get stored insights
    const insightsResponse = await fetch(`${SANDY_API_URL}/knowledge?action=retrieve&bypass=custom_gpt_integration`, {
      headers: { 'Authorization': API_KEY }
    });
    const insights = await insightsResponse.json();

    return {
      rates: analytics.recent_data?.latest_rates || [],
      occupancy: analytics.recent_data?.latest_occupancy || [],
      insights: insights.insights || [],
      totalRecords: health.records?.total || 0
    };
  } catch (error) {
    console.error('Failed to fetch Sandy data:', error);
    return {
      rates: [],
      occupancy: [],
      insights: [],
      totalRecords: 0
    };
  }
}

export async function getLatestInsights(limit: number = 5): Promise<any[]> {
  try {
    const response = await fetch(`${SANDY_API_URL}/knowledge?action=retrieve&limit=${limit}&bypass=custom_gpt_integration`, {
      headers: { 'Authorization': API_KEY }
    });
    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    return [];
  }
}

export async function getRateForecasting(roomType?: string, days: number = 30): Promise<any> {
  try {
    const params = new URLSearchParams({
      bypass: 'custom_gpt_integration',
      forecast_days: days.toString()
    });
    if (roomType) params.append('room_type', roomType);

    const response = await fetch(`${SANDY_API_URL}/forecasting?${params}`, {
      headers: { 'Authorization': API_KEY }
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch forecast:', error);
    return null;
  }
}