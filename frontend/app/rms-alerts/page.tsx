import { 
  KPIWidget, 
  ForecastWidget, 
  RevenueOptimizerWidget, 
  CompetitorWidget,
  MarketAlertsWidget 
} from '../../components/RMSWidgets';

export default function RMSAlerts() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: '2.25rem',
                margin: 0,
                color: '#0f172a',
                fontWeight: '700',
                letterSpacing: '-0.025em'
              }}>
                Pacific Sands Resort
              </h1>
              <p style={{ 
                color: '#64748b', 
                marginTop: '8px', 
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: '400'
              }}>
                Revenue Management System • Real-time Analytics & Forecasting
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '24px',
              fontSize: '0.875rem',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                animation: 'pulse 2s infinite'
              }}></div>
              LIVE DATA
            </div>
          </div>
        </div>

        {/* Top Row - KPIs and Alerts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <KPIWidget />
          <MarketAlertsWidget />
        </div>

        {/* Middle Row - Forecasting and Revenue Optimizer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <ForecastWidget />
          <RevenueOptimizerWidget />
        </div>

        {/* Bottom Row - Competitor Analysis and Legacy Alerts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <CompetitorWidget />
          
          {/* Legacy Alert System */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>🔔</div>
              <h3 style={{ 
                margin: 0,
                color: '#dc2626',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>Priority Actions</h3>
            </div>
            
            <div style={{
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              background: '#fef2f2'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#dc2626', fontWeight: '600' }}>
                🏨 Low Occupancy Alert
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#7f1d1d' }}>
                Current: 61.5% | Target: 70%
              </p>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                border: '1px solid #f3f4f6'
              }}>
                <strong>ACTION:</strong> Apply -5% to -10% discount on 2BR+ units for next 7 days
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '600' }}>📅 August Peak Strategy</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#64748b' }}>
                Optimize for revenue during high demand period
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.875rem', color: '#374151' }}>
                <li>Hold rates on weekends (Fri-Sun)</li>
                <li>Monitor compression daily</li>
                <li>Reduce discounts gradually starting Aug 15</li>
                <li>Implement 3-night minimum for peak dates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '30px'
        }}>
          <a href='/' style={{
            color: '#374151',
            textDecoration: 'none',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            display: 'inline-block',
            fontWeight: '500',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}>
            ← Back to Dashboard
          </a>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px' 
          }}>
            <button style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)',
              transition: 'all 0.2s ease'
            }}>
              📊 Export Report
            </button>
            <button style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
              transition: 'all 0.2s ease'
            }}>
              ⚙️ Configure Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
