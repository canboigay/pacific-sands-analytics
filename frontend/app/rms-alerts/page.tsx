export default function RMSAlerts() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            margin: 0,
            color: '#1e3c72'
          }}>
            🚨 RMS Priority Alerts Dashboard
          </h1>
          <p style={{ color: '#666', marginTop: '10px' }}>
            Real-time alerts based on master rules
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
          }}>
            <h2>Active Alerts</h2>
            <div style={{
              border: '2px solid #dc3545',
              borderRadius: '10px',
              padding: '15px',
              marginTop: '15px',
              background: '#fee2e2'
            }}>
              <h3 style={{ margin: 0, color: '#dc3545' }}>
                🏨 Low Occupancy Alert
              </h3>
              <p>Current: 68% | Target: 70%</p>
              <div style={{
                background: 'white',
                padding: '10px',
                borderRadius: '5px',
                marginTop: '10px'
              }}>
                <strong>ACTION:</strong> Apply -5% to -10% discount on 2BR+ units
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
          }}>
            <h2>Suggestions</h2>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '15px',
              marginTop: '15px'
            }}>
              <h3 style={{ margin: 0 }}>📅 August Peak Season</h3>
              <p>Optimize for revenue during high demand</p>
              <ul>
                <li>Hold rates on weekends</li>
                <li>Monitor compression daily</li>
                <li>Reduce discounts gradually</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a href='/' style={{
            color: 'white',
            textDecoration: 'none',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
