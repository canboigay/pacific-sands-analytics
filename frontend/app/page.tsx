export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(14, 165, 233, 0.25)'
            }}>🏖️</div>
          </div>
          <h1 style={{
            fontSize: '3rem',
            margin: 0,
            color: '#0f172a',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            marginBottom: '12px'
          }}>
            Pacific Sands Resort
          </h1>
          <p style={{ 
            color: '#64748b', 
            marginTop: '0', 
            fontSize: '1.25rem',
            fontWeight: '400',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Revenue Management & Analytics Dashboard
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <a href='/rms-alerts' style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>🚨</div>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: '600' }}>RMS Dashboard</h3>
                <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.875rem' }}>Revenue management & real-time analytics</p>
              </div>
            </div>
          </a>

          <a href='/admin' style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
            }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>🔒</div>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: '600' }}>Admin Panel</h3>
                <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.875rem' }}>Data upload & system configuration</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
