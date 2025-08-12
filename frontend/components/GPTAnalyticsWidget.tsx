'use client';
import { useState, useEffect } from 'react';

interface GPTSummaryData {
  totals: {
    totalQueries: number;
    totalResponses: number;
    totalInsights: number;
    dataPointsAnalyzed: number;
  };
  dailySummaries: any[];
  recentInsights: any[];
}

export function GPTAnalyticsWidget() {
  const [data, setData] = useState<GPTSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'insights' | 'interactions'>('overview');
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    fetchGPTData();
    const interval = setInterval(fetchGPTData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchGPTData = async () => {
    try {
      const response = await fetch(`/api/gpt-tracking?view=summary&days=${timeRange}`, {
        headers: {
          'Authorization': 'Bearer ps_me2w0k3e_x81fsv0yz3k'
        }
      });
      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch GPT analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          Loading GPT Analytics...
        </div>
      </div>
    );
  }

  const avgQueriesPerDay = data ? Math.round(data.totals.totalQueries / timeRange) : 0;
  const insightImplementationRate = data ? 
    (data.recentInsights.filter(i => i.implemented).length / data.recentInsights.length * 100) : 0;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
              Sandy AI Analytics
            </h3>
            <p style={{ 
              color: '#64748b', 
              margin: '4px 0 0 0',
              fontSize: '0.875rem'
            }}>
              CustomGPT Usage & Insights
            </p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
            backgroundColor: 'white'
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* View Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '12px'
      }}>
        {['overview', 'insights', 'interactions'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: view === v ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
              color: view === v ? 'white' : '#64748b',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Content based on view */}
      {view === 'overview' && (
        <>
          {/* Key Metrics Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#f0f9ff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0369a1' }}>
                {data?.totals.totalQueries || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                Total Queries
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                ~{avgQueriesPerDay}/day
              </div>
            </div>

            <div style={{
              background: '#f0fdf4',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
                {data?.totals.totalInsights || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                Insights Generated
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                {insightImplementationRate.toFixed(0)}% implemented
              </div>
            </div>

            <div style={{
              background: '#fef3f2',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>
                {data?.totals.dataPointsAnalyzed || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                Data Points
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Analyzed
              </div>
            </div>
          </div>

          {/* Qualitative Insights Section */}
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '1rem' }}>
              Recent AI-Generated Insights
            </h4>
            {data?.recentInsights.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                No insights generated yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data?.recentInsights.slice(0, 5).map((insight: any) => (
                  <div key={insight.id} style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: insight.priority === 'high' ? '#fee2e2' : 
                                         insight.priority === 'medium' ? '#fef3c7' : '#ecfdf5',
                          color: insight.priority === 'high' ? '#dc2626' : 
                                insight.priority === 'medium' ? '#d97706' : '#059669'
                        }}>
                          {insight.priority}
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#0f172a'
                        }}>
                          {insight.title}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        marginTop: '4px'
                      }}>
                        {insight.type} • {new Date(insight.generatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {insight.implemented && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#d1fae5',
                        color: '#065f46'
                      }}>
                        ✓ Implemented
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Trend */}
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '1rem' }}>
              Usage Pattern (Last {timeRange} Days)
            </h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100px' }}>
              {data?.dailySummaries.slice(0, 7).reverse().map((day: any, index: number) => {
                const height = day.totalQueries > 0 ? 
                  (day.totalQueries / Math.max(...data.dailySummaries.map(d => d.totalQueries))) * 80 + 20 : 10;
                return (
                  <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      height: `${height}px`,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderRadius: '4px 4px 0 0',
                      marginBottom: '4px'
                    }}></div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === 'insights' && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.recentInsights.map((insight: any) => (
              <div key={insight.id} style={{
                background: '#f8fafc',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h5 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>
                    {insight.title}
                  </h5>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: insight.type === 'recommendation' ? '#e0e7ff' : 
                                   insight.type === 'trend' ? '#fef3c7' : '#dcfce7',
                    color: insight.type === 'recommendation' ? '#4338ca' : 
                          insight.type === 'trend' ? '#d97706' : '#166534'
                  }}>
                    {insight.type}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '8px 0' }}>
                  Generated on {new Date(insight.generatedAt).toLocaleString()}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: '#f1f5f9',
                    color: '#475569'
                  }}>
                    Priority: {insight.priority}
                  </span>
                  {insight.implemented && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      backgroundColor: '#d1fae5',
                      color: '#065f46'
                    }}>
                      ✓ Implemented
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'interactions' && (
        <div style={{ 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '12px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <p>Detailed interaction logs coming soon...</p>
        </div>
      )}
    </div>
  );
}