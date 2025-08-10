import React from 'react';

export default function Dashboard() {
  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <iframe 
        src='/analytics-dashboard.html' 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title='Pacific Sands Analytics Dashboard'
      />
    </div>
  );
}
