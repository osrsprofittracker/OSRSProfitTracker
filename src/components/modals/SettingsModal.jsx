import React from 'react';

export default function SettingsModal({ 
  theme, 
  setTheme, 
  numberFormat, 
  setNumberFormat, 
  visibleColumns, 
  setVisibleColumns, 
  onCancel 
}) {
  const columns = [
    { key: 'status', label: 'Status' },
    { key: 'avgBuy', label: 'Avg Buy' },
    { key: 'avgSell', label: 'Avg Sell' },
    { key: 'profit', label: 'Profit' },
    { key: 'limit4h', label: '4H Limit' },
    { key: 'timer', label: 'Timer' },
    { key: 'notes', label: 'Notes' }
  ];

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>

        {/* Theme Setting */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgb(209, 213, 219)', marginBottom: '0.75rem' }}>
            Theme
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: theme === 'dark' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: theme === 'light' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        {/* Number Format Setting */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgb(209, 213, 219)', marginBottom: '0.75rem' }}>
            Number Format
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setNumberFormat('compact')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: numberFormat === 'compact' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              Compact (100K, 1.5M)
            </button>
            <button
              onClick={() => setNumberFormat('full')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: numberFormat === 'full' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                borderRadius: '0.5rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              Full (100,000, 1,500,000)
            </button>
          </div>
        </div>

        {/* Visible Columns Setting */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgb(209, 213, 219)', marginBottom: '0.75rem' }}>
            Visible Columns
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {columns.map(col => (
              <label 
                key={col.key} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.5rem', 
                  background: 'rgb(51, 65, 85)', 
                  borderRadius: '0.5rem', 
                  cursor: 'pointer' 
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgb(71, 85, 105)' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgb(37, 99, 235)',
            borderRadius: '0.5rem',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.875rem',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgb(37, 99, 235)'}
        >
          Done
        </button>
      </div>
    </div>
  );
}