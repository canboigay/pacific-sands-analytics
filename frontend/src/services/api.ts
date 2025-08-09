const API_BASE = '/api';
const API_KEY = 'ps_me2w0k3e_x81fsv0yz3k';

// Shared request helper with authorization and error handling
async function request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  try {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await fetch(`${API_BASE}${endpoint}${query}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || response.statusText);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('API request error', error);
    throw error;
  }
}

// --- Metrics ---
export interface MetricsRow {
  date: string;
  room_type: string;
  adr: number;
  revpar: number;
  occupancy: number;
  revenue: number;
}

export interface MetricsResponse {
  rows: MetricsRow[];
  meta: {
    trace_id: string;
    cached: boolean;
    source_tables: string[];
    timezone: string;
  };
}

export function getMetrics(params?: Record<string, any>): Promise<MetricsResponse> {
  return request<MetricsResponse>('/metrics', params);
}

// --- Forecasting ---
export interface ForecastDay {
  date: string;
  suggested_rate: number;
  confidence: number;
  factors: string[];
}

export interface ForecastResponse {
  room_type: string;
  forecast_period: string;
  current_rate: number;
  trend_analysis: {
    direction: string;
    strength: string;
    factor: number;
  };
  forecast: ForecastDay[];
  revenue_impact: {
    current_trajectory: number;
    optimized_trajectory: number;
    potential_uplift: number;
    uplift_percentage: number;
  };
  data_quality: {
    historical_records: number;
    occupancy_records: number;
    confidence_level: string;
  };
  recommendations: string[];
  timestamp: string;
}

export function getForecast(params?: Record<string, any>): Promise<ForecastResponse> {
  return request<ForecastResponse>('/forecasting', params);
}

// --- Analytics Insights ---
export interface AnalyticsRecommendation {
  title: string;
  description: string;
  impact: string;
  confidence: number;
}

export interface AnalyticsInsightsResponse {
  data_summary: {
    total_rate_records: number;
    total_occupancy_records: number;
    date_range: { from: string; to: string } | string;
    room_type_filter: string;
  };
  pricing_insights: {
    average_rate: number;
    min_rate: number;
    max_rate: number;
    rate_trend: string;
    seasonal_patterns: { period: string; avg_rate: number; occupancy: number }[];
    data_points: number;
  };
  occupancy_insights: {
    average_occupancy: number;
    peak_periods: string[];
    low_periods: string[];
  };
  recommendations: AnalyticsRecommendation[];
  recent_data: {
    latest_rates: any[];
    latest_occupancy: any[];
  };
  timestamp: string;
}

export function getInsights(params?: Record<string, any>): Promise<AnalyticsInsightsResponse> {
  return request<AnalyticsInsightsResponse>('/analytics', { endpoint: 'insights', ...params });
}

export { request };
