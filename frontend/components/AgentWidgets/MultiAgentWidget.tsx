'use client';
import { useState } from 'react';

const AGENTS = [
  { id: 'pricing', name: 'Pricing', icon: '💰', color: '#10b981' },
  { id: 'revenue', name: 'Revenue', icon: '📈', color: '#3b82f6' },
  { id: 'guest', name: 'Guest', icon: '🌟', color: '#f59e0b' },
  { id: 'marketing', name: 'Marketing', icon: '📱', color: '#8b5cf6' },
  { id: 'operations', name: 'Operations', icon: '🔧', color: '#ef4444' },
  { id: 'analytics', name: 'Analytics', icon: '📊', color: '#06b6d4' }
];

export function MultiAgentWidget() {
  const [query, setQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const askAgent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ps_me2w0k3e_x81fsv0yz3k'
        },
        body: JSON.stringify({
          query,
          agent: selectedAgent,
          context: {}
        })
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Agent error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>🤖</div>
        <div>
          <h3 style={{ 
            margin: 0, 
            color: '#0f172a',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            Multi-Agent Intelligence
          </h3>
          <p style={{ 
            color: '#64748b', 
            margin: '4px 0 0 0',
            fontSize: '0.875rem'
          }}>
            Ask specialized AI agents for insights
          </p>
        </div>
      </div>

      {/* Agent Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
          Select Agent
        </label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedAgent('auto')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: selectedAgent === 'auto' ? '#4f46e5' : '#f3f4f6',
              color: selectedAgent === 'auto' ? 'white' : '#374151',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            🎯 Auto-detect
          </button>
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: selectedAgent === agent.id ? agent.color : '#f3f4f6',
                color: selectedAgent === agent.id ? 'white' : '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {agent.icon} {agent.name}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything... e.g., 'What should our room rates be this weekend?' or 'How can we improve revenue?'"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={askAgent}
        disabled={!query || loading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          background: loading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Thinking...' : 'Ask Agent'}
      </button>

      {/* Response Display */}
      {response && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          {response.success ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>
                  {AGENTS.find(a => a.id === response.agent)?.icon || '🤖'}
                </span>
                <h4 style={{ margin: 0, color: '#0f172a' }}>
                  {AGENTS.find(a => a.id === response.agent)?.name || 'Agent'} Response
                </h4>
                <span style={{
                  marginLeft: 'auto',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  background: response.result.confidence > 0.8 ? '#d1fae5' : '#fef3c7',
                  color: response.result.confidence > 0.8 ? '#065f46' : '#92400e'
                }}>
                  {(response.result.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              <p style={{ color: '#374151', marginBottom: '16px' }}>
                {response.result.recommendation}
              </p>

              {response.result.insights && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.875rem' }}>
                    Insights:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '0.875rem' }}>
                    {response.result.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {response.result.actions && (
                <div>
                  <h5 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.875rem' }}>
                    Recommended Actions:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '0.875rem' }}>
                    {response.result.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                Analyzed {response.result.dataPoints} data points • {new Date(response.result.timestamp).toLocaleString()}
              </div>
            </>
          ) : (
            <p style={{ color: '#ef4444' }}>
              Error: {response.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
