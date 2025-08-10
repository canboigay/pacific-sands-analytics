'use client';

import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    occupancy: 0.82,
    adr: 285,
    revpar: 233.70,
    revenue: 125000,
    bookings: 438
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        occupancy: 0.75 + Math.random() * 0.15,
        adr: 270 + Math.random() * 60,
        revpar: 200 + Math.random() * 50,
        revenue: 120000 + Math.random() * 20000,
        bookings: 400 + Math.floor(Math.random() * 100)
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'RMS Priority Alerts',
      description: 'Real-time revenue management alerts',
      icon: '🚨',
      link: '/rms-alerts',
      color: '#dc3545'
    },
    {
      title: 'Admin Settings',
      description: 'Configure thresholds and system settings',
      icon: '🔒',
      link: '/admin',
      color: '#6f42c1'
    },
    {
      title: 'Analytics',
      description: 'Performance metrics and trends',
      icon: '📊',
      link: '/analytics',
      color: '#28a745'
    },
    {
      title: 'Reports',
      description: 'Revenue and occupancy reports',
      icon: '📈',
      link: '/reports',
      color: '#007bff'
    }
  ];

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
            Revenue Management Dashboard • Live Metrics
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            borderTop: '4px solid #4CAF50'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
              Occupancy Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {(metrics.occupancy * 100).toFixed(1)}%
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            borderTop: '4px solid #2196F3'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
              Average Daily Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${metrics.adr.toFixed(0)}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            borderTop: '4px solid #FF9800'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
              RevPAR
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${metrics.revpar.toFixed(0)}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            borderTop: '4px solid #9C27B0'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
              MTD Revenue
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${(metrics.revenue / 1000).toFixed(0)}K
            </div>
          </div>
        </div>

        <h2 style={{ color: 'white', marginBottom: '20px' }}>Quick Actions</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {cards.map((card, idx) => (
            <a
              key={idx}
              href={card.link}
              style={{
                background: 'white',
                borderRadius: '15px',
                padding: '25px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                borderLeft: `5px solid ${card.color}`,
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                    {card.title}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                    {card.description}
                  </p>
                </div>
                <span style={{ color: card.color, fontSize: '1.2rem' }}>→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
