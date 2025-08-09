import React, { useEffect, useState } from 'react';

interface FiltersState {
  dateFrom: string;
  dateTo: string;
  roomType: string;
  channel: string;
}

const defaultState = (): FiltersState => {
  const today = new Date().toISOString().split('T')[0];
  return {
    dateFrom: today,
    dateTo: today,
    roomType: '',
    channel: '',
  };
};

const ROOM_TYPES = ['Queen Suite', 'King Suite', 'Cottage'];
const CHANNELS = ['Website', 'OTA', 'Phone'];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

interface FiltersProps {
  onData?: (metrics: any, forecast: any) => void;
}

export default function Filters({ onData }: FiltersProps) {
  const [filters, setFilters] = useState<FiltersState>(() => defaultState());
  const [initialized, setInitialized] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);

  // Initialize from query string or local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const stored = localStorage.getItem('ps-filters');
      const storedObj = stored ? JSON.parse(stored) : {};
      const init = defaultState();
      const data: FiltersState = {
        dateFrom: params.get('date_from') || storedObj.dateFrom || init.dateFrom,
        dateTo: params.get('date_to') || storedObj.dateTo || init.dateTo,
        roomType: params.get('room_type') || storedObj.roomType || init.roomType,
        channel: params.get('channel') || storedObj.channel || init.channel,
      };
      setFilters(data);
    } catch {
      // ignore parsing errors
    }
    setInitialized(true);
  }, []);

  // Persist selections
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    if (filters.roomType) params.set('room_type', filters.roomType);
    if (filters.channel) params.set('channel', filters.channel);
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', url);
    localStorage.setItem('ps-filters', JSON.stringify(filters));
  }, [filters, initialized]);

  // Re-fetch when filters change
  useEffect(() => {
    if (!initialized) return;
    fetchData();
  }, [filters, initialized]);

  async function fetchData() {
    const headers: HeadersInit = API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
    const metricParams = new URLSearchParams({
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      filters: JSON.stringify({ room_type: filters.roomType, channel: filters.channel }),
    });
    try {
      const [metricsRes, forecastRes] = await Promise.all([
        fetch(`${API_BASE}/api/metrics?${metricParams.toString()}`, { headers }),
        fetch(
          `${API_BASE}/api/forecasting?${new URLSearchParams({ room_type: filters.roomType }).toString()}`,
          { headers }
        ),
      ]);
      const metricsJson = await metricsRes.json();
      const forecastJson = await forecastRes.json();
      setMetrics(metricsJson);
      setForecast(forecastJson);
      onData?.(metricsJson, forecastJson);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  }

  return (
    <aside className="filters">
      <h2>Filters</h2>
      <div>
        <label>
          From:
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          To:
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Room Type:
          <select
            value={filters.roomType}
            onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
          >
            <option value="">All</option>
            {ROOM_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Channel:
          <select
            value={filters.channel}
            onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          >
            <option value="">All</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}

