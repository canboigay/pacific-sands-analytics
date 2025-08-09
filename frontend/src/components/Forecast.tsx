import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type RatePoint = { date: string; rate: number };
type Suggestion = { date: string; suggestedRate: number; confidence: number; uplift: number };
interface ForecastResponse {
  historical: RatePoint[];
  forecast: RatePoint[];
  suggestions: Suggestion[];
}

const Forecast: React.FC = () => {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/forecasting')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div>Error loading forecast: {error}</div>;
  }

  if (!data) {
    return <div>Loading forecast...</div>;
  }

  const chartMap = new Map<string, { date: string; historical?: number; forecast?: number }>();
  data.historical.forEach((p) => {
    chartMap.set(p.date, { date: p.date, historical: p.rate });
  });
  data.forecast.forEach((p) => {
    const entry = chartMap.get(p.date) || { date: p.date };
    entry.forecast = p.rate;
    chartMap.set(p.date, entry);
  });
  const chartData = Array.from(chartMap.values());

  return (
    <div>
      <h2>Rate Forecast</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="historical" stroke="#8884d8" name="Historical Rate" />
          <Line type="monotone" dataKey="forecast" stroke="#82ca9d" name="Forecast Rate" />
        </LineChart>
      </ResponsiveContainer>

      <h3>Suggested Rates</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Suggested Rate</th>
            <th>Confidence</th>
            <th>Potential Revenue Uplift</th>
          </tr>
        </thead>
        <tbody>
          {data.suggestions.map((s) => (
            <tr key={s.date}>
              <td>{s.date}</td>
              <td>{s.suggestedRate}</td>
              <td>{(s.confidence * 100).toFixed(1)}%</td>
              <td>{s.uplift}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Forecast;
