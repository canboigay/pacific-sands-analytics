import React, { useEffect, useState } from 'react';

interface Suggestion {
  recommendation: string;
  rationale: string;
  quickWin?: boolean;
}

const Suggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/analytics?endpoint=insights');
        if (!res.ok) {
          throw new Error('Failed to fetch insights');
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else if (Array.isArray(data?.recommendations)) {
          setSuggestions(data.recommendations);
        } else if (Array.isArray(data?.insights?.recommendations)) {
          setSuggestions(data.insights.recommendations);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div>Loading suggestions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (suggestions.length === 0) {
    return <div>No recommendations available.</div>;
  }

  return (
    <div className="suggestions">
      <h2>Recommendations</h2>
      <ul>
        {suggestions.map((s, idx) => (
          <li key={idx} className={s.quickWin ? 'quick-win' : ''}>
            <div className="recommendation">
              <strong>{s.recommendation}</strong>
              {s.quickWin && <span className="badge">Quick Win</span>}
            </div>
            <p className="rationale">{s.rationale}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Suggestions;
