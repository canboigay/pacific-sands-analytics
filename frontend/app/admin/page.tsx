'use client';
import { useState, useRef } from 'react';

export default function AdminSettings() {
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [fileType, setFileType] = useState('auto');
  const [importHistory, setImportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadProgress(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ps_me2w0k3e_x81fsv0yz3k'
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus(`✅ Successfully imported ${result.details.recordsImported} records into ${result.details.tableName}`);
        // Refresh history if shown
        if (showHistory) {
          await fetchImportHistory();
        }
      } else {
        setUploadStatus(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Upload error: ${error.message}`);
    } finally {
      setUploadProgress(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('/api/upload', {
        headers: {
          'Authorization': 'Bearer ps_me2w0k3e_x81fsv0yz3k'
        }
      });
      const result = await response.json();
      if (result.success) {
        setImportHistory(result.imports || []);
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    }
  };

  const toggleHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      await fetchImportHistory();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
            🔒 Admin Panel
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Data Upload & System Configuration
          </p>
        </div>

        {/* Data Upload Section */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '25px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#1e3c72' }}>
            📁 Data Upload
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Upload CSV files containing occupancy, pace reports, or rate shopping data
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>
                File Type Detection
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="auto">Auto-detect file type</option>
                <option value="occupancy">Occupancy Data</option>
                <option value="pace">Pace Reports</option>
                <option value="rateshop">Rate Shopping Data</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>
                CSV File Upload
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploadProgress}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: uploadProgress ? '#f3f4f6' : 'white',
                  cursor: uploadProgress ? 'not-allowed' : 'pointer'
                }}
              />
            </div>
          </div>

          {uploadStatus && (
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: uploadStatus.includes('✅') ? '#d1fae5' : uploadStatus.includes('❌') ? '#fee2e2' : '#e0f2fe',
              border: `2px solid ${uploadStatus.includes('✅') ? '#10b981' : uploadStatus.includes('❌') ? '#ef4444' : '#0ea5e9'}`,
              color: uploadStatus.includes('✅') ? '#065f46' : uploadStatus.includes('❌') ? '#991b1b' : '#0c4a6e',
              fontWeight: '500'
            }}>
              {uploadProgress ? '⏳ Processing...' : uploadStatus}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={toggleHistory}
              style={{
                padding: '10px 20px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 {showHistory ? 'Hide' : 'Show'} Import History
            </button>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              Max file size: 10MB • Supported: CSV files only
            </span>
          </div>
        </div>

        {/* Import History Section */}
        {showHistory && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            marginBottom: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1e3c72', marginBottom: '20px' }}>
              📈 Import History
            </h3>
            
            {importHistory.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No imports yet</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>File Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Records</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((imp, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{imp.fileName}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: imp.fileType === 'occupancy' ? '#ddd6fe' : imp.fileType === 'pace' ? '#fef3c7' : '#dcfce7',
                            color: imp.fileType === 'occupancy' ? '#5b21b6' : imp.fileType === 'pace' ? '#92400e' : '#166534'
                          }}>
                            {imp.fileType}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{imp.recordCount}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: imp.status === 'completed' ? '#d1fae5' : '#fee2e2',
                            color: imp.status === 'completed' ? '#065f46' : '#991b1b'
                          }}>
                            {imp.status === 'completed' ? '✅' : '❌'} {imp.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>
                          {new Date(imp.importedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings Section */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#1e3c72' }}>
            ⚙️ System Thresholds
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
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
