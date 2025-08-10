export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          🌊 Pacific Sands Analytics Platform
        </h1>
        
        <div style={{
          background: '#fef5e7',
          border: '2px solid #f39c12',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '30px'
        }}>
          <strong>📊 Data Status:</strong>
          <ul style={{ margin: '10px 0 0 20px' }}>
            <li>Currently showing: <strong>SAMPLE DATA</strong></li>
            <li>Database: Connected ✅</li>
            <li>API: Deployed ✅</li>
            <li>Real data: Needs upload (run upload_real_data.py)</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <a 
            href='/analytics-dashboard.html'
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              📈 View Full Analytics Dashboard
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '5px' }}>
              Complete dashboard with charts (Sample Data)
            </div>
          </a>
          
          <a 
            href='/live-dashboard'
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              🔴 Live Data Dashboard
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '5px' }}>
              Connects to your API (configure API URL first)
            </div>
          </a>
          
          <a 
            href='/dashboard'
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              📊 React Dashboard Component
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '5px' }}>
              Next.js integrated dashboard
            </div>
          </a>
        </div>
        
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#f7fafc', 
          borderRadius: '10px' 
        }}>
          <h3>📋 Sample Metrics (Demo Data)</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '10px',
            marginTop: '10px'
          }}>
            <div>ADR: <strong>$285.50</strong> ↑ 12.5%</div>
            <div>Occupancy: <strong>87.3%</strong> ↑ 5.2%</div>
            <div>RevPAR: <strong>$249.24</strong> ↑ 18.3%</div>
            <div>Revenue: <strong>$142.5K</strong> ↑ 22.1%</div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          background: '#e8f8f5',
          borderRadius: '10px',
          fontSize: '0.9rem'
        }}>
          <strong>💡 To use REAL data:</strong>
          <ol style={{ margin: '10px 0 0 20px' }}>
            <li>Get your API URL from Vercel Dashboard</li>
            <li>Update API_URL in live-dashboard.tsx</li>
            <li>Run: python3 upload_real_data.py</li>
            <li>Refresh the live dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
