import React, { useState, useEffect } from 'react';

export default function RMSAlertsAndSuggestions() {
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  // Master Reference Rules (from your document)
  const masterRules = {
    occupancyTriggers: {
      '90_31_days': { threshold: 0.70, action: 'Apply -5% to -10% on 2BR+ units' },
      '30_8_days': { threshold: 0.65, action: 'Widen discount to -10% to -15%' },
      '7_0_days': { threshold: 0.60, action: 'Launch micro-promo -8% to -12%' }
    },
    pickupADRTrigger: 100, // $100+ above base triggers premium hold
    compressionThreshold: 0.90,
    weakPeriods: ['early_july', 'aug_9', 'nov_20'],
    strongPeriods: ['september', 'october']
  };

  useEffect(() => {
    checkForAlerts();
    const interval = setInterval(checkForAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkForAlerts = async () => {
    try {
      // Fetch current metrics
      const response = await fetch('/api/real-data');
      const data = await response.json();
      
      const metrics = data.metrics || {};
      setCurrentMetrics(metrics);
      
      // Generate alerts based on master rules
      const newAlerts = [];
      const newSuggestions = [];
      
      // OCCUPANCY ALERTS
      const occupancy = metrics.occupancy || 0.75;
      const daysOut = 30; // This would come from your date logic
      
      if (daysOut > 30 && occupancy < 0.70) {
        newAlerts.push({
          priority: 'HIGH',
          type: 'OCCUPANCY',
          title: 'Low Occupancy Alert (90-31 days out)',
          message: `Current: ${(occupancy * 100).toFixed(1)}% | Target: 70%`,
          action: 'IMMEDIATE: Apply -5% to -10% discount on 2BR+ units',
          timestamp: new Date()
        });
      }
      
      if (daysOut <= 30 && daysOut > 7 && occupancy < 0.65) {
        newAlerts.push({
          priority: 'CRITICAL',
          type: 'OCCUPANCY',
          title: 'Critical Occupancy Alert (30-8 days out)',
          message: `Current: ${(occupancy * 100).toFixed(1)}% | Target: 65%`,
          action: 'URGENT: Widen discount to -10% to -15% + LOS promos',
          timestamp: new Date()
        });
      }
      
      if (daysOut <= 7 && occupancy < 0.60) {
        newAlerts.push({
          priority: 'CRITICAL',
          type: 'OCCUPANCY',
          title: 'Same-Day Occupancy Crisis',
          message: `Current: ${(occupancy * 100).toFixed(1)}% | Target: 60%`,
          action: 'NOW: Launch 48hr micro-promo -8% to -12%',
          timestamp: new Date()
        });
      }
      
      // PICKUP ADR ALERTS
      const pickupADR = metrics.pickupADR || 285;
      const baseADR = metrics.averageRate || 250;
      
      if (pickupADR > baseADR + masterRules.pickupADRTrigger) {
        newAlerts.push({
          priority: 'OPPORTUNITY',
          type: 'REVENUE',
          title: 'Strong Pickup ADR - Premium Opportunity',
          message: `Pickup: $${pickupADR.toFixed(2)} | Base: $${baseADR.toFixed(2)}`,
          action: 'FREEZE all discounts! Allow premium persistence',
          timestamp: new Date()
        });
      }
      
      // COMPRESSION ALERTS
      if (occupancy >= masterRules.compressionThreshold) {
        newAlerts.push({
          priority: 'OPPORTUNITY',
          type: 'COMPRESSION',
          title: 'High Compression Detected',
          message: `Occupancy: ${(occupancy * 100).toFixed(1)}%`,
          action: 'RATE HOLD or increase +3-6% immediately',
          timestamp: new Date()
        });
      }
      
      // SEASONAL SUGGESTIONS
      const currentMonth = new Date().getMonth() + 1;
      const currentDate = new Date().getDate();
      
      // July softness check
      if (currentMonth === 7 && currentDate < 20) {
        newSuggestions.push({
          type: 'SEASONAL',
          title: 'July Softness Period Active',
          suggestion: 'Activate -15% to -20% on 2BR+ units',
          tactics: [
            'Relax minimum stay by 1 night',
            'Launch LOS promos for midweek',
            'Protect top 2 performers with lighter trims'
          ]
        });
      }
      
      // Sept/Oct strength
      if (currentMonth === 9 || currentMonth === 10) {
        newSuggestions.push({
          type: 'SEASONAL',
          title: 'Peak Season Optimization Window',
          suggestion: 'Maintain occupancy, blend ADR carefully',
          tactics: [
            'Narrow discount bands',
            'Let premium hold on best sellers',
            'Avoid blanket cuts - use micro-bands',
            'Monitor pickup ADR for opportunities'
          ]
        });
      }
      
      // PARITY ALERTS
      const parityDelta = metrics.parityDelta || 0;
      if (Math.abs(parityDelta) > 0.02) {
        newAlerts.push({
          priority: 'MEDIUM',
          type: 'PARITY',
          title: 'Rate Parity Violation',
          message: `Delta: ${(parityDelta * 100).toFixed(1)}% from brand site`,
          action: 'Correct OTA rates within 2% immediately',
          timestamp: new Date()
        });
      }
      
      setAlerts(newAlerts);
      setSuggestions(newSuggestions);
      setLoading(false);
      
    } catch (error) {
      console.error('Error checking alerts:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#ff6b35';
      case 'OPPORTUNITY': return '#28a745';
      case 'MEDIUM': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'OCCUPANCY': return '🏨';
      case 'REVENUE': return '💰';
      case 'COMPRESSION': return '📈';
      case 'PARITY': return '⚖️';
      case 'SEASONAL': return '📅';
      default: return '📊';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: 0,
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚨 RMS Priority Alerts & Suggestions
          </h1>
          <p style={{ color: '#666', marginTop: '10px' }}>
            Real-time alerts based on Master Reference v1.3 rules
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          {/* Priority Alerts Section */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              Priority Alerts ({alerts.length})
            </h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" />
                <p>Checking for alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#f0f9ff',
                borderRadius: '10px'
              }}>
                <span style={{ fontSize: '3rem' }}>✅</span>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  All metrics within optimal range
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {alerts.map((alert, idx) => (
                  <AlertCard key={idx} alert={alert} />
                ))}
              </div>
            )}
          </div>

          {/* Suggestions Section */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              Active Suggestions ({suggestions.length})
            </h2>
            
            {suggestions.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#f0f9ff',
                borderRadius: '10px'
              }}>
                <span style={{ fontSize: '3rem' }}>📊</span>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  No specific suggestions at this time
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {suggestions.map((suggestion, idx) => (
                  <SuggestionCard key={idx} suggestion={suggestion} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Metrics Summary */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginTop: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <h3>Current Metrics Snapshot</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <MetricCard
              label="Occupancy"
              value={`${((currentMetrics.occupancy || 0) * 100).toFixed(1)}%`}
              target="85-90%"
            />
            <MetricCard
              label="ADR"
              value={`$${(currentMetrics.averageRate || 0).toFixed(2)}`}
              target="+1-3% YoY"
            />
            <MetricCard
              label="RevPAR"
              value={`$${(currentMetrics.revpar || 0).toFixed(2)}`}
              target="Maximize"
            />
            <MetricCard
              label="Pickup ADR"
              value={`$${(currentMetrics.pickupADR || 0).toFixed(2)}`}
              target="+$100-150"
            />
          </div>
        </div>

        <style jsx>{`
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #1e3c72;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  const priorityColor = {
    'CRITICAL': '#dc3545',
    'HIGH': '#ff6b35',
    'OPPORTUNITY': '#28a745',
    'MEDIUM': '#ffc107'
  }[alert.priority] || '#6c757d';
  
  const typeIcon = {
    'OCCUPANCY': '🏨',
    'REVENUE': '💰',
    'COMPRESSION': '📈',
    'PARITY': '⚖️'
  }[alert.type] || '📊';

  return (
    <div style={{
      border: `2px solid ${priorityColor}`,
      borderRadius: '10px',
      padding: '15px',
      background: `${priorityColor}15`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>{typeIcon}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {alert.title}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '2px' }}>
              {alert.message}
            </div>
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          background: priorityColor,
          color: 'white',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {alert.priority}
        </span>
      </div>
      
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '12px',
        marginTop: '10px'
      }}>
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: 'bold',
          color: priorityColor,
          marginBottom: '5px'
        }}>
          ⚡ ACTION REQUIRED:
        </div>
        <div style={{ fontWeight: '500' }}>
          {alert.action}
        </div>
      </div>
      
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#999', 
        marginTop: '10px',
        textAlign: 'right'
      }}>
        {new Date(alert.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }) {
  const typeIcon = {
    'SEASONAL': '📅',
    'TACTICAL': '🎯',
    'STRATEGIC': '🔮'
  }[suggestion.type] || '💡';

  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '10px',
      padding: '15px',
      border: '1px solid #dee2e6'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.3rem' }}>{typeIcon}</span>
        <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
          {suggestion.title}
        </div>
      </div>
      
      <div style={{
        background: '#e7f3ff',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '10px'
      }}>
        <strong>Suggestion:</strong> {suggestion.suggestion}
      </div>
      
      {suggestion.tactics && (
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>
            Tactics:
          </div>
          <ul style={{ margin: '0 0 0 20px', fontSize: '0.9rem' }}>
            {suggestion.tactics.map((tactic, idx) => (
              <li key={idx} style={{ marginBottom: '3px' }}>{tactic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, target }) {
  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '8px',
      padding: '15px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e3c72' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
        Target: {target}
      </div>
    </div>
  );
}
