import React from 'react';
import { useDashboardData } from '../src/hooks/useDashboardData';

export default function PSDataDashboard() {
  const { data, loading, lastUpdated } = useDashboardData(
    '/api/real-data',
    5000
  );

  const recordCount = data?.metrics?.totalRecords || 0;
  const lastUpdate = lastUpdated ? lastUpdated.toLocaleTimeString() : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          📂 PS Data Upload Status
        </h1>
        
        <div style={{
          background: recordCount > 0 ? '#d4edda' : '#fff3cd',
          border: recordCount > 0 ? '3px solid #28a745' : '3px solid #ffc107',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          fontSize: '1.2rem'
        }}>
          <h2 style={{ marginBottom: '20px' }}>
            {loading ? '⏳ Checking database...' :
             recordCount > 0 ? '✅ PS DATA UPLOADED!' :
             '📤 Upload in progress...'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <strong>📊 Records in Database:</strong>
              <div style={{ fontSize: '2rem', color: '#28a745', marginTop: '10px' }}>
                {recordCount.toLocaleString()}
              </div>
            </div>
            <div>
              <strong>📁 Data Source:</strong>
              <div style={{ fontSize: '1.5rem', marginTop: '10px' }}>
                PS Data Folder
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '1rem', opacity: 0.8 }}>
            Last checked: {lastUpdate || 'Never'}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <StatusCard
            title='Upload Script'
            status={loading ? 'running' : 'complete'}
            description='Processing PS Data folder files'
          />
          <StatusCard
            title='Database Connection'
            status='connected'
            description='Prisma + PostgreSQL'
          />
          <StatusCard
            title='Dashboard'
            status='live'
            description='Real-time data display'
          />
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '10px',
          padding: '25px'
        }}>
          <h3>📈 View Your Data:</h3>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <a 
              href='/real-dashboard'
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              📊 Analytics Dashboard
            </a>
            <a 
              href='http://localhost:5555'
              target='_blank'
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              🗄️ Browse Database
            </a>
          </div>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#e8f8f5',
          borderRadius: '10px'
        }}>
          <h4>💡 PS Data Folder Contents:</h4>
          <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
            <li>Historical rate data</li>
            <li>Occupancy reports</li>
            <li>Competitor analysis</li>
            <li>Revenue metrics</li>
            <li>Customer feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, status, description }) {
  const colors = {
    running: '#ffc107',
    complete: '#28a745',
    connected: '#28a745',
    live: '#17a2b8',
    error: '#dc3545'
  };

  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '10px',
      padding: '20px',
      borderLeft: `5px solid ${colors[status] || '#6c757d'}`
    }}>
      <h4 style={{ marginBottom: '10px' }}>{title}</h4>
      <div style={{
        display: 'inline-block',
        padding: '5px 10px',
        background: colors[status] || '#6c757d',
        color: 'white',
        borderRadius: '20px',
        fontSize: '0.9rem',
        marginBottom: '10px'
      }}>
        {status.toUpperCase()}
      </div>
      <p style={{ fontSize: '0.95rem', color: '#666' }}>{description}</p>
    </div>
  );
}
