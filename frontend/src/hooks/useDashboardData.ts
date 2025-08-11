import { useState, useEffect, useCallback, useRef } from 'react';

export function useDashboardData(
  url: string,
  refreshInterval: number,
  options?: RequestInit
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const optionsRef = useRef<RequestInit | undefined>(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url, optionsRef.current);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdated, refresh: fetchData };
}

export default useDashboardData;

