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
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: '2.2rem',
                margin: 0,
                color: '#1e3c72'
              }}>
                🏨 Pacific Sands RMS Dashboard
              </h1>
              <p style={{ color: '#666', marginTop: '10px', margin: 0 }}>
                Revenue Management System • Real-time Analytics & Forecasting
              </p>
            </div>
            <div style={{
              background: '#28a745',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
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
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            borderLeft: '5px solid #dc3545'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc3545' }}>🔔 Priority Actions</h3>
            
            <div style={{
              border: '2px solid #dc3545',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px',
              background: '#fee2e2'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#dc3545' }}>
                🏨 Low Occupancy Alert
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                Current: 61.5% | Target: 70%
              </p>
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <strong>ACTION:</strong> Apply -5% to -10% discount on 2BR+ units for next 7 days
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>📅 August Peak Strategy</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>
                Optimize for revenue during high demand period
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem' }}>
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
            color: 'white',
            textDecoration: 'none',
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'inline-block',
            fontWeight: '500'
          }}>
            ← Back to Dashboard
          </a>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px' 
          }}>
            <button style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              📊 Export Report
            </button>
            <button style={{
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              ⚙️ Configure Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
