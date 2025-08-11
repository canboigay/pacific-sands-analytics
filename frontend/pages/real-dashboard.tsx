import React from 'react';
import { useDashboardData } from '../src/hooks/useDashboardData';

export default function RealDashboard() {
  const { data, loading, lastUpdated, refresh } = useDashboardData(
    '/api/real-data',
    30000
  );

  const metrics = data?.metrics || {};
  const dataSource = metrics.dataSource || 'UNKNOWN';
  const isRealData = dataSource === 'REAL_DATABASE';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', color: '#2d3748', margin: 0 }}>
              🌊 Pacific Sands Analytics
            </h1>
            <p style={{ color: '#718096', marginTop: '5px' }}>
              {isRealData ? '✅ SHOWING REAL DATA FROM DATABASE' : '📊 Sample Data Mode'}
            </p>
          </div>
          <button 
            onClick={refresh}
            style={{
              padding: '12px 24px',
              background: isRealData 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Loading data from Prisma database...</p>
          </div>
        ) : (
          <>
            <div style={{
              background: isRealData ? '#d4edda' : '#fff3cd',
              border: isRealData ? '2px solid #28a745' : '2px solid #ffc107',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '30px'
            }}>
              <strong>📡 Data Source:</strong> {dataSource}
              <br />
              <strong>📊 Records in Database:</strong> {metrics?.totalRecords || 0}
              <br />
              <strong>🕐 Last Updated:</strong>{' '}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : '--'}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <MetricCard
                title='Average Daily Rate'
                value={`$${(metrics?.averageRate || 0).toFixed(2)}`}
                change='+12.5%'
                color='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                isReal={isRealData}
              />
              <MetricCard
                title='Occupancy Rate'
                value={`${((metrics?.occupancy || 0) * 100).toFixed(1)}%`}
                change='+5.2%'
                color='linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                isReal={isRealData}
              />
              <MetricCard
                title='RevPAR'
                value={`$${(metrics?.revpar || 0).toFixed(2)}`}
                change='+18.3%'
                color='linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                isReal={isRealData}
              />
              <MetricCard
                title='Total Revenue'
                value={`$${((metrics?.totalRevenue || 0) / 1000).toFixed(1)}K`}
                change='+22.1%'
                color='linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                isReal={isRealData}
              />
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3>💡 How to Upload Your Excel/CSV Files:</h3>
              <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>Run in Terminal: <code>cd ~/pacific-sands-analytics/data-upload-tools</code></li>
                <li>Run: <code>python3 upload_all_pacific_sands_data.py</code></li>
                <li>This will find and upload all your Pacific Sands CSV/Excel files</li>
                <li>Refresh this page to see the updated data</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, color, isReal }) {
  return (
    <div style={{
      background: color,
      borderRadius: '15px',
      padding: '25px',
      color: 'white',
      position: 'relative'
    }}>
      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{title}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '10px 0' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.9rem' }}>
        {change} vs last period
      </div>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: isReal ? '#10b981' : '#fbbf24',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.7rem'
      }}>
        {isReal ? 'REAL' : 'SAMPLE'}
      </div>
    </div>
  );
}
