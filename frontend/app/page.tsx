export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🏖️ Pacific Sands Analytics
          </h1>
          <p style={{ color: '#666', marginTop: '10px' }}>
            Revenue Management Dashboard
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <a href='/rms-alerts' style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            borderLeft: '5px solid #dc3545'
          }}>
            <h3>🚨 RMS Priority Alerts</h3>
            <p style={{ color: '#666' }}>View real-time alerts</p>
          </a>

          <a href='/admin' style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            borderLeft: '5px solid #6f42c1'
          }}>
            <h3>🔒 Admin Settings</h3>
            <p style={{ color: '#666' }}>Configure thresholds</p>
          </a>
        </div>
      </div>
    </div>
  );
}
