'use client';

import { useState, useEffect } from 'react';

type Priority = 'CRITICAL' | 'HIGH' | 'OPPORTUNITY' | 'MEDIUM';
type AlertType = 'OCCUPANCY' | 'REVENUE' | 'COMPRESSION' | 'PARITY' | 'SEASONAL';

interface Alert {
  priority: Priority;
  type: AlertType;
  title: string;
  message: string;
  action: string;
  timestamp: Date;
}

interface Suggestion {
  type: AlertType;
  title: string;
  suggestion: string;
  tactics?: string[];
}

interface Metrics {
  occupancy: number;
  averageRate: number;
  pickupADR: number;
  revpar: number;
  parityDelta: number;
}

export default function RMSAlertsAndSuggestions() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Metrics>({
    occupancy: 0.75,
    averageRate: 285,
    pickupADR: 320,
    revpar: 213.75,
    parityDelta: 0.01,
  });

  useEffect(() => {
    checkForAlerts();
    const interval = setInterval(checkForAlerts, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkForAlerts = () => {
    // Simulate real metrics (replace with actual API call)
    const metrics: Metrics = {
      occupancy: 0.68 + Math.random() * 0.25,
      averageRate: 275 + Math.random() * 50,
      pickupADR: 300 + Math.random() * 100,
      revpar: 0,
      parityDelta: (Math.random() - 0.5) * 0.04,
    };
    metrics.revpar = metrics.occupancy * metrics.averageRate;

    setCurrentMetrics(metrics);

    const newAlerts: Alert[] = [];
    const newSuggestions: Suggestion[] = [];
    const daysOut = 25; // Example - would be calculated from actual dates

    // Check occupancy thresholds
    if (daysOut > 30 && metrics.occupancy < 0.7) {
      newAlerts.push({
        priority: 'HIGH',
        type: 'OCCUPANCY',
        title: 'Low Occupancy Alert (90-31 days)',
        message: `Current: ${(metrics.occupancy * 100).toFixed(1)}% | Target: 70%`,
        action: 'Apply -5% to -10% discount on 2BR+ units',
        timestamp: new Date(),
      });
    } else if (daysOut <= 30 && daysOut > 7 && metrics.occupancy < 0.65) {
      newAlerts.push({
        priority: 'CRITICAL',
        type: 'OCCUPANCY',
        title: 'Critical Occupancy (30-8 days)',
        message: `Current: ${(metrics.occupancy * 100).toFixed(1)}% | Target: 65%`,
        action: 'Widen discount to -10% to -15% + LOS promos',
        timestamp: new Date(),
      });
    } else if (daysOut <= 7 && metrics.occupancy < 0.6) {
      newAlerts.push({
        priority: 'CRITICAL',
        type: 'OCCUPANCY',
        title: 'Occupancy Crisis (≤7 days)',
        message: `Current: ${(metrics.occupancy * 100).toFixed(1)}% | Target: 60%`,
        action: 'Launch 48hr micro-promo -8% to -12%',
        timestamp: new Date(),
      });
    }

    // Check ADR opportunities
    if (metrics.pickupADR > metrics.averageRate + 100) {
      newAlerts.push({
        priority: 'OPPORTUNITY',
        type: 'REVENUE',
        title: 'Strong Pickup ADR',
        message: `Pickup: $${metrics.pickupADR.toFixed(0)} | Base: $${metrics.averageRate.toFixed(0)}`,
        action: 'FREEZE discounts - Allow premium persistence',
        timestamp: new Date(),
      });
    }

    // Compression detection
    if (metrics.occupancy >= 0.9) {
      newAlerts.push({
        priority: 'OPPORTUNITY',
        type: 'COMPRESSION',
        title: 'High Compression',
        message: `Occupancy: ${(metrics.occupancy * 100).toFixed(1)}%`,
        action: 'Rate HOLD or increase +3-6%',
        timestamp: new Date(),
      });
    }

    // Seasonal suggestions
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();

    if (month === 7 && day < 20) {
      newSuggestions.push({
        type: 'SEASONAL',
        title: 'July Softness Active',
        suggestion: 'Apply -15% to -20% on 2BR+ units',
        tactics: [
          'Relax minimum stay by 1 night',
          'Launch midweek LOS promos',
          'Protect top 2 performers',
        ],
      });
    }

    if (month === 9 || month === 10) {
      newSuggestions.push({
        type: 'SEASONAL',
        title: 'Peak Season Window',
        suggestion: 'Optimize for revenue',
        tactics: [
          'Narrow discount bands',
          'Let premium hold on best sellers',
          'Use micro-bands vs blanket cuts',
        ],
      });
    }

    setAlerts(newAlerts);
    setSuggestions(newSuggestions);
  };

  const priorityColors: Record<Priority, string> = {
    CRITICAL: '#dc3545',
    HIGH: '#ff6b35',
    OPPORTUNITY: '#28a745',
    MEDIUM: '#ffc107',
  };

  const typeIcons: Record<AlertType, string> = {
    OCCUPANCY: '🏨',
    REVENUE: '💰',
    COMPRESSION: '📈',
    PARITY: '⚖️',
    SEASONAL: '📅',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            marginBottom: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              margin: 0,
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            🚨 RMS Priority Alerts Dashboard
          </h1>
          <p style={{ color: '#666', marginTop: '10px', fontSize: '1.1rem' }}>
            Real-time alerts based on Master Reference v1.3
          </p>
        </div>

        {/* Main Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
            gap: '25px',
            marginBottom: '25px',
          }}
        >
          {/* Alerts Panel */}
          <div
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                color: '#333',
              }}
            >
              🚨 Active Alerts ({alerts.length})
            </h2>

            {alerts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px',
                  background: '#f0f9ff',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '3rem' }}>✅</div>
                <p
                  style={{
                    marginTop: '15px',
                    color: '#666',
                    fontSize: '1.1rem',
                  }}
                >
                  All metrics within optimal range
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: `2px solid ${priorityColors[alert.priority]}`,
                      borderRadius: '12px',
                      padding: '18px',
                      background: `${priorityColors[alert.priority]}15`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.8rem' }}>{typeIcons[alert.type]}</span>
                        <div>
                          <div
                            style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#333' }}
                          >
                            {alert.title}
                          </div>
                          <div style={{ color: '#666', marginTop: '4px' }}>{alert.message}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '6px 14px',
                          background: priorityColors[alert.priority],
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {alert.priority}
                      </span>
                    </div>

                    <div
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '14px',
                        marginTop: '12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: priorityColors[alert.priority],
                          marginBottom: '6px',
                        }}
                      >
                        ⚡ ACTION REQUIRED:
                      </div>
                      <div style={{ fontWeight: '500', color: '#333' }}>{alert.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions Panel */}
          <div
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                color: '#333',
              }}
            >
              💡 Suggestions ({suggestions.length})
            </h2>

            {suggestions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px',
                  background: '#f0f9ff',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '3rem' }}>📊</div>
                <p
                  style={{
                    marginTop: '15px',
                    color: '#666',
                    fontSize: '1.1rem',
                  }}
                >
                  No specific suggestions at this time
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      padding: '18px',
                      border: '1px solid #dee2e6',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{typeIcons[suggestion.type]}</span>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                        {suggestion.title}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#e7f3ff',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <strong>Recommendation:</strong> {suggestion.suggestion}
                    </div>

                    {suggestion.tactics && (
                      <div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: '#666',
                          }}
                        >
                          Tactics:
                        </div>
                        <ul style={{ margin: '0 0 0 20px', color: '#666' }}>
                          {suggestion.tactics.map((tactic, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>
                              {tactic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        <div
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginBottom: '20px', color: '#333' }}>📊 Current Metrics</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                label: 'Occupancy',
                value: `${(currentMetrics.occupancy * 100).toFixed(1)}%`,
                target: '85-90%',
              },
              {
                label: 'ADR',
                value: `$${currentMetrics.averageRate.toFixed(0)}`,
                target: '+1-3% YoY',
              },
              {
                label: 'RevPAR',
                value: `$${currentMetrics.revpar.toFixed(0)}`,
                target: 'Maximize',
              },
              {
                label: 'Pickup ADR',
                value: `$${currentMetrics.pickupADR.toFixed(0)}`,
                target: '+$100-150',
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                  {metric.label}
                </div>
                <div
                  style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3c72' }}
                >
                  {metric.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px' }}>
                  Target: {metric.target}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a
            href='/'
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              display: 'inline-block',
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

