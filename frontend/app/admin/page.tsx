export default function AdminSettings() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            🔒 Admin Settings Panel
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Configure system thresholds and alerts
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#1e3c72' }}>
            Occupancy Thresholds
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                Critical (%)
              </label>
              <input
                type='number'
                defaultValue='60'
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                Low (%)
              </label>
              <input
                type='number'
                defaultValue='65'
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                Target (%)
              </label>
              <input
                type='number'
                defaultValue='70'
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                Optimal (%)
              </label>
              <input
                type='number'
                defaultValue='85'
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <h2 style={{ marginTop: '30px', color: '#1e3c72' }}>
            ADR Settings
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                Base Rate ($)
              </label>
              <input
                type='number'
                defaultValue='285'
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                Pickup Threshold ($)
              </label>
              <input
                type='number'
                defaultValue='100'
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}>
              💾 Save Changes
            </button>
            
            <a href='/' style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
