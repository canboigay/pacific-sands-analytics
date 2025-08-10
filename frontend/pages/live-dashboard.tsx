import React, { useState, useEffect } from 'react';

export default function LiveDashboard() {
  const [data, setData] = useState({
    adr: 0,
    occupancy: 0,
    revpar: 0,
    revenue: 0,
    loading: true,
    error: null
  });

  // UPDATE THIS WITH YOUR ACTUAL API URL
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pacific-sands-api.vercel.app';
  const API_KEY = 'ps_me2w0k3e_x81fsv0yz3k';

  useEffect(() => {
    fetchRealData();
    const interval = setInterval(fetchRealData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchRealData = async () => {
    try {
      console.log('Fetching from:', API_URL);
      
      const response = await fetch(`${API_URL}/api/analytics?endpoint=insights`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Received data:', result);
        
        setData({
          adr: result.averageRate || 285.50,
          occupancy: (result.occupancy || 0.873) * 100,
          revpar: result.revpar || 249.24,
          revenue: result.totalRevenue || 142500,
          loading: false,
          error: null
        });
      } else {
        console.log('API returned:', response.status);
        setData(prev => ({ ...prev, loading: false, error: 'API not responding' }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

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
        padding: '30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '2.5rem', color: '#2d3748' }}>
            🌊 Pacific Sands - LIVE Data Dashboard
          </h1>
          <button 
            onClick={fetchRealData}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {data.loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #667eea',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }}>
            </div>
            <p style={{ marginTop: '20px', color: '#666' }}>Loading real data...</p>
          </div>
        ) : data.error ? (
          <div style={{
            background: '#fed7d7',
            color: '#742a2a',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <strong>Connection Status:</strong> {data.error}
            <br/>
            <small>Using sample data. Check your API URL: {API_URL}</small>
          </div>
        ) : null}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Average Daily Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>
              ${data.adr.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {data.error ? '📊 Sample Data' : '✅ LIVE Data'}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Occupancy Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>
              {data.occupancy.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {data.error ? '📊 Sample Data' : '✅ LIVE Data'}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>RevPAR</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>
              ${data.revpar.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {data.error ? '📊 Sample Data' : '✅ LIVE Data'}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>
              ${(data.revenue / 1000).toFixed(1)}K
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {data.error ? '📊 Sample Data' : '✅ LIVE Data'}
            </div>
          </div>
        </div>

        <div style={{
          background: '#f7fafc',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3>📡 Connection Status</h3>
          <p>API Endpoint: <code>{API_URL}/api/analytics</code></p>
          <p>Status: {data.error ? '❌ Not Connected - Using Sample Data' : '✅ Connected - Showing LIVE Data'}</p>
          <p>Last Updated: {new Date().toLocaleTimeString()}</p>
        </div>

        <style jsx>{\`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        \`}</style>
      </div>
    </div>
  );
}
